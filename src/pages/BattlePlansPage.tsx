import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BattlePlanOptimizationService } from '../services/BattlePlanOptimizationService'
import { WarehouseInventoryImportService } from '../services/WarehouseInventoryImportService'
import { buildMaterialInventoryBalancesFromWorkbookItems } from '../services/MaterialForecastService'
import { generateBattlePlansFromOperations } from '../services/ProductionPipelineService'
import {
  DEFAULT_OPTIMIZATION_CONSTRAINTS,
  DEFAULT_OPTIMIZATION_WEIGHTS,
} from '../services/battlePlanOptimizationConfig'
import StatusBadge from '../components/common/StatusBadge'
import OperationLifecycleActions from '../components/production/OperationLifecycleActions'
import { useAppState } from '../state/AppStateContext'
import type { BattlePlan, BattlePlanTask } from '../types/battlePlans'
import type {
  OptimizationConstraint,
  OptimizationWeights,
  OptimizedBattlePlanProposal,
  OptimizationAcceptMode,
} from '../types/battlePlanOptimization'
import type { Employee } from '../types/employees'
import type { ProductionStepName } from '../types/production'
import type {
  AddTaskGroupDraft,
  BattlePlanChecklistItem,
  BattlePlanEndOfDayReport,
  BattlePlanTaskGroup,
  BattlePlanTaskGroupType,
  BattlePlanWorkItemEntry,
} from '../types/battlePlanWorkflow'
import {
  canApprovePlan,
  regenerateBattlePlans,
  type BacklogReason,
  type GenerationSummary,
  type UnassignedTask,
} from '../services/battlePlanGenerator'
import {
  applyGroupOrderToTasks,
  BP_PRIORITY_ORDER,
  BP_STANDING_NOTE,
  buildReviewTaskText,
  createDefaultEndOfDayReport,
  DEFAULT_CLEANING_TASKS,
  DEFAULT_END_OF_DAY_TASKS,
  DEFAULT_START_OF_DAY_TASKS,
  GROUP_LABELS,
  makeChecklistItems,
  summarizeIncompleteItems,
  toWorkflowGroups,
  withGroupMeta,
} from '../services/battlePlanWorkflowService'
import {
  calculateCompletedMinutes,
  calculatePlannedMinutes,
  calculateRemainingMinutes,
} from '../utils/battlePlanTotals'
import { PRODUCTION_STEP_LABELS, PRODUCTION_STEP_SEQUENCE } from '../utils/productionSteps'

interface WorkerConfigState {
  workerId: string
  selected: boolean
  availableMinutes: number
}

interface PlanTab {
  id: string
  employeeId: string
  label: string
  roleLabel: string
  kind: 'DIRECTOR' | 'WORKER'
  hasPlan: boolean
}

interface CompletionAudit {
  completedAt?: string
  completedBy?: string
}

type OperationUiStatus = 'READY' | 'IN_PROGRESS' | 'COMPLETE' | 'BLOCKED'

const formatLocalDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const createTaskId = (): string =>
  `BPT-${Date.now()}-${Math.floor(Math.random() * 10000)}`

const createPlanId = (): string =>
  `BP-${Date.now()}-${Math.floor(Math.random() * 10000)}`

const roleLabel: Record<Employee['role'], string> = {
  PRODUCTION_DIRECTOR: 'Production Director',
  WORKER: 'Workshop Operator',
  ADMIN: 'Admin',
}

const reasonLabels: Record<BacklogReason, string> = {
  NO_QUALIFIED_WORKER: 'No qualified worker',
  INSUFFICIENT_CAPACITY: 'Not enough available worker minutes',
  MISSING_PREREQUISITE: 'Missing prerequisite',
  JOB_ON_HOLD: 'Job on hold',
}

const getEmployeeName = (employees: Employee[], employeeId: string): string =>
  employees.find((employee) => employee.id === employeeId)?.name ?? employeeId

const applyOrder = (tasks: BattlePlanTask[]): BattlePlanTask[] =>
  tasks.map((task, index) => ({ ...task, sortOrder: index + 1 }))

const formatStatus = (value: string): string => value.replace('_', ' ')

const toCsvIds = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

const BattlePlansPage = () => {
  const navigate = useNavigate()
  const inventoryImportService = useMemo(() => new WarehouseInventoryImportService(), [])
  const {
    employees,
    productionJobs,
    battlePlans,
    createBattlePlan,
    replaceBattlePlansForDate,
    saveBattlePlan,
    completeProductionStep,
    addActivityLog,
    activityLogs,
    operationBattlePlanItems,
    productionOperations,
    scheduleResult,
    optimizationWeights: savedOptimizationWeights,
    optimizationConstraints: savedOptimizationConstraints,
    saveOptimizationSettings: persistOptimizationSettings,
  } = useAppState()

  const today = formatLocalDate(new Date())
  const director = employees.find((employee) => employee.role === 'PRODUCTION_DIRECTOR')
  const workers = useMemo(
    () => employees.filter((employee) => employee.role === 'WORKER' && employee.active),
    [employees],
  )

  const scheduleEntryByOperationId = useMemo(
    () => new Map(scheduleResult.entries.map((entry) => [entry.operationId, entry])),
    [scheduleResult.entries],
  )
  const scheduleEntryByTaskId = useMemo(
    () => new Map(battlePlans.flatMap((plan) => plan.tasks.map((task) => [
      task.id,
      task.productionOperationId ? scheduleEntryByOperationId.get(task.productionOperationId) : undefined,
    ] as const))),
    [battlePlans, scheduleEntryByOperationId],
  )
  const capacityByEmployeeId = useMemo(
    () => new Map(scheduleResult.employeeCapacity.map((capacity) => [capacity.employeeId, capacity])),
    [scheduleResult.employeeCapacity],
  )
  const formatLatestScheduledFinish = (taskIds: string[]): string => {
    const latestFinish = taskIds
      .map((taskId) => scheduleEntryByTaskId.get(taskId)?.plannedFinish)
      .filter((finish): finish is string => Boolean(finish))
      .sort()
      .at(-1)
    return latestFinish ? new Date(latestFinish).toLocaleString() : '--'
  }

  const [generationDate, setGenerationDate] = useState(today)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [workerConfigs, setWorkerConfigs] = useState<WorkerConfigState[]>(
    workers.map((worker) => ({
      workerId: worker.id,
      selected: true,
      availableMinutes: worker.defaultAvailableMinutes,
    })),
  )
  const [warnings, setWarnings] = useState<string[]>([])
  const [generationSummary, setGenerationSummary] = useState<GenerationSummary | null>(null)
  const [unassignedBacklog, setUnassignedBacklog] = useState<UnassignedTask[]>([])
  const [editModeByPlan, setEditModeByPlan] = useState<Record<string, boolean>>({})
  const [completionAudits, setCompletionAudits] = useState<Record<string, CompletionAudit>>({})
  const [checklistsByKey, setChecklistsByKey] = useState<Record<string, BattlePlanChecklistItem[]>>({})
  const [arrivalTimesByPlan, setArrivalTimesByPlan] = useState<Record<string, string>>({})
  const [departureTimesByPlan, setDepartureTimesByPlan] = useState<Record<string, string>>({})
  const [endOfDayReportsByPlan, setEndOfDayReportsByPlan] = useState<Record<string, BattlePlanEndOfDayReport>>({})
  const [selectedGroupWorkers, setSelectedGroupWorkers] = useState<Record<string, string>>({})
  const [startedGroupsByPlan, setStartedGroupsByPlan] = useState<Record<string, Record<string, boolean>>>({})
  const [expandedCompletedGroupsByPlan, setExpandedCompletedGroupsByPlan] = useState<Record<string, Record<string, boolean>>>({})

  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
  const [optimizationProposal, setOptimizationProposal] = useState<OptimizedBattlePlanProposal | null>(null)
  const [proposalSelectedEmployeeId, setProposalSelectedEmployeeId] = useState('')
  const [proposalSelectedOperationIds, setProposalSelectedOperationIds] = useState<Record<string, boolean>>({})
  const [proposalEditMode, setProposalEditMode] = useState(false)
  const [optimizationWeights, setOptimizationWeights] = useState<OptimizationWeights>(savedOptimizationWeights)
  const [optimizationConstraints, setOptimizationConstraints] = useState<OptimizationConstraint>(savedOptimizationConstraints)
  const [excludedEmployeeDraft, setExcludedEmployeeDraft] = useState(
    () => savedOptimizationConstraints.excludedEmployeeIds.join(', '),
  )
  const [protectedWorkItemsDraft, setProtectedWorkItemsDraft] = useState(
    () => savedOptimizationConstraints.protectedWorkItemIds.join(', '),
  )
  const [optimizationSettingsStatus, setOptimizationSettingsStatus] = useState('')
  const [addGroupDraft, setAddGroupDraft] = useState<AddTaskGroupDraft>({
    groupType: 'FRAMES_TO_MAKE',
    customGroupName: '',
    assignedEmployeeId: workers[0]?.id ?? '',
    estimatedMinutes: 60,
    groupNotes: '',
    workItemIds: [],
    productionStep: 'FRAME_MADE',
    sequencePosition: 1,
  })

  useEffect(() => {
    setWorkerConfigs((currentConfigs) =>
      workers.map((worker) => {
        const current = currentConfigs.find((candidate) => candidate.workerId === worker.id)
        return {
          workerId: worker.id,
          selected: current?.selected ?? true,
          availableMinutes: current?.availableMinutes ?? worker.defaultAvailableMinutes,
        }
      }),
    )
  }, [workers])

  useEffect(() => {
    setOptimizationConstraints((current) => ({
      ...current,
      excludedEmployeeIds: toCsvIds(excludedEmployeeDraft),
      protectedWorkItemIds: toCsvIds(protectedWorkItemsDraft),
    }))
  }, [excludedEmployeeDraft, protectedWorkItemsDraft])

  const plansForDate = useMemo(
    () => battlePlans.filter((plan) => plan.date === generationDate),
    [battlePlans, generationDate],
  )

  const workerPlans = useMemo(
    () =>
      plansForDate
        .filter((plan) => {
          const employee = employees.find((candidate) => candidate.id === plan.assignedWorkerId)
          return employee?.role === 'WORKER' && employee.active
        })
        .sort((a, b) =>
          getEmployeeName(employees, a.assignedWorkerId).localeCompare(
            getEmployeeName(employees, b.assignedWorkerId),
          ),
        ),
    [plansForDate, employees],
  )

  const directorPlan = useMemo(
    () => plansForDate.find((plan) => plan.assignedWorkerId === director?.id),
    [plansForDate, director],
  )

  const tabs = useMemo(() => {
    const result: PlanTab[] = []

    if (director) {
      result.push({
        id: `director:${director.id}`,
        employeeId: director.id,
        label: 'Production Director',
        roleLabel: roleLabel[director.role],
        kind: 'DIRECTOR',
        hasPlan: Boolean(directorPlan),
      })
    }

    const workerIds = new Set(workers.map((worker) => worker.id))
    for (const plan of workerPlans) {
      workerIds.add(plan.assignedWorkerId)
    }

    const workerTabs = [...workerIds]
      .map((workerId) => {
        const employee = employees.find((candidate) => candidate.id === workerId)
        const hasPlan = workerPlans.some((plan) => plan.assignedWorkerId === workerId)
        return {
          id: `worker:${workerId}`,
          employeeId: workerId,
          label: employee?.name ?? workerId,
          roleLabel: employee ? roleLabel[employee.role] : 'Worker',
          kind: 'WORKER' as const,
          hasPlan,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))

    return [...result, ...workerTabs]
  }, [director, directorPlan, workers, workerPlans, employees])

  useEffect(() => {
    if (tabs.length === 0) {
      setSelectedEmployeeId('')
      return
    }

    if (tabs.some((tab) => tab.employeeId === selectedEmployeeId)) {
      return
    }

    const preferred = tabs.find((tab) => tab.kind === 'DIRECTOR') ?? tabs[0]
    setSelectedEmployeeId(preferred.employeeId)
  }, [tabs, selectedEmployeeId])

  const selectedTab = tabs.find((tab) => tab.employeeId === selectedEmployeeId)
  const selectedPlan = selectedEmployeeId
    ? plansForDate.find((plan) => plan.assignedWorkerId === selectedEmployeeId)
    : undefined

  const selectedEmployee = selectedEmployeeId
    ? employees.find((employee) => employee.id === selectedEmployeeId)
    : undefined
  const isDirectorView = selectedTab?.kind === 'DIRECTOR'
  const isWorkerView = selectedTab?.kind === 'WORKER'

  const selectedGroups = useMemo(
    () => selectedPlan ? toWorkflowGroups(
      isDirectorView
        ? { ...selectedPlan, tasks: selectedPlan.tasks.filter((task) => task.directorSection === 'PRODUCTION') }
        : selectedPlan,
      productionJobs,
    ) : [],
    [selectedPlan, productionJobs, isDirectorView],
  )
  const directorReviewTasks = useMemo(
    () => isDirectorView ? selectedPlan?.tasks.filter((task) => task.directorSection === 'REVIEW') ?? [] : [],
    [isDirectorView, selectedPlan],
  )
  const selectedProposalPlan = optimizationProposal?.employeePlans.find(
    (plan) => plan.employeeId === proposalSelectedEmployeeId,
  )
  const selectedProposalOperationCount = Object.values(proposalSelectedOperationIds).filter(Boolean).length
  const selectedLifecycleOperations = useMemo(() => {
    if (isDirectorView) return productionOperations
    if (!isWorkerView || !selectedPlan) return []
    const operationIds = new Set(selectedPlan.tasks.map((task) => task.productionOperationId).filter(Boolean))
    return productionOperations.filter((operation) => operationIds.has(operation.id))
  }, [isDirectorView, isWorkerView, productionOperations, selectedPlan])
  const plannedMinutes = selectedPlan ? calculatePlannedMinutes(selectedPlan.tasks) : 0
  const completedMinutes = selectedPlan ? calculateCompletedMinutes(selectedPlan.tasks) : 0
  const remainingMinutes = selectedPlan
    ? calculateRemainingMinutes(selectedPlan.availableMinutes, selectedPlan.tasks)
    : 0

  const capacityUsed =
    selectedPlan && selectedPlan.availableMinutes > 0
      ? Math.round((plannedMinutes / selectedPlan.availableMinutes) * 100)
      : 0

  const carryForwardCount = selectedPlan
    ? selectedPlan.tasks.filter((task) => task.carryForward).length
    : 0

  const startChecklistKey = selectedPlan ? `${selectedPlan.id}:start` : ''
  const cleaningChecklistKey = selectedPlan ? `${selectedPlan.id}:cleaning` : ''
  const endChecklistKey = selectedPlan ? `${selectedPlan.id}:end` : ''

  useEffect(() => {
    if (!selectedPlan) {
      return
    }

    setChecklistsByKey((current) => ({
      ...current,
      [startChecklistKey]: current[startChecklistKey] ?? makeChecklistItems(DEFAULT_START_OF_DAY_TASKS, selectedPlan.id, 'START'),
      [cleaningChecklistKey]: current[cleaningChecklistKey] ?? makeChecklistItems(DEFAULT_CLEANING_TASKS, selectedPlan.id, 'CLEAN'),
      [endChecklistKey]: current[endChecklistKey] ?? makeChecklistItems(DEFAULT_END_OF_DAY_TASKS, selectedPlan.id, 'END'),
    }))

    setEndOfDayReportsByPlan((current) => ({
      ...current,
      [selectedPlan.id]: current[selectedPlan.id] ?? createDefaultEndOfDayReport(),
    }))

    setArrivalTimesByPlan((current) => ({
      ...current,
      [selectedPlan.id]: current[selectedPlan.id] ?? '',
    }))

    setDepartureTimesByPlan((current) => ({
      ...current,
      [selectedPlan.id]: current[selectedPlan.id] ?? '',
    }))
  }, [selectedPlan, startChecklistKey, cleaningChecklistKey, endChecklistKey])

  const startChecklist = selectedPlan ? checklistsByKey[startChecklistKey] ?? [] : []
  const cleaningChecklist = selectedPlan ? checklistsByKey[cleaningChecklistKey] ?? [] : []
  const endChecklist = selectedPlan ? checklistsByKey[endChecklistKey] ?? [] : []

  const isEditMode = selectedPlan ? Boolean(editModeByPlan[selectedPlan.id]) : false

  const isGroupStarted = (planId: string, groupId: string): boolean =>
    Boolean(startedGroupsByPlan[planId]?.[groupId])

  const getGroupUiStatus = (planId: string, group: BattlePlanTaskGroup): OperationUiStatus => {
    if (group.status === 'COMPLETE') {
      return 'COMPLETE'
    }

    if (group.status === 'IN_PROGRESS' || isGroupStarted(planId, group.id)) {
      return 'IN_PROGRESS'
    }

    return canCompleteGroup(group) ? 'READY' : 'BLOCKED'
  }

  const formatGroupUiStatus = (status: OperationUiStatus): string => {
    switch (status) {
      case 'READY':
        return 'Ready'
      case 'IN_PROGRESS':
        return 'In Progress'
      case 'COMPLETE':
        return 'Complete'
      default:
        return 'Blocked'
    }
  }

  const currentOperation = useMemo(() => {
    if (!selectedPlan || !isWorkerView) {
      return undefined
    }

    return selectedGroups.find((group) => getGroupUiStatus(selectedPlan.id, group) !== 'COMPLETE')
  }, [selectedGroups, selectedPlan, isWorkerView, startedGroupsByPlan])

  const createManualPlan = (workerId: string): BattlePlan => {
    const employee = employees.find((candidate) => candidate.id === workerId)

    const plan: BattlePlan = {
      id: createPlanId(),
      date: generationDate,
      assignedWorkerId: workerId,
      createdById: director?.id ?? workerId,
      approvedById: director?.id ?? workerId,
      availableMinutes: employee?.defaultAvailableMinutes ?? 420,
      generationType: 'MANUAL',
      status: 'DRAFT',
      tasks: [],
      endOfDayNotes: '',
    }

    createBattlePlan(plan)
    addActivityLog({
      entityType: 'BattlePlan',
      entityId: plan.id,
      action: 'CREATED',
      actorEmployeeId: director?.id,
      metadata: { workerId },
    })

    return plan
  }

  const getOrCreatePlan = (workerId: string): BattlePlan => {
    const existing = plansForDate.find((plan) => plan.assignedWorkerId === workerId)
    return existing ?? createManualPlan(workerId)
  }

  const saveUpdatedPlan = (plan: BattlePlan, tasks: BattlePlanTask[]): void => {
    saveBattlePlan({ ...plan, tasks: applyOrder(tasks) })
    addActivityLog({
      entityType: 'BattlePlan',
      entityId: plan.id,
      action: 'UPDATED',
      actorEmployeeId: director?.id,
    })
  }

  const generatePlans = (isRegenerate: boolean): void => {
    if (!director) {
      return
    }

    const existingDatePlans = battlePlans.filter((plan) => plan.date === generationDate)
    const hasUnapprovedGenerated = existingDatePlans.some(
      (plan) => plan.generationType === 'AUTOMATIC' && plan.status === 'DRAFT',
    )

    if (isRegenerate && hasUnapprovedGenerated) {
      const shouldContinue = window.confirm(
        'This will replace unlocked incomplete tasks in unapproved generated plans. Continue?',
      )
      if (!shouldContinue) {
        return
      }
    }

    const generated = generateBattlePlansFromOperations({
      date: generationDate,
      operations: operationBattlePlanItems,
      employees,
      workerConfigs,
      directorId: director.id,
    })

    const finalResult = isRegenerate
      ? regenerateBattlePlans(existingDatePlans, generated)
      : generated

    replaceBattlePlansForDate(generationDate, [
      ...finalResult.workerPlans,
      finalResult.directorPlan,
    ])

    setGenerationSummary(finalResult.summary)
    setWarnings(finalResult.summary.warnings)
    setUnassignedBacklog(finalResult.unassignedBacklog)
    addActivityLog({
      entityType: 'BattlePlan',
      entityId: generationDate,
      action: 'UPDATED',
      actorEmployeeId: director.id,
      metadata: { regenerate: isRegenerate },
    })
  }

  const approvePlan = (plan: BattlePlan): void => {
    if (!canApprovePlan(plan.status)) {
      return
    }

    saveBattlePlan({ ...plan, status: 'APPROVED' })
    addActivityLog({
      entityType: 'BattlePlan',
      entityId: plan.id,
      action: 'STATUS_CHANGED',
      actorEmployeeId: director?.id,
      metadata: { status: 'APPROVED' },
    })
  }

  const completePlan = (plan: BattlePlan): void => {
    if (plan.tasks.some((task) => !task.completed)) {
      return
    }

    saveBattlePlan({ ...plan, status: 'COMPLETED' })
    addActivityLog({
      entityType: 'BattlePlan',
      entityId: plan.id,
      action: 'STATUS_CHANGED',
      actorEmployeeId: director?.id,
      metadata: { status: 'COMPLETED' },
    })
  }

  const toggleChecklistItem = (
    key: string,
    itemId: string,
    checked: boolean,
    actorEmployeeId?: string,
  ): void => {
    setChecklistsByKey((current) => {
      const list = current[key] ?? []
      return {
        ...current,
        [key]: list.map((item) =>
          item.id === itemId
            ? {
                ...item,
                checked,
                completedAt: checked ? new Date().toISOString() : undefined,
                completedBy: checked ? actorEmployeeId : undefined,
              }
            : item,
        ),
      }
    })
  }

  const promptActualMinutes = (description: string, suggestedMinutes: number): number | null => {
    const response = window.prompt(
      `Enter actual completion minutes for ${description}:`,
      String(Math.max(1, Math.round(suggestedMinutes))),
    )

    if (response === null) {
      return null
    }

    const parsed = Number(response)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      window.alert('A positive numeric actual minutes value is required to complete and log this operation.')
      return null
    }

    return Math.round(parsed)
  }

  const updateTaskCompletion = (
    plan: BattlePlan,
    entry: BattlePlanWorkItemEntry,
    completed: boolean,
  ): void => {
    const targetTask = plan.tasks.find((task) => task.id === entry.taskId)
    if (completed && targetTask) {
      const actualMinutes = promptActualMinutes(entry.workItemNumber, targetTask.estimatedMinutes)
      if (actualMinutes === null) {
        return
      }

      const employeeId = selectedEmployee?.id
      completeProductionStep({
        jobId: entry.workItemId,
        stepName: entry.productionStep,
        actualMinutes,
        actorEmployeeId: employeeId,
        metadata: {
          planId: plan.id,
          taskId: targetTask.id,
        },
      })

      setCompletionAudits((current) => ({
        ...current,
        [entry.taskId]: {
          completedAt: new Date().toISOString(),
          completedBy: employeeId,
        },
      }))
    }

    const tasks = plan.tasks.map((task) =>
      task.id === entry.taskId ? { ...task, completed } : task,
    )

    saveUpdatedPlan(plan, tasks)
  }

  function canCompleteGroup(group: BattlePlanTaskGroup): boolean {
    const previousGroups = selectedGroups.filter((item) => item.sequence < group.sequence)
    return previousGroups.every((item) => item.status === 'COMPLETE')
  }

  const completeGroup = (plan: BattlePlan, group: BattlePlanTaskGroup): void => {
    const allow = canCompleteGroup(group)
    let overridden = false

    if (!allow) {
      const continueWithOverride = window.confirm(
        'Earlier groups are not complete. Override and continue?',
      )
      if (!continueWithOverride) {
        return
      }
      overridden = true
    }

    const actualMinutesByTaskId = new Map<string, number>()
    for (const item of group.workItems) {
      if (item.completed) {
        continue
      }
      const task = plan.tasks.find((candidate) => candidate.id === item.taskId)
      const suggestedMinutes = task?.estimatedMinutes ?? Math.max(1, Math.floor(group.totalEstimatedMinutes / Math.max(1, group.workItems.length)))
      const actualMinutes = promptActualMinutes(item.workItemNumber, suggestedMinutes)
      if (actualMinutes === null) {
        return
      }
      actualMinutesByTaskId.set(item.taskId, actualMinutes)
    }

    let tasks = [...plan.tasks]

    for (const item of group.workItems) {
      if (!item.completed) {
        tasks = tasks.map((task) =>
          task.id === item.taskId ? { ...task, completed: true } : task,
        )
      }
    }

    saveUpdatedPlan(plan, tasks)

    for (const item of group.workItems) {
      const actualMinutes = actualMinutesByTaskId.get(item.taskId)
      if (!actualMinutes) {
        continue
      }
      completeProductionStep({
        jobId: item.workItemId,
        stepName: item.productionStep,
        actualMinutes,
        actorEmployeeId: director?.id,
        metadata: {
          planId: plan.id,
          taskId: item.taskId,
          groupId: group.id,
        },
      })
    }

    setStartedGroupsByPlan((current) => ({
      ...current,
      [plan.id]: {
        ...(current[plan.id] ?? {}),
        [group.id]: false,
      },
    }))
    addActivityLog({
      entityType: 'BattlePlan',
      entityId: plan.id,
      action: 'STATUS_CHANGED',
      actorEmployeeId: director?.id,
      metadata: {
        groupId: group.id,
        overridden,
      },
    })
  }

  const moveGroup = (plan: BattlePlan, groupId: string, direction: -1 | 1): void => {
    const currentGroups = toWorkflowGroups(plan, productionJobs)
    const index = currentGroups.findIndex((group) => group.id === groupId)
    if (index < 0) {
      return
    }

    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= currentGroups.length) {
      return
    }

    const reordered = [...currentGroups]
    const [group] = reordered.splice(index, 1)
    reordered.splice(nextIndex, 0, group)

    const tasks = applyGroupOrderToTasks(plan, reordered)
    saveUpdatedPlan(plan, tasks)
  }

  const removeGroup = (plan: BattlePlan, groupId: string): void => {
    const currentGroups = toWorkflowGroups(plan, productionJobs)
    const group = currentGroups.find((item) => item.id === groupId)
    if (!group) {
      return
    }

    const taskIds = new Set(group.workItems.map((item) => item.taskId))
    const tasks = plan.tasks.filter((task) => !taskIds.has(task.id))
    saveUpdatedPlan(plan, tasks)
  }

  const reassignGroup = (plan: BattlePlan, groupId: string, workerId: string): void => {
    if (!workerId || workerId === plan.assignedWorkerId) {
      return
    }

    const currentGroups = toWorkflowGroups(plan, productionJobs)
    const group = currentGroups.find((item) => item.id === groupId)
    if (!group) {
      return
    }

    const destination = getOrCreatePlan(workerId)
    const taskIds = new Set(group.workItems.map((item) => item.taskId))
    const sourceTasks = plan.tasks.filter((task) => !taskIds.has(task.id))

    const movedTasks = group.workItems.map((item) => {
      const source = plan.tasks.find((task) => task.id === item.taskId)
      if (!source) {
        return null
      }

      return {
        ...source,
        id: createTaskId(),
        locked: false,
      }
    }).filter((task): task is BattlePlanTask => task !== null)

    saveUpdatedPlan(plan, sourceTasks)
    saveUpdatedPlan(destination, [...destination.tasks, ...movedTasks])
    setSelectedGroupWorkers((current) => ({ ...current, [groupId]: workerId }))
  }

  const submitEndOfDay = (plan: BattlePlan): void => {
    const report = endOfDayReportsByPlan[plan.id] ?? createDefaultEndOfDayReport()
    const incompleteItems = summarizeIncompleteItems(toWorkflowGroups(plan, productionJobs))

    saveBattlePlan({
      ...plan,
      endOfDayNotes: [
        report.notes,
        `Incomplete reason: ${report.incompleteReason}`,
        `Carry forward: ${report.carryForward ? 'Yes' : 'No'}`,
        `Report sent: ${report.reportSent ? 'Yes' : 'No'}`,
        `Departure time: ${report.departureTime || 'n/a'}`,
        `Incomplete items: ${incompleteItems.join(' | ') || 'None'}`,
      ].join('\n'),
    })

    addActivityLog({
      entityType: 'BattlePlan',
      entityId: plan.id,
      action: 'UPDATED',
      actorEmployeeId: selectedEmployee?.id,
      metadata: {
        reportSubmitted: true,
        carryForward: report.carryForward,
      },
    })
  }

  const openAddGroupModal = (): void => {
    if (!selectedPlan) {
      return
    }

    setAddGroupDraft((current) => ({
      ...current,
      assignedEmployeeId: selectedPlan.assignedWorkerId,
      sequencePosition: selectedGroups.length + 1,
      workItemIds: [],
    }))
    setShowAddGroupModal(true)
  }

  const saveAddGroup = (): void => {
    if (!selectedPlan || addGroupDraft.workItemIds.length === 0) {
      return
    }

    const assignedWorkerId = addGroupDraft.assignedEmployeeId || selectedPlan.assignedWorkerId
    const plan = getOrCreatePlan(assignedWorkerId)
    const groupType = addGroupDraft.groupType
    const groupName =
      groupType === 'CUSTOM' && addGroupDraft.customGroupName.trim().length > 0
        ? addGroupDraft.customGroupName.trim()
        : GROUP_LABELS[groupType]
    const groupId = `group-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    const nextTasks: BattlePlanTask[] = addGroupDraft.workItemIds.map((jobId, index) => {
      const job = productionJobs.find((candidate) => candidate.id === jobId)
      const description =
        job
          ? `${job.orderNumber} | ${job.artworkTitle} | ${groupName}`
          : `Work Item ${jobId} | ${groupName}`

      return {
        id: createTaskId(),
        productionJobId: jobId,
        productionStep: addGroupDraft.productionStep,
        description,
        estimatedMinutes: Math.max(1, Math.floor(addGroupDraft.estimatedMinutes / addGroupDraft.workItemIds.length)),
        completed: false,
        sortOrder: plan.tasks.length + index + 1,
        notes: withGroupMeta(addGroupDraft.groupNotes, groupId, groupType, groupName),
        carryForward: false,
        locked: false,
      }
    })

    const merged = [...plan.tasks, ...nextTasks]
    const updatedPlan = { ...plan, tasks: applyOrder(merged) }

    const grouped = toWorkflowGroups(updatedPlan, productionJobs)
    const sourceIndex = grouped.findIndex((group) => group.id === groupId)
    const targetIndex = Math.min(
      Math.max(addGroupDraft.sequencePosition - 1, 0),
      grouped.length - 1,
    )

    if (sourceIndex >= 0 && sourceIndex !== targetIndex) {
      const reordered = [...grouped]
      const [inserted] = reordered.splice(sourceIndex, 1)
      reordered.splice(targetIndex, 0, inserted)
      saveUpdatedPlan(plan, applyGroupOrderToTasks(updatedPlan, reordered))
    } else {
      saveUpdatedPlan(plan, merged)
    }

    setShowAddGroupModal(false)
  }

  const generateProposedPlans = (): void => {
    if (!director) {
      return
    }

    const scenarioConstraints: OptimizationConstraint = {
      ...optimizationConstraints,
      allowOvertime:
        optimizationConstraints.allowOvertime ||
        optimizationConstraints.scenarioMode === 'OVERTIME_ALLOWED',
      prioritizeShipping:
        optimizationConstraints.prioritizeShipping ||
        optimizationConstraints.scenarioMode === 'RUSH_ORDER',
      keepCurrentAssignments:
        optimizationConstraints.keepCurrentAssignments ||
        optimizationConstraints.scenarioMode === 'MOULDING_TOMORROW',
    }

    const service = new BattlePlanOptimizationService({
      planDate: generationDate,
      productionJobs,
      battlePlans,
      employees,
      activityLogs,
      inventoryBalances: buildMaterialInventoryBalancesFromWorkbookItems(
        inventoryImportService.load()?.items ?? [],
      ),
      constraints: scenarioConstraints,
      weights: optimizationWeights,
    })

    const proposal = service.generateProposal(director.id)
    setOptimizationProposal(proposal)
    setProposalSelectedEmployeeId(proposal.employeePlans[0]?.employeeId ?? '')
    setProposalSelectedOperationIds({})

    addActivityLog({
      entityType: 'BattlePlan',
      entityId: proposal.id,
      action: 'OPTIMIZATION_PROPOSAL_GENERATED',
      actorEmployeeId: director.id,
      metadata: {
        planDate: proposal.planDate,
        employeePlanCount: proposal.employeePlans.length,
        unscheduledCount: proposal.unscheduledWork.length,
        scenarioMode: proposal.constraints.scenarioMode,
      },
    })

    if (proposal.constraints.scenarioMode !== 'NONE') {
      addActivityLog({
        entityType: 'BattlePlan',
        entityId: proposal.id,
        action: 'OPTIMIZATION_SCENARIO_RUN',
        actorEmployeeId: director.id,
        metadata: {
          scenarioMode: proposal.constraints.scenarioMode,
        },
      })
    }
  }

  const saveOptimizationSettings = (): void => {
    persistOptimizationSettings(optimizationWeights, optimizationConstraints)
    setOptimizationSettingsStatus('Optimization settings saved.')
  }

  const resetOptimizationSettings = (): void => {
    setOptimizationConstraints(DEFAULT_OPTIMIZATION_CONSTRAINTS)
    setOptimizationWeights(DEFAULT_OPTIMIZATION_WEIGHTS)
    setExcludedEmployeeDraft('')
    setProtectedWorkItemsDraft('')
    persistOptimizationSettings(DEFAULT_OPTIMIZATION_WEIGHTS, DEFAULT_OPTIMIZATION_CONSTRAINTS)
    setOptimizationSettingsStatus('Optimization settings reset to defaults.')
  }

  const rejectProposal = (): void => {
    if (!optimizationProposal || !director) {
      return
    }

    addActivityLog({
      entityType: 'BattlePlan',
      entityId: optimizationProposal.id,
      action: 'OPTIMIZATION_PROPOSAL_REJECTED',
      actorEmployeeId: director.id,
      metadata: {
        planDate: optimizationProposal.planDate,
      },
    })

    setOptimizationProposal(null)
    setProposalSelectedEmployeeId('')
    setProposalSelectedOperationIds({})
    setProposalEditMode(false)
  }

  const acceptProposal = (mode: OptimizationAcceptMode): void => {
    if (!optimizationProposal || !director) {
      return
    }

    const selectedEmployeePlans =
      mode === 'ENTIRE_PROPOSAL'
        ? optimizationProposal.employeePlans
        : mode === 'SELECTED_EMPLOYEE'
          ? optimizationProposal.employeePlans.filter((plan) => plan.employeeId === proposalSelectedEmployeeId)
          : optimizationProposal.employeePlans.filter((plan) =>
              plan.operationGroups.some((group) => proposalSelectedOperationIds[group.id]),
            )

    selectedEmployeePlans.forEach((employeePlan) => {
      const existing = plansForDate.find((plan) => plan.assignedWorkerId === employeePlan.employeeId)
      const lockedTasks = optimizationProposal.constraints.preserveLockedWork && existing
        ? existing.tasks.filter((task) => task.locked)
        : []

      const includedGroups = mode === 'SELECTED_OPERATION'
        ? employeePlan.operationGroups.filter((group) => proposalSelectedOperationIds[group.id])
        : employeePlan.operationGroups

      const proposalTasks: BattlePlanTask[] = includedGroups.flatMap((group) =>
        group.workItemIds.map((workItemId, index) => ({
          id: createTaskId(),
          productionJobId: workItemId,
          productionStep: group.operation,
          description: `${group.workItemNumbers[index] ?? workItemId} | ${group.setupFamily.name}`,
          estimatedMinutes: Math.max(1, Math.round(group.estimatedGroupMinutes / Math.max(1, group.workItemIds.length))),
          completed: false,
          sortOrder: index + 1,
          notes: group.reasons.map((reason) => reason.description).slice(0, 2).join(' | '),
          carryForward: false,
          locked: false,
        })),
      )

      const dedupe = new Set<string>()
      const mergedTasks = [...lockedTasks, ...proposalTasks].filter((task) => {
        const key = `${task.productionJobId}:${task.productionStep}`
        if (dedupe.has(key)) {
          return false
        }
        dedupe.add(key)
        return true
      }).map((task, index) => ({ ...task, sortOrder: index + 1 }))

      const basePlan: BattlePlan = existing
        ? {
            ...existing,
            status: 'DRAFT',
            generationType: 'MANUAL',
            tasks: mergedTasks,
          }
        : {
            id: createPlanId(),
            date: generationDate,
            assignedWorkerId: employeePlan.employeeId,
            createdById: director.id,
            approvedById: director.id,
            availableMinutes: employeePlan.availableMinutes,
            generationType: 'MANUAL',
            status: 'DRAFT',
            tasks: mergedTasks,
            endOfDayNotes: '',
          }

      if (existing) {
        saveBattlePlan(basePlan)
      } else {
        createBattlePlan(basePlan)
      }

      addActivityLog({
        entityType: 'BattlePlan',
        entityId: basePlan.id,
        action: 'OPTIMIZATION_PROPOSAL_ACCEPTED',
        actorEmployeeId: director.id,
        metadata: {
          acceptanceMode: mode,
          operationCount: includedGroups.length,
          preservedLockedTasks: lockedTasks.length,
        },
      })
    })

    addActivityLog({
      entityType: 'BattlePlan',
      entityId: optimizationProposal.id,
      action: 'OPTIMIZATION_PROPOSAL_ACCEPTED',
      actorEmployeeId: director.id,
      metadata: {
        acceptanceMode: mode,
        employeePlansApplied: selectedEmployeePlans.length,
        snapshot: JSON.stringify({
          comparison: optimizationProposal.comparison,
          unscheduled: optimizationProposal.unscheduledWork.length,
        }).slice(0, 1000),
      },
    })

    setOptimizationProposal(null)
    setProposalSelectedEmployeeId('')
    setProposalSelectedOperationIds({})
    setProposalEditMode(false)
  }

  const renderChecklist = (
    key: string,
    items: BattlePlanChecklistItem[],
  ) => (
    <ul className="bp-checklist">
      {items.map((item) => (
        <li key={item.id} className="bp-checklist-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(event) =>
                toggleChecklistItem(
                  key,
                  item.id,
                  event.target.checked,
                  selectedEmployee?.id,
                )
              }
            />
            {item.text}
          </label>
          {item.completedAt ? (
            <p className="subtle bp-checklist-audit">
              Completed {new Date(item.completedAt).toLocaleTimeString()}
              {item.completedBy ? ` by ${getEmployeeName(employees, item.completedBy)}` : ''}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  )

  const renderGroup = (group: BattlePlanTaskGroup, plan: BattlePlan) => {
    const canComplete = canCompleteGroup(group)
    const status = getGroupUiStatus(plan.id, group)
    const collapsed = status === 'COMPLETE' && !Boolean(expandedCompletedGroupsByPlan[plan.id]?.[group.id])
    const completedWorkItems = group.workItems.filter((item) => item.completed).length
    const remainingWorkItems = group.workItems.length - completedWorkItems
    const percentComplete = group.workItems.length > 0
      ? Math.round((completedWorkItems / group.workItems.length) * 100)
      : 0
    const selectedWorker = selectedGroupWorkers[group.id] ?? plan.assignedWorkerId
    const operationTitle = group.operationName.toUpperCase()

    return (
      <article key={group.id} className="bp-operation-card">
        <header className="bp-operation-header">
          <div>
            <h4>{operationTitle}</h4>
            <p className="bp-operation-minutes">{group.totalEstimatedMinutes} Minutes</p>
          </div>
          <span className={`bp-operation-status bp-operation-status-${status.toLowerCase()}`}>
            {formatGroupUiStatus(status)}
          </span>
        </header>

        {status === 'COMPLETE' ? (
          <button
            type="button"
            className="bp-operation-collapse-toggle"
            onClick={() =>
              setExpandedCompletedGroupsByPlan((current) => ({
                ...current,
                [plan.id]: {
                  ...(current[plan.id] ?? {}),
                  [group.id]: collapsed,
                },
              }))
            }
            aria-expanded={!collapsed}
          >
            ✓ {group.operationName}
            <span>Completed {collapsed ? '(Expand)' : '(Collapse)'}</span>
          </button>
        ) : null}

        {!collapsed ? (
          <>
            <div className="bp-operation-meta-grid">
              <p>{group.workItems.length} Work Item{group.workItems.length === 1 ? '' : 's'}</p>
              <p>Assigned: {getEmployeeName(employees, plan.assignedWorkerId)}</p>
              <p>Status: {formatGroupUiStatus(status)}</p>
            </div>

            <div className="bp-operation-progress">
              <div className="bp-operation-progress-head">
                <span>Completed: {completedWorkItems}</span>
                <span>Remaining: {remainingWorkItems}</span>
                <span>{percentComplete}% Complete</span>
              </div>
              <div className="bp-operation-progress-track" aria-label={`${operationTitle} progress`}>
                <span style={{ width: `${percentComplete}%` }} />
              </div>
            </div>

            <div className="bp-operation-actions">
              {isWorkerView ? (
                <>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setStartedGroupsByPlan((current) => ({
                        ...current,
                        [plan.id]: {
                          ...(current[plan.id] ?? {}),
                          [group.id]: true,
                        },
                      }))
                      addActivityLog({
                        entityType: 'BattlePlan',
                        entityId: plan.id,
                        action: 'STATUS_CHANGED',
                        actorEmployeeId: selectedEmployee?.id,
                        metadata: { groupId: group.id, event: 'startOperation' },
                      })
                    }}
                    disabled={status === 'COMPLETE' || status === 'BLOCKED'}
                  >
                    Start Operation
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => completeGroup(plan, group)}
                    disabled={!canComplete}
                    title={canComplete ? '' : 'Complete earlier operations first.'}
                  >
                    Complete Operation
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn" onClick={() => addActivityLog({ entityType: 'BattlePlan', entityId: plan.id, action: 'STATUS_CHANGED', actorEmployeeId: selectedEmployee?.id, metadata: { groupId: group.id, event: 'startGroup' } })}>
                    Start Group
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => completeGroup(plan, group)}
                    disabled={!isEditMode && !canComplete}
                    title={canComplete ? '' : 'Complete earlier groups first or override as Director.'}
                  >
                    Complete Group
                  </button>
                  <button type="button" className="btn" onClick={() => openAddGroupModal()}>
                    Edit Group
                  </button>
                  <button type="button" onClick={() => moveGroup(plan, group.id, -1)} disabled={!isEditMode || group.sequence === 1}>
                    Move Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveGroup(plan, group.id, 1)}
                    disabled={!isEditMode || group.sequence === selectedGroups.length}
                  >
                    Move Down
                  </button>
                  <select
                    value={selectedWorker}
                    onChange={(event) =>
                      setSelectedGroupWorkers((current) => ({
                        ...current,
                        [group.id]: event.target.value,
                      }))
                    }
                  >
                    {workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => reassignGroup(plan, group.id, selectedWorker)}>
                    Reassign
                  </button>
                  <button type="button" onClick={() => removeGroup(plan, group.id)} disabled={!isEditMode}>
                    Remove
                  </button>
                </>
              )}
            </div>

            <ul className="bp-work-item-cards">
              {group.workItems.map((item) => {
                const audit = completionAudits[item.taskId]
                return (
                  <li key={item.id} className={item.completed ? 'bp-work-item-card bp-work-item-card-complete' : 'bp-work-item-card'}>
                    <div className="bp-work-item-head">
                      <strong>{item.artworkTitle}</strong>
                    </div>
                    <p>Order: {item.workItemNumber}</p>
                    <p>Customer: {item.customerOrDestination}</p>
                    <div className="bp-work-item-badges">
                      <span className="bp-step-badge">{PRODUCTION_STEP_LABELS[item.productionStep]}</span>
                      <StatusBadge dueStatus={item.dueStatus} />
                    </div>
                    {item.notes ? <p className="bp-work-item-notes">Special Notes: {item.notes}</p> : null}
                    {audit?.completedAt ? (
                      <p className="subtle">
                        Completed {new Date(audit.completedAt).toLocaleString()}
                        {audit.completedBy ? ` by ${getEmployeeName(employees, audit.completedBy)}` : ''}
                      </p>
                    ) : null}
                    <div className="bp-work-item-actions">
                      {!isWorkerView ? (
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            disabled={!isEditMode && !selectedTab?.kind.includes('DIRECTOR')}
                            onChange={(event) => updateTaskCompletion(plan, item, event.target.checked)}
                          />
                          Complete
                        </label>
                      ) : null}
                      <button type="button" onClick={() => navigate(`/work-items/${item.workItemId}`)}>
                        Open Work Item
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        ) : null}
      </article>
    )
  }

  return (
    <section className="page battle-plans-page">
      <div className="page-heading">
        <h2>Battle Plans</h2>
        <p>ERP workflow execution layout aligned to Warehouse Operator BP sequence.</p>
      </div>

      <div className="panel battle-plan-shared-controls">
        <label>
          Battle Plan Date
          <input
            type="date"
            value={generationDate}
            onChange={(event) => setGenerationDate(event.target.value)}
          />
        </label>

        <div className="button-row">
          <button type="button" className="btn btn-primary" onClick={() => generatePlans(false)}>
            Generate Daily Battle Plans
          </button>
          <button type="button" className="btn" onClick={() => generatePlans(true)}>
            Regenerate Plan
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="work-item-section-header">
          <div>
            <h3>Production Operation Queue</h3>
            <p className="subtle">Automatic Battle Plan intake generated from WorkItem operations.</p>
          </div>
          <span className="badge">Newest 20 of {operationBattlePlanItems.length}</span>
        </div>
        <div className="table-wrap">
          <table className="workshop-table">
            <thead><tr><th>Assigned</th><th>Operation</th><th>Order</th><th>Piece</th><th>Estimate</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>
              {operationBattlePlanItems.slice(-20).reverse().map((item) => (
                <tr key={item.operationId}>
                  <td>{item.assignedEmployee !== 'UNASSIGNED' ? getEmployeeName(employees, item.assignedEmployee) : 'Unassigned'}</td>
                  <td><strong>{item.operation}</strong></td><td>{item.orderNumber}</td><td>{item.pieceLabel}</td>
                  <td>{item.estimatedMinutes} min</td><td>{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '--'}</td><td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="panel battle-plan-tabs-panel">
        <div className="bp-tab-row" role="tablist" aria-label="Employee tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.employeeId === selectedEmployeeId}
              className={tab.employeeId === selectedEmployeeId ? 'bp-tab bp-tab-active' : 'bp-tab'}
              onClick={() => setSelectedEmployeeId(tab.employeeId)}
            >
              <span>{tab.label}</span>
              <small>{tab.hasPlan ? 'Plan ready' : 'No plan'}</small>
            </button>
          ))}
        </div>

        <label className="bp-mobile-tab-select">
          Employee
          <select
            value={selectedEmployeeId}
            onChange={(event) => setSelectedEmployeeId(event.target.value)}
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.employeeId}>
                {tab.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedTab && !selectedPlan ? (
        <article className="panel battle-plan-empty-state">
          <h3>{selectedTab.label}</h3>
          <p>No plan exists for {generationDate}. Create a plan to begin workflow execution.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const plan = createManualPlan(selectedTab.employeeId)
              setSelectedEmployeeId(plan.assignedWorkerId)
              setEditModeByPlan((current) => ({ ...current, [plan.id]: true }))
            }}
          >
            Create Plan
          </button>
        </article>
      ) : null}

      {selectedPlan ? (
        <article className="panel battle-plan-erp-plan">
          <header className="battle-plan-focus-header">
            <div>
              <h3>{getEmployeeName(employees, selectedPlan.assignedWorkerId)}</h3>
              <p>
                {selectedEmployee ? roleLabel[selectedEmployee.role] : selectedTab?.roleLabel} • {generationDate}
              </p>
              <p>
                {selectedPlan.generationType} • {formatStatus(selectedPlan.status)}
              </p>
              <p className="subtle">Arrival: {arrivalTimesByPlan[selectedPlan.id] || '--'} • Departure: {departureTimesByPlan[selectedPlan.id] || '--'}</p>
            </div>

            <div className="bp-header-actions">
              {isDirectorView ? (
                <>
                  <button
                    type="button"
                    className="btn"
                    disabled={!canApprovePlan(selectedPlan.status)}
                    onClick={() => approvePlan(selectedPlan)}
                  >
                    Approve Plan
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      setEditModeByPlan((current) => ({
                        ...current,
                        [selectedPlan.id]: !current[selectedPlan.id],
                      }))
                    }
                  >
                    {isEditMode ? 'Stop Editing' : 'Edit Plan'}
                  </button>
                  <button type="button" className="btn" onClick={() => generatePlans(true)}>
                    Regenerate Plan
                  </button>
                  <button type="button" className="btn btn-primary" onClick={generateProposedPlans}>
                    Generate Proposed Plans
                  </button>
                  <button type="button" className="btn" onClick={openAddGroupModal}>
                    Add Task Group
                  </button>
                  <button type="button" className="btn" onClick={() => window.print()}>
                    Print Plan
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={selectedPlan.tasks.some((task) => !task.completed)}
                    onClick={() => completePlan(selectedPlan)}
                  >
                    Complete Plan
                  </button>
                </>
              ) : null}
            </div>
          </header>

          <div className="battle-plan-summary-strip">
            <span>Available minutes: {selectedPlan.availableMinutes}</span>
            <span>Planned minutes: {plannedMinutes}</span>
            <span>Completed minutes: {completedMinutes}</span>
            <span>Remaining minutes: {remainingMinutes}</span>
            <span>Capacity used: {capacityUsed}%</span>
            <span>Carry-forward count: {carryForwardCount}</span>
          </div>

          <section className="bp-operation-lifecycle" aria-label={`${isDirectorView ? 'Director' : 'Worker'} operation lifecycle controls`}>
            <div className="work-item-section-header">
              <div>
                <h4>{isDirectorView ? 'Director Operation Controls' : 'Worker Operation Execution'}</h4>
                <p className="subtle">Actions update every production projection from the operation source record.</p>
              </div>
              <span className="badge">{selectedLifecycleOperations.length} operations</span>
            </div>
            <div className="bp-operation-lifecycle-list">
              {selectedLifecycleOperations.map((operation) => (
                <article key={operation.id} className="bp-operation-lifecycle-row">
                  <div><strong>{operation.name}</strong><p className="subtle">{operation.status} · {operation.estimatedMinutes} min</p></div>
                  <OperationLifecycleActions
                    operation={operation}
                    role={isDirectorView ? 'DIRECTOR' : 'WORKER'}
                    actorEmployeeId={selectedEmployeeId}
                    battlePlanDate={generationDate}
                    compact
                  />
                </article>
              ))}
              {selectedLifecycleOperations.length === 0 && <p className="subtle">No pipeline operations are attached to this plan.</p>}
            </div>
          </section>

          <section className="bp-note-panel">
            <p>{BP_STANDING_NOTE}</p>
            <ul>
              {BP_PRIORITY_ORDER.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          {selectedTab?.kind === 'DIRECTOR' ? (
            <section className="director-sections">
              <section className="bp-production-groups" aria-label="Director production groups">
                <div className="work-item-section-header">
                  <div>
                    <h4>Production Groups</h4>
                    <p className="subtle">Cut and assembly operations grouped from their operation type.</p>
                  </div>
                  <span className="badge">{selectedGroups.reduce((count, group) => count + group.workItems.length, 0)} operations</span>
                </div>
                {selectedGroups.map((group) => renderGroup(group, selectedPlan))}
                {selectedGroups.length === 0 && <p className="subtle">No ready frame, base, or stretcher operations are scheduled.</p>}
              </section>

              <article className="panel bp-section-card" aria-label="Director review section">
                <div className="work-item-section-header">
                  <div>
                    <h4>Calculation Review</h4>
                    <p className="subtle">Unresolved operations remain here until their calculation is confirmed.</p>
                  </div>
                  <span className="badge">{directorReviewTasks.length}</span>
                </div>
                <ul className="plain-list">
                  {directorReviewTasks.map((task) => (
                    <li key={task.id}>
                      <div>
                        <strong>{task.productionOperationName}</strong>
                        <p>{task.description}</p>
                        <p className="subtle">{task.cutSummary} · Tag: {task.tagStatus?.replaceAll('_', ' ') ?? 'NEEDS REVIEW'}</p>
                      </div>
                      {task.openWorkItemId && <button type="button" className="btn" onClick={() => navigate(`/work-items/${task.openWorkItemId}`)}>Open Work Item</button>}
                    </li>
                  ))}
                  {directorReviewTasks.length === 0 && <li><span className="subtle">No calculations require review.</span></li>}
                </ul>
              </article>

              <article className="panel bp-optimization-controls">
                <h4>Optimization Controls</h4>
                <div className="form-grid bp-optimization-form-grid">
                  <label>
                    Scenario Mode
                    <select
                      value={optimizationConstraints.scenarioMode}
                      onChange={(event) =>
                        setOptimizationConstraints((current) => ({
                          ...current,
                          scenarioMode: event.target.value as OptimizationConstraint['scenarioMode'],
                        }))
                      }
                    >
                      <option value="NONE">None</option>
                      <option value="DANIEL_ABSENT">What if Daniel is absent?</option>
                      <option value="PRINTER_DOWN">What if printer is down?</option>
                      <option value="RUSH_ORDER">What if a rush order arrives?</option>
                      <option value="OVERTIME_ALLOWED">What if overtime is allowed?</option>
                      <option value="MOULDING_TOMORROW">What if moulding arrives tomorrow?</option>
                    </select>
                  </label>

                  <label>
                    Exclude Employees (CSV employee IDs)
                    <input
                      type="text"
                      value={excludedEmployeeDraft}
                      onChange={(event) => setExcludedEmployeeDraft(event.target.value)}
                      placeholder="EMP-002, EMP-003"
                    />
                  </label>

                  <label>
                    Protect WorkItems (CSV production job IDs)
                    <input
                      type="text"
                      value={protectedWorkItemsDraft}
                      onChange={(event) => setProtectedWorkItemsDraft(event.target.value)}
                      placeholder="JOB-1001, JOB-1011"
                    />
                  </label>

                  <label>
                    Cap operation switching
                    <input
                      type="number"
                      min={1}
                      value={optimizationConstraints.capOperationSwitching}
                      onChange={(event) =>
                        setOptimizationConstraints((current) => ({
                          ...current,
                          capOperationSwitching: Math.max(1, Number(event.target.value)),
                        }))
                      }
                    />
                  </label>

                  <label>
                    Reserve emergency minutes
                    <input
                      type="number"
                      min={0}
                      value={optimizationConstraints.reserveEmergencyMinutes}
                      onChange={(event) =>
                        setOptimizationConstraints((current) => ({
                          ...current,
                          reserveEmergencyMinutes: Math.max(0, Number(event.target.value)),
                        }))
                      }
                    />
                  </label>

                  <label>
                    Overtime limit minutes
                    <input
                      type="number"
                      min={0}
                      value={optimizationConstraints.overtimeLimitMinutes}
                      onChange={(event) =>
                        setOptimizationConstraints((current) => ({
                          ...current,
                          overtimeLimitMinutes: Math.max(0, Number(event.target.value)),
                        }))
                      }
                    />
                  </label>

                  <label>
                    Weight: deadline urgency
                    <input
                      type="number"
                      min={0}
                      step={0.05}
                      value={optimizationWeights.deadlineUrgency}
                      onChange={(event) =>
                        setOptimizationWeights((current) => ({
                          ...current,
                          deadlineUrgency: Number(event.target.value),
                        }))
                      }
                    />
                  </label>

                  <label>
                    Weight: setup reduction
                    <input
                      type="number"
                      min={0}
                      step={0.05}
                      value={optimizationWeights.setupReduction}
                      onChange={(event) =>
                        setOptimizationWeights((current) => ({
                          ...current,
                          setupReduction: Number(event.target.value),
                        }))
                      }
                    />
                  </label>

                  <label>
                    Weight: workload balance
                    <input
                      type="number"
                      min={0}
                      step={0.05}
                      value={optimizationWeights.workloadBalance}
                      onChange={(event) =>
                        setOptimizationWeights((current) => ({
                          ...current,
                          workloadBalance: Number(event.target.value),
                        }))
                      }
                    />
                  </label>

                  <label>
                    Weight: overtime penalty
                    <input
                      type="number"
                      min={0}
                      step={0.05}
                      value={optimizationWeights.overtimePenalty}
                      onChange={(event) =>
                        setOptimizationWeights((current) => ({
                          ...current,
                          overtimePenalty: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="button-row bp-optimization-toggle-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={optimizationConstraints.keepCurrentAssignments}
                      onChange={(event) =>
                        setOptimizationConstraints((current) => ({
                          ...current,
                          keepCurrentAssignments: event.target.checked,
                        }))
                      }
                    />
                    Keep current assignments
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={optimizationConstraints.allowOvertime}
                      onChange={(event) =>
                        setOptimizationConstraints((current) => ({
                          ...current,
                          allowOvertime: event.target.checked,
                        }))
                      }
                    />
                    Allow overtime
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={optimizationConstraints.prioritizeShipping}
                      onChange={(event) =>
                        setOptimizationConstraints((current) => ({
                          ...current,
                          prioritizeShipping: event.target.checked,
                        }))
                      }
                    />
                    Prioritize shipping
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={optimizationConstraints.prioritizeOriginals}
                      onChange={(event) =>
                        setOptimizationConstraints((current) => ({
                          ...current,
                          prioritizeOriginals: event.target.checked,
                        }))
                      }
                    />
                    Prioritize originals
                  </label>
                </div>

                <div className="button-row bp-optimization-actions-row">
                  <button type="button" className="btn" onClick={saveOptimizationSettings}>
                    Save Optimization Settings
                  </button>
                  <button type="button" className="btn" onClick={resetOptimizationSettings}>
                    Reset Defaults
                  </button>
                  <button type="button" className="btn btn-primary" onClick={generateProposedPlans}>
                    Regenerate with Adjustments
                  </button>
                </div>

                {optimizationSettingsStatus ? (
                  <p className="subtle bp-optimization-save-status" role="status" aria-live="polite">
                    {optimizationSettingsStatus}
                  </p>
                ) : null}
              </article>

              {optimizationProposal ? (
                <article className="panel bp-optimization-panel">
                  <div className="work-item-section-header">
                    <h4>Proposed Daily Plan</h4>
                    <span className="subtle">Generated {new Date(optimizationProposal.generatedAt).toLocaleString()}</span>
                  </div>

                  <div className="summary-line-list bp-optimization-kpis" role="list" aria-label="Optimization proposal summary">
                    <span>Deadline risks protected: {optimizationProposal.deadlineRisksProtected}</span>
                    <span>Unscheduled work: {optimizationProposal.unscheduledWork.length}</span>
                    <span>Warnings: {optimizationProposal.warnings.length}</span>
                    <span>Confidence: {optimizationProposal.confidence}</span>
                  </div>

                  <p className="subtle bp-optimization-selection-status" role="status" aria-live="polite">
                    {selectedProposalPlan
                      ? `Selected proposal plan for ${selectedProposalPlan.employeeName}. ${selectedProposalOperationCount} operation${selectedProposalOperationCount === 1 ? '' : 's'} selected.`
                      : 'No proposal employee plan selected.'}
                  </p>

                  <div className="table-wrap bp-optimization-table-wrap">
                    <table className="workshop-table bp-optimization-table">
                      <caption className="sr-only">
                        Optimized employee plans. Use the Select button in each row to choose a worker plan for review or partial acceptance.
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Employee</th>
                          <th scope="col">Select</th>
                          <th>Assigned / Available</th>
                          <th>Expected Completed</th>
                          <th>Finish</th>
                          <th>Utilization</th>
                          <th>Warnings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {optimizationProposal.employeePlans.map((plan) => (
                          <tr key={plan.employeeId} className={proposalSelectedEmployeeId === plan.employeeId ? 'bp-optimization-row-selected' : ''}>
                            <td>{plan.employeeName}</td>
                            <td>
                              <button
                                type="button"
                                className={proposalSelectedEmployeeId === plan.employeeId ? 'bp-optimization-select-button bp-optimization-select-button-active' : 'bp-optimization-select-button'}
                                aria-pressed={proposalSelectedEmployeeId === plan.employeeId}
                                aria-describedby={`proposal-plan-${plan.employeeId}`}
                                onClick={() => setProposalSelectedEmployeeId(plan.employeeId)}
                              >
                                {proposalSelectedEmployeeId === plan.employeeId ? 'Selected' : 'Select'}
                              </button>
                            </td>
                            <td>{plan.proposedAssignedMinutes} / {plan.availableMinutes}</td>
                            <td>{plan.expectedCompletedMinutes}</td>
                            <td>{plan.projectedFinishTime}</td>
                            <td>{plan.utilization}%</td>
                            <td>
                              <span id={`proposal-plan-${plan.employeeId}`}>
                                {plan.warnings.length} warning{plan.warnings.length === 1 ? '' : 's'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="button-row bp-optimization-accept-actions">
                    <button type="button" className="btn btn-primary" onClick={() => acceptProposal('ENTIRE_PROPOSAL')}>
                      Accept Entire Proposal
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={!proposalSelectedEmployeeId}
                      onClick={() => acceptProposal('SELECTED_EMPLOYEE')}
                    >
                      Accept Selected Employee Plan
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={!Object.values(proposalSelectedOperationIds).some(Boolean)}
                      onClick={() => acceptProposal('SELECTED_OPERATION')}
                    >
                      Accept Selected Operation
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setProposalEditMode((current) => !current)}
                    >
                      {proposalEditMode ? 'Stop Editing Proposal' : 'Edit Before Accepting'}
                    </button>
                    <button type="button" className="btn" onClick={rejectProposal}>
                      Reject Proposal
                    </button>
                  </div>

                  {proposalSelectedEmployeeId ? (
                    <>
                      <h4 className="bp-optimization-selected-heading" id="proposal-operations-heading">
                        Proposed Operations for {selectedProposalPlan?.employeeName}
                      </h4>
                      <ul className="plain-list bp-optimization-operation-list" aria-labelledby="proposal-operations-heading">
                        {selectedProposalPlan?.operationGroups.map((group) => (
                            <li key={group.id}>
                              <div>
                                <strong>{group.setupFamily.name}</strong>
                                <p>
                                  {group.workItemNumbers.join(', ')} • {group.estimatedGroupMinutes} min • {group.deadlineImpact}
                                </p>
                                <p className="subtle">
                                  Setup: {group.setupMinutes} • Exec: {group.executionMinutes} • Cleanup: {group.cleanupMinutes} • Switch: {group.switchingCostMinutes}
                                </p>
                                <p className="subtle">Reason: {group.reasons[0]?.description}</p>
                              </div>
                              {proposalEditMode ? (
                                <label className="checkbox-label">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(proposalSelectedOperationIds[group.id])}
                                    aria-label={`Select operation group ${group.setupFamily.name} for ${selectedProposalPlan?.employeeName}`}
                                    onChange={(event) =>
                                      setProposalSelectedOperationIds((current) => ({
                                        ...current,
                                        [group.id]: event.target.checked,
                                      }))
                                    }
                                  />
                                  Select
                                </label>
                              ) : (
                                <span className="subtle">{group.confidence}</span>
                              )}
                            </li>
                          ))}
                      </ul>
                    </>
                  ) : null}

                  <h4>Plan Comparison</h4>
                  <div className="summary-line-list bp-optimization-comparison" role="list" aria-label="Plan comparison metrics">
                    <span>Minutes moved: {optimizationProposal.comparison.minutesMoved}</span>
                    <span>WorkItems reassigned: {optimizationProposal.comparison.reassignedWorkItemCount}</span>
                    <span>Late jobs before/after: {optimizationProposal.comparison.projectedLateJobsBefore} / {optimizationProposal.comparison.projectedLateJobsAfter}</span>
                    <span>Carry-forward before/after: {optimizationProposal.comparison.projectedCarryForwardBefore} / {optimizationProposal.comparison.projectedCarryForwardAfter}</span>
                    <span>Setup minutes saved: {optimizationProposal.comparison.setupMinutesSaved}</span>
                    <span>Capacity balance before/after: {optimizationProposal.comparison.capacityBalanceBefore} / {optimizationProposal.comparison.capacityBalanceAfter}</span>
                  </div>

                  <h4>Unscheduled Work</h4>
                  <ul className="plain-list bp-optimization-unscheduled-list">
                    {optimizationProposal.unscheduledWork.length > 0 ? (
                      optimizationProposal.unscheduledWork.map((item) => (
                        <li key={`${item.workItemId}:${item.operation}`}>
                          <div>
                            <strong>{item.orderNumber} • {item.operation}</strong>
                            <p>{item.reason}</p>
                          </div>
                          <span className="subtle">{item.blockingConstraint}</span>
                        </li>
                      ))
                    ) : (
                      <li>
                        <div>
                          <strong>All actionable work scheduled</strong>
                          <p>No unscheduled items under current constraints.</p>
                        </div>
                      </li>
                    )}
                  </ul>
                </article>
              ) : null}

              <article className="panel">
                <h4>Schedule Director View</h4>
                <div className="table-wrap">
                  <table className="workshop-table">
                    <thead>
                      <tr>
                        <th>Worker</th>
                        <th>Predicted Finish</th>
                        <th>Likely Carry-Forward Ops</th>
                        <th>Unassigned Capacity</th>
                        <th>Overload Minutes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workers.map((worker) => {
                        const capacity = capacityByEmployeeId.get(worker.id)
                        const scheduledEntries = scheduleResult.entries
                          .filter((entry) => entry.assignedEmployee === worker.id && entry.status !== 'COMPLETE')
                          .sort((left, right) => left.plannedFinish.localeCompare(right.plannedFinish))
                        const carryForwardCount = scheduledEntries.filter(
                          (entry) => entry.plannedStart.slice(0, 10) > generationDate,
                        ).length
                        return (
                          <tr key={worker.id}>
                            <td>{worker.name}</td>
                            <td>{scheduledEntries.length ? new Date(scheduledEntries.at(-1)!.plannedFinish).toLocaleString() : '--'}</td>
                            <td>{carryForwardCount}</td>
                            <td>{capacity?.remainingMinutes ?? worker.defaultAvailableMinutes}</td>
                            <td>{capacity?.overtimeMinutes ?? 0}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <h4>Suggested Reassignments</h4>
                <ul className="plain-list">
                  {scheduleResult.conflicts.length > 0 ? (
                    scheduleResult.conflicts.slice(0, 5).map((conflict) => (
                      <li key={conflict.id}>
                        <div>
                          <strong>{conflict.type.replaceAll('_', ' ')}</strong>
                          <p>{conflict.message}</p>
                          <p className="subtle">Severity: {conflict.severity}</p>
                        </div>
                        <span className="subtle">{conflict.minutes ? `${conflict.minutes} min` : ''}</span>
                      </li>
                    ))
                  ) : (
                    <li>
                      <div>
                        <strong>No reassignment recommendations</strong>
                        <p>The production schedule has no active conflicts.</p>
                      </div>
                    </li>
                  )}
                </ul>
              </article>

              <article className="panel">
                <h4>Worker Plan Reviews</h4>
                <ul className="plain-list">
                  {workers.map((worker) => {
                    const plan = workerPlans.find((candidate) => candidate.assignedWorkerId === worker.id)
                    const groups = plan ? toWorkflowGroups(plan, productionJobs) : []
                    const incomplete = groups.flatMap((group) =>
                      group.workItems.filter((item) => !item.completed),
                    ).length
                    const planned = plan ? calculatePlannedMinutes(plan.tasks) : 0
                    const used = plan
                      ? Math.round((planned / Math.max(plan.availableMinutes, 1)) * 100)
                      : 0

                    return (
                      <li key={worker.id}>
                        <div>
                          <strong>{worker.name}</strong>
                          <p>{buildReviewTaskText(worker)}</p>
                          <p>
                            Status: {plan ? formatStatus(plan.status) : 'No plan'} • Capacity used: {used}% • Incomplete items: {incomplete}
                          </p>
                        </div>
                        <button type="button" onClick={() => setSelectedEmployeeId(worker.id)}>
                          Open Worker Plan
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </article>

              <article className="panel">
                <h4>Unassigned / Overdue / At-risk</h4>
                <ul className="plain-list">
                  {unassignedBacklog.map((item) => (
                    <li key={item.id}>
                      <div>
                        <strong>{item.description}</strong>
                        <p>{reasonLabels[item.reason]}</p>
                      </div>
                      <span className="subtle">{item.estimatedMinutes} min</span>
                    </li>
                  ))}
                  {productionJobs
                    .filter((job) => job.dueStatus === 'OVERDUE' || job.dueStatus === 'AT_RISK')
                    .map((job) => (
                      <li key={job.id}>
                        <div>
                          <strong>{job.orderNumber}</strong>
                          <p>{job.artworkTitle}</p>
                        </div>
                        <span className="subtle">{job.dueStatus}</span>
                      </li>
                    ))}
                </ul>
              </article>
            </section>
          ) : (
            <>
              {currentOperation ? (
                <section className="panel bp-current-operation-card">
                  <p className="bp-current-operation-eyebrow">Current Operation</p>
                  <h4>{currentOperation.operationName}</h4>
                  <div className="bp-current-operation-meta">
                    <p>Assigned Work Items: {currentOperation.workItems.length}</p>
                    <p>Estimated Time: {currentOperation.totalEstimatedMinutes} min</p>
                    <p>Expected Duration: {Math.round(currentOperation.totalEstimatedMinutes * 1.05)} min</p>
                    <p>Status: {formatGroupUiStatus(getGroupUiStatus(selectedPlan.id, currentOperation))}</p>
                    <p>
                      Likely Completion Time:{' '}
                      {formatLatestScheduledFinish(currentOperation.workItems.map((item) => item.taskId))}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                      setStartedGroupsByPlan((current) => ({
                        ...current,
                        [selectedPlan.id]: {
                          ...(current[selectedPlan.id] ?? {}),
                          [currentOperation.id]: true,
                        },
                      }))
                    }
                  >
                    Start Operation
                  </button>
                </section>
              ) : null}

              <section className="panel bp-section-card">
                <h4>Likely Carry-Forward Operations</h4>
                <ul className="plain-list">
                  {selectedPlan.tasks
                    .filter((task) => !task.completed)
                    .map((task) => {
                      const scheduledEntry = scheduleEntryByTaskId.get(task.id)
                      const carriesForward = Boolean(
                        scheduledEntry && scheduledEntry.plannedStart.slice(0, 10) > selectedPlan.date,
                      )
                      return (
                        <li key={task.id}>
                          <div>
                            <strong>{task.description}</strong>
                            <p>
                              {scheduledEntry
                                ? carriesForward
                                  ? `Scheduled ${new Date(scheduledEntry.plannedStart).toLocaleString()} • ${scheduledEntry.estimatedMinutes} min`
                                  : 'Scheduled within this plan date'
                                : 'Not currently scheduled'}
                            </p>
                          </div>
                          <span className="subtle">{scheduledEntry?.scheduleReason ?? 'Review scheduling conflicts.'}</span>
                        </li>
                      )
                    })}
                </ul>
              </section>

              <section className="panel bp-section-card">
                <h4>1. Start of Day Workshop Tasks</h4>
                <p className="subtle">Estimated section time: {startChecklist.length * 6} mins</p>
                {renderChecklist(startChecklistKey, startChecklist)}
              </section>

              <section className="bp-production-groups">
                {selectedGroups.map((group, index) => (
                  <div key={group.id} className="bp-operation-flow-item">
                    {index > 0 ? <div className="bp-flow-arrow" aria-hidden="true">↓</div> : null}
                    {renderGroup(group, selectedPlan)}
                  </div>
                ))}
              </section>

              <section className="panel bp-section-card">
                <h4>Cleaning</h4>
                <p className="warning">These cleaning tasks are only to be done after the BP has been completed.</p>
                {renderChecklist(cleaningChecklistKey, cleaningChecklist)}
              </section>

              <section className="panel bp-section-card">
                <h4>End of Day Workshop Tasks</h4>
                {renderChecklist(endChecklistKey, endChecklist)}

                <div className="battle-plan-task-editor-grid">
                  <label>
                    End-of-day notes
                    <textarea
                      value={endOfDayReportsByPlan[selectedPlan.id]?.notes ?? ''}
                      onChange={(event) =>
                        setEndOfDayReportsByPlan((current) => ({
                          ...current,
                          [selectedPlan.id]: {
                            ...(current[selectedPlan.id] ?? createDefaultEndOfDayReport()),
                            notes: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Reason not completed
                    <textarea
                      value={endOfDayReportsByPlan[selectedPlan.id]?.incompleteReason ?? ''}
                      onChange={(event) =>
                        setEndOfDayReportsByPlan((current) => ({
                          ...current,
                          [selectedPlan.id]: {
                            ...(current[selectedPlan.id] ?? createDefaultEndOfDayReport()),
                            incompleteReason: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={endOfDayReportsByPlan[selectedPlan.id]?.carryForward ?? false}
                      onChange={(event) =>
                        setEndOfDayReportsByPlan((current) => ({
                          ...current,
                          [selectedPlan.id]: {
                            ...(current[selectedPlan.id] ?? createDefaultEndOfDayReport()),
                            carryForward: event.target.checked,
                          },
                        }))
                      }
                    />
                    Carry forward
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={endOfDayReportsByPlan[selectedPlan.id]?.reportSent ?? false}
                      onChange={(event) =>
                        setEndOfDayReportsByPlan((current) => ({
                          ...current,
                          [selectedPlan.id]: {
                            ...(current[selectedPlan.id] ?? createDefaultEndOfDayReport()),
                            reportSent: event.target.checked,
                          },
                        }))
                      }
                    />
                    Report sent
                  </label>
                  <label>
                    Departure time
                    <input
                      type="time"
                      value={endOfDayReportsByPlan[selectedPlan.id]?.departureTime ?? ''}
                      onChange={(event) =>
                        setEndOfDayReportsByPlan((current) => ({
                          ...current,
                          [selectedPlan.id]: {
                            ...(current[selectedPlan.id] ?? createDefaultEndOfDayReport()),
                            departureTime: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                </div>

                <button type="button" className="btn btn-primary" onClick={() => submitEndOfDay(selectedPlan)}>
                  Submit End-of-Day Report
                </button>
              </section>
            </>
          )}
        </article>
      ) : null}

      <div className="panel">
        <h3>Generation Summary</h3>
        {generationSummary ? (
          <div className="summary-line-list">
            <span>Plans created: {generationSummary.plansCreated}</span>
            <span>Tasks assigned: {generationSummary.tasksAssigned}</span>
            <span>Tasks left unassigned: {generationSummary.tasksUnassigned}</span>
            <span>Workers over capacity: {generationSummary.workersOverCapacity}</span>
            <span>Remaining backlog minutes: {generationSummary.remainingBacklogMinutes}</span>
          </div>
        ) : (
          <p>No generation run yet for this date.</p>
        )}

        {warnings.length > 0 ? (
          <ul className="warning-list">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {showAddGroupModal && selectedPlan ? (
        <div className="bp-modal-backdrop" role="dialog" aria-modal="true">
          <div className="panel bp-modal-card">
            <h3>Add Task Group</h3>
            <div className="battle-plan-task-editor-grid">
              <label>
                Group type
                <select
                  value={addGroupDraft.groupType}
                  onChange={(event) =>
                    setAddGroupDraft((current) => ({
                      ...current,
                      groupType: event.target.value as BattlePlanTaskGroupType,
                    }))
                  }
                >
                  {Object.keys(GROUP_LABELS).map((type) => (
                    <option key={type} value={type}>
                      {GROUP_LABELS[type as BattlePlanTaskGroupType]}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Custom group name
                <input
                  type="text"
                  value={addGroupDraft.customGroupName}
                  onChange={(event) =>
                    setAddGroupDraft((current) => ({
                      ...current,
                      customGroupName: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Assigned employee
                <select
                  value={addGroupDraft.assignedEmployeeId}
                  onChange={(event) =>
                    setAddGroupDraft((current) => ({
                      ...current,
                      assignedEmployeeId: event.target.value,
                    }))
                  }
                >
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Estimated minutes
                <input
                  type="number"
                  min={1}
                  value={addGroupDraft.estimatedMinutes}
                  onChange={(event) =>
                    setAddGroupDraft((current) => ({
                      ...current,
                      estimatedMinutes: Number(event.target.value),
                    }))
                  }
                />
              </label>

              <label>
                Group notes
                <textarea
                  value={addGroupDraft.groupNotes}
                  onChange={(event) =>
                    setAddGroupDraft((current) => ({
                      ...current,
                      groupNotes: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Production step
                <select
                  value={addGroupDraft.productionStep}
                  onChange={(event) =>
                    setAddGroupDraft((current) => ({
                      ...current,
                      productionStep: event.target.value as ProductionStepName,
                    }))
                  }
                >
                  {PRODUCTION_STEP_SEQUENCE.map((step) => (
                    <option key={step} value={step}>
                      {PRODUCTION_STEP_LABELS[step]}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Sequence position
                <input
                  type="number"
                  min={1}
                  value={addGroupDraft.sequencePosition}
                  onChange={(event) =>
                    setAddGroupDraft((current) => ({
                      ...current,
                      sequencePosition: Number(event.target.value),
                    }))
                  }
                />
              </label>
            </div>

            <div className="bp-multiselect-grid">
              {productionJobs.map((job) => {
                const selected = addGroupDraft.workItemIds.includes(job.id)
                return (
                  <label key={job.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(event) => {
                        setAddGroupDraft((current) => {
                          const next = event.target.checked
                            ? [...current.workItemIds, job.id]
                            : current.workItemIds.filter((id) => id !== job.id)
                          return { ...current, workItemIds: next }
                        })
                      }}
                    />
                    {job.orderNumber} | {job.artworkTitle}
                  </label>
                )
              })}
            </div>

            <div className="button-row">
              <button type="button" className="btn btn-primary" onClick={saveAddGroup}>
                Save Task Group
              </button>
              <button type="button" className="btn" onClick={() => setShowAddGroupModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default BattlePlansPage
