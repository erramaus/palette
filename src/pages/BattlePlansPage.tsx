import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppStateContext'
import type { BattlePlan, BattlePlanTask } from '../types/battlePlans'
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
  generateDailyBattlePlans,
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

const formatLocalDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const createTaskId = (): string =>
  `BPT-${Date.now()}-${Math.floor(Math.random() * 10000)}`

const createPlanId = (): string =>
  `BP-${Date.now()}-${Math.floor(Math.random() * 10000)}`

const roleLabel: Record<Employee['role'], string> = {
  PRODUCTION_DIRECTOR: 'Production Director',
  WORKER: 'Worker',
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

const BattlePlansPage = () => {
  const navigate = useNavigate()
  const {
    employees,
    productionJobs,
    battlePlans,
    createBattlePlan,
    replaceBattlePlansForDate,
    saveBattlePlan,
    updateProductionStep,
    addActivityLog,
  } = useAppState()

  const today = formatLocalDate(new Date())
  const director = employees.find((employee) => employee.role === 'PRODUCTION_DIRECTOR')
  const workers = employees.filter((employee) => employee.role === 'WORKER' && employee.active)

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

  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
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

  const plansForDate = useMemo(
    () => battlePlans.filter((plan) => plan.date === generationDate),
    [battlePlans, generationDate],
  )

  const workerPlans = useMemo(
    () =>
      plansForDate
        .filter((plan) => employees.find((employee) => employee.id === plan.assignedWorkerId)?.role === 'WORKER')
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

  const selectedGroups = selectedPlan ? toWorkflowGroups(selectedPlan, productionJobs) : []
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

    const generated = generateDailyBattlePlans({
      date: generationDate,
      jobs: productionJobs,
      employees,
      workerConfigs,
      existingPlans: battlePlans,
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

  const updateTaskCompletion = (
    plan: BattlePlan,
    entry: BattlePlanWorkItemEntry,
    completed: boolean,
  ): void => {
    const tasks = plan.tasks.map((task) =>
      task.id === entry.taskId ? { ...task, completed } : task,
    )

    saveUpdatedPlan(plan, tasks)

    if (completed) {
      const employeeId = selectedEmployee?.id
      setCompletionAudits((current) => ({
        ...current,
        [entry.taskId]: {
          completedAt: new Date().toISOString(),
          completedBy: employeeId,
        },
      }))

      const job = productionJobs.find((candidate) => candidate.id === entry.workItemId)
      if (job && job.steps[entry.productionStep] !== 'COMPLETE') {
        updateProductionStep(job.id, entry.productionStep)
      }

      addActivityLog({
        entityType: 'ProductionStep',
        entityId: `${entry.workItemId}:${entry.productionStep}`,
        action: 'STEP_COMPLETED',
        actorEmployeeId: employeeId,
        metadata: { planId: plan.id },
      })
    }
  }

  const canCompleteGroup = (group: BattlePlanTaskGroup): boolean => {
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

    let tasks = [...plan.tasks]

    for (const item of group.workItems) {
      if (!item.completed) {
        tasks = tasks.map((task) =>
          task.id === item.taskId ? { ...task, completed: true } : task,
        )
      }
    }

    saveUpdatedPlan(plan, tasks)
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

  const renderChecklist = (
    key: string,
    items: BattlePlanChecklistItem[],
    editable: boolean,
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
    const selectedWorker = selectedGroupWorkers[group.id] ?? plan.assignedWorkerId

    return (
      <article key={group.id} className="bp-group-card">
        <header className="bp-group-header">
          <div>
            <h4>
              ({group.sequence}) {group.operationName} - {group.totalEstimatedMinutes} mins
            </h4>
            <p>
              {GROUP_LABELS[group.type]} • {formatStatus(group.status)} • Assigned to{' '}
              {getEmployeeName(employees, plan.assignedWorkerId)}
            </p>
            {group.notes ? <p className="subtle">{group.notes}</p> : null}
          </div>

          <div className="bp-group-actions">
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
          </div>
        </header>

        <ul className="bp-work-item-list">
          {group.workItems.map((item) => {
            const audit = completionAudits[item.taskId]
            return (
              <li key={item.id} className={item.completed ? 'bp-work-item bp-work-item-complete' : 'bp-work-item'}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    disabled={!isEditMode && !selectedTab?.kind.includes('DIRECTOR')}
                    onChange={(event) => updateTaskCompletion(plan, item, event.target.checked)}
                  />
                </label>
                <div>
                  <strong>{item.artworkTitle}</strong>
                  <p>
                    {item.customerOrDestination} • {item.workItemNumber} • {item.productType}
                  </p>
                  <p className="subtle">
                    Due: {item.dueStatus} • Step: {PRODUCTION_STEP_LABELS[item.productionStep]}
                  </p>
                  {item.notes ? <p className="subtle">{item.notes}</p> : null}
                  {audit?.completedAt ? (
                    <p className="subtle">
                      Completed {new Date(audit.completedAt).toLocaleString()}
                      {audit.completedBy ? ` by ${getEmployeeName(employees, audit.completedBy)}` : ''}
                    </p>
                  ) : null}
                </div>
                <button type="button" onClick={() => navigate(`/work-items/${item.workItemId}`)}>
                  Open Work Item
                </button>
              </li>
            )
          })}
        </ul>
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
              <section className="panel bp-section-card">
                <h4>1. Start of Day Workshop Tasks</h4>
                <p className="subtle">Estimated section time: {startChecklist.length * 6} mins</p>
                {renderChecklist(startChecklistKey, startChecklist, isEditMode)}
              </section>

              <section className="bp-production-groups">
                {selectedGroups.map((group) => renderGroup(group, selectedPlan))}
              </section>

              <section className="panel bp-section-card">
                <h4>Cleaning</h4>
                <p className="warning">These cleaning tasks are only to be done after the BP has been completed.</p>
                {renderChecklist(cleaningChecklistKey, cleaningChecklist, isEditMode)}
              </section>

              <section className="panel bp-section-card">
                <h4>End of Day Workshop Tasks</h4>
                {renderChecklist(endChecklistKey, endChecklist, true)}

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
