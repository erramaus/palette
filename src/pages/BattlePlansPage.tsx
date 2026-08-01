import { useEffect, useMemo, useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import type { BattlePlan, BattlePlanStatus, BattlePlanTask } from '../types/battlePlans'
import type { Employee } from '../types/employees'
import type { ProductionStepName } from '../types/production'
import {
  canApprovePlan,
  generateDailyBattlePlans,
  regenerateBattlePlans,
  type BacklogReason,
  type GenerationSummary,
  type UnassignedTask,
} from '../services/battlePlanGenerator'
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

interface TaskEditorDraft {
  productionJobId: string
  productionStep: ProductionStepName
  description: string
  estimatedMinutes: number
  notes: string
  assignedWorkerId: string
  carryForward: boolean
  locked: boolean
}

interface TaskEditorState {
  mode: 'add' | 'edit'
  planId: string
  taskId?: string
}

interface PlanTab {
  id: string
  workerId: string
  kind: 'DIRECTOR' | 'WORKER'
  label: string
  roleLabel: string
  hasPlan: boolean
}

const formatLocalDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const createTaskId = (): string =>
  `BPT-${Date.now()}-${Math.floor(Math.random() * 10000)}`

const createPlanId = (): string =>
  `BP-${Date.now()}-${Math.floor(Math.random() * 10000)}`

const reasonLabels: Record<BacklogReason, string> = {
  NO_QUALIFIED_WORKER: 'No qualified worker',
  INSUFFICIENT_CAPACITY: 'Not enough available worker minutes',
  MISSING_PREREQUISITE: 'Missing prerequisite',
  JOB_ON_HOLD: 'Job on hold',
}

const roleLabel: Record<Employee['role'], string> = {
  PRODUCTION_DIRECTOR: 'Production Director',
  WORKER: 'Worker',
  ADMIN: 'Admin',
}

const getEmployeeName = (employees: Employee[], employeeId: string): string =>
  employees.find((employee) => employee.id === employeeId)?.name ?? employeeId

const applyOrder = (tasks: BattlePlanTask[]): BattlePlanTask[] =>
  tasks.map((task, index) => ({ ...task, sortOrder: index + 1 }))

const buildDefaultTaskDraft = (
  productionJobId: string,
  assignedWorkerId: string,
): TaskEditorDraft => ({
  productionJobId,
  productionStep: 'FILES',
  description: '',
  estimatedMinutes: 45,
  notes: '',
  assignedWorkerId,
  carryForward: false,
  locked: false,
})

const BattlePlansPage = () => {
  const {
    employees,
    productionJobs,
    battlePlans,
    createBattlePlan,
    replaceBattlePlansForDate,
    saveBattlePlan,
  } = useAppState()

  const today = formatLocalDate(new Date())
  const director = employees.find((employee) => employee.role === 'PRODUCTION_DIRECTOR')
  const workers = employees.filter((employee) => employee.role === 'WORKER' && employee.active)

  const [generationDate, setGenerationDate] = useState(today)
  const [workerConfigs, setWorkerConfigs] = useState<WorkerConfigState[]>(
    workers.map((worker) => ({
      workerId: worker.id,
      selected: true,
      availableMinutes: worker.defaultAvailableMinutes,
    })),
  )
  const [unassignedBacklog, setUnassignedBacklog] = useState<UnassignedTask[]>([])
  const [generationSummary, setGenerationSummary] = useState<GenerationSummary | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [selectedTabId, setSelectedTabId] = useState<string>('')
  const [editModeByPlan, setEditModeByPlan] = useState<Record<string, boolean>>({})
  const [taskEditor, setTaskEditor] = useState<TaskEditorState | null>(null)
  const [taskEditorDrafts, setTaskEditorDrafts] = useState<Record<string, TaskEditorDraft>>({})
  const [reassignSelections, setReassignSelections] = useState<Record<string, string>>({})

  useEffect(() => {
    setWorkerConfigs((currentConfigs) =>
      workers.map((worker) => {
        const current = currentConfigs.find((config) => config.workerId === worker.id)

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
        .filter((plan) => {
          const employee = employees.find((candidate) => candidate.id === plan.assignedWorkerId)
          return employee?.role === 'WORKER'
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

  const workerTabs = useMemo(() => {
    const knownWorkers = new Set(workers.map((worker) => worker.id))

    for (const plan of workerPlans) {
      knownWorkers.add(plan.assignedWorkerId)
    }

    return [...knownWorkers]
      .map((workerId) => {
        const employee = employees.find((candidate) => candidate.id === workerId)
        const plan = workerPlans.find((candidate) => candidate.assignedWorkerId === workerId)

        return {
          id: `worker:${workerId}`,
          workerId,
          kind: 'WORKER' as const,
          label: employee?.name ?? workerId,
          roleLabel: employee?.role ? roleLabel[employee.role] : 'Worker',
          hasPlan: Boolean(plan),
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [workers, workerPlans, employees])

  const tabs = useMemo(() => {
    const nextTabs: PlanTab[] = []

    if (director) {
      nextTabs.push({
        id: `director:${director.id}`,
        workerId: director.id,
        kind: 'DIRECTOR',
        label: 'Production Director',
        roleLabel: roleLabel[director.role],
        hasPlan: Boolean(directorPlan),
      })
    }

    return [...nextTabs, ...workerTabs]
  }, [director, directorPlan, workerTabs])

  useEffect(() => {
    if (tabs.length === 0) {
      setSelectedTabId('')
      return
    }

    if (tabs.some((tab) => tab.id === selectedTabId)) {
      return
    }

    const defaultTab = tabs.find((tab) => tab.kind === 'DIRECTOR') ?? tabs[0]
    setSelectedTabId(defaultTab.id)
  }, [tabs, selectedTabId])

  const selectedTab = tabs.find((tab) => tab.id === selectedTabId) ?? null
  const selectedPlan = selectedTab
    ? plansForDate.find((plan) => plan.assignedWorkerId === selectedTab.workerId)
    : undefined

  const orderedTasks = selectedPlan
    ? [...selectedPlan.tasks].sort((a, b) => a.sortOrder - b.sortOrder)
    : []

  const plannedMinutes = selectedPlan ? calculatePlannedMinutes(orderedTasks) : 0
  const completedMinutes = selectedPlan ? calculateCompletedMinutes(orderedTasks) : 0
  const remainingMinutes = selectedPlan
    ? calculateRemainingMinutes(selectedPlan.availableMinutes, orderedTasks)
    : 0

  const completedTasksCount = orderedTasks.filter((task) => task.completed).length
  const remainingTasksCount = Math.max(orderedTasks.length - completedTasksCount, 0)
  const carryForwardCount = orderedTasks.filter((task) => task.carryForward).length
  const capacityUsedPercent =
    selectedPlan && selectedPlan.availableMinutes > 0
      ? Math.round((plannedMinutes / selectedPlan.availableMinutes) * 100)
      : 0

  const isEditMode = selectedPlan ? Boolean(editModeByPlan[selectedPlan.id]) : false

  const updateWorkerConfig = (
    workerId: string,
    updates: Partial<WorkerConfigState>,
  ): void => {
    setWorkerConfigs((currentConfigs) =>
      currentConfigs.map((config) =>
        config.workerId === workerId ? { ...config, ...updates } : config,
      ),
    )
  }

  const createManualPlan = (workerId: string): BattlePlan => {
    const employee = employees.find((candidate) => candidate.id === workerId)

    const nextPlan: BattlePlan = {
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

    createBattlePlan(nextPlan)
    return nextPlan
  }

  const getOrCreatePlanForWorker = (workerId: string): BattlePlan => {
    const existing = plansForDate.find((plan) => plan.assignedWorkerId === workerId)
    if (existing) {
      return existing
    }

    return createManualPlan(workerId)
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
  }

  const saveUpdatedPlan = (plan: BattlePlan, tasks: BattlePlanTask[]): void => {
    saveBattlePlan({ ...plan, tasks: applyOrder(tasks) })
  }

  const moveTask = (plan: BattlePlan, index: number, direction: -1 | 1): void => {
    const sorted = [...plan.tasks].sort((a, b) => a.sortOrder - b.sortOrder)
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= sorted.length) {
      return
    }

    const reordered = [...sorted]
    const [task] = reordered.splice(index, 1)
    reordered.splice(nextIndex, 0, task)
    saveUpdatedPlan(plan, reordered)
  }

  const removeTask = (plan: BattlePlan, taskId: string): void => {
    const tasks = plan.tasks.filter((task) => task.id !== taskId)
    saveUpdatedPlan(plan, tasks)
  }

  const toggleTask = (
    plan: BattlePlan,
    taskId: string,
    updates: Partial<BattlePlanTask>,
  ): void => {
    const tasks = plan.tasks.map((task) =>
      task.id === taskId ? { ...task, ...updates } : task,
    )
    saveUpdatedPlan(plan, tasks)
  }

  const approvePlan = (plan: BattlePlan): void => {
    if (!canApprovePlan(plan.status)) {
      return
    }

    saveBattlePlan({ ...plan, status: 'APPROVED' })
  }

  const completePlan = (plan: BattlePlan): void => {
    if (plan.status === 'COMPLETED') {
      return
    }

    const hasIncompleteTasks = plan.tasks.some((task) => !task.completed)
    if (hasIncompleteTasks) {
      return
    }

    saveBattlePlan({ ...plan, status: 'COMPLETED' })
  }

  const setPlanEditMode = (planId: string, nextEditMode: boolean): void => {
    setEditModeByPlan((current) => ({
      ...current,
      [planId]: nextEditMode,
    }))
  }

  const reassignTask = (
    fromPlan: BattlePlan,
    taskId: string,
    toWorkerId: string,
  ): void => {
    if (toWorkerId === fromPlan.assignedWorkerId) {
      return
    }

    const sourceTasks = [...fromPlan.tasks].sort((a, b) => a.sortOrder - b.sortOrder)
    const task = sourceTasks.find((candidate) => candidate.id === taskId)
    if (!task) {
      return
    }

    const destinationPlan = getOrCreatePlanForWorker(toWorkerId)
    const updatedSource = sourceTasks.filter((candidate) => candidate.id !== taskId)
    const updatedDestination = [
      ...destinationPlan.tasks.sort((a, b) => a.sortOrder - b.sortOrder),
      { ...task, id: createTaskId(), locked: false },
    ]

    saveUpdatedPlan(fromPlan, updatedSource)
    saveUpdatedPlan(destinationPlan, updatedDestination)
    setReassignSelections((current) => ({ ...current, [taskId]: toWorkerId }))
  }

  const openAddTaskEditor = (plan: BattlePlan): void => {
    const existingDraft = taskEditorDrafts[plan.id]
    const fallbackJobId = productionJobs[0]?.id ?? ''

    setTaskEditorDrafts((currentDrafts) => ({
      ...currentDrafts,
      [plan.id]:
        existingDraft ?? buildDefaultTaskDraft(fallbackJobId, plan.assignedWorkerId),
    }))

    setTaskEditor({ mode: 'add', planId: plan.id })
  }

  const openEditTaskEditor = (plan: BattlePlan, task: BattlePlanTask): void => {
    setTaskEditorDrafts((currentDrafts) => ({
      ...currentDrafts,
      [plan.id]: {
        productionJobId: task.productionJobId,
        productionStep: task.productionStep,
        description: task.description,
        estimatedMinutes: task.estimatedMinutes,
        notes: task.notes,
        assignedWorkerId: plan.assignedWorkerId,
        carryForward: task.carryForward,
        locked: task.locked,
      },
    }))

    setTaskEditor({ mode: 'edit', planId: plan.id, taskId: task.id })
  }

  const updateTaskEditorDraft = (
    planId: string,
    updates: Partial<TaskEditorDraft>,
  ): void => {
    setTaskEditorDrafts((currentDrafts) => {
      const fallbackJobId = productionJobs[0]?.id ?? ''
      const selectedWorker = selectedTab?.workerId ?? workers[0]?.id ?? ''
      const baseDraft =
        currentDrafts[planId] ?? buildDefaultTaskDraft(fallbackJobId, selectedWorker)

      return {
        ...currentDrafts,
        [planId]: {
          ...baseDraft,
          ...updates,
        },
      }
    })
  }

  const saveTaskEditor = (): void => {
    if (!taskEditor) {
      return
    }

    const draft = taskEditorDrafts[taskEditor.planId]
    if (!draft || !draft.productionJobId || !draft.assignedWorkerId) {
      return
    }

    const sourcePlan = plansForDate.find((plan) => plan.id === taskEditor.planId)
    if (!sourcePlan) {
      return
    }

    const job = productionJobs.find((candidate) => candidate.id === draft.productionJobId)
    if (!job || draft.estimatedMinutes <= 0) {
      return
    }

    const description = draft.description.trim()
      ? draft.description.trim()
      : `${job.orderNumber} | ${job.artworkTitle} | ${PRODUCTION_STEP_LABELS[draft.productionStep]}`

    if (taskEditor.mode === 'add') {
      const targetPlan = getOrCreatePlanForWorker(draft.assignedWorkerId)

      const nextTask: BattlePlanTask = {
        id: createTaskId(),
        productionJobId: draft.productionJobId,
        productionStep: draft.productionStep,
        description,
        estimatedMinutes: draft.estimatedMinutes,
        completed: false,
        sortOrder: targetPlan.tasks.length + 1,
        notes: draft.notes,
        carryForward: draft.carryForward,
        locked: draft.locked,
      }

      saveUpdatedPlan(targetPlan, [
        ...targetPlan.tasks.sort((a, b) => a.sortOrder - b.sortOrder),
        nextTask,
      ])
      setTaskEditor(null)
      return
    }

    const taskToEdit = sourcePlan.tasks.find((task) => task.id === taskEditor.taskId)
    if (!taskToEdit) {
      return
    }

    const updatedTask: BattlePlanTask = {
      ...taskToEdit,
      productionJobId: draft.productionJobId,
      productionStep: draft.productionStep,
      description,
      estimatedMinutes: draft.estimatedMinutes,
      notes: draft.notes,
      carryForward: draft.carryForward,
      locked: draft.locked,
    }

    if (draft.assignedWorkerId === sourcePlan.assignedWorkerId) {
      saveUpdatedPlan(
        sourcePlan,
        sourcePlan.tasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task,
        ),
      )
      setTaskEditor(null)
      return
    }

    const destinationPlan = getOrCreatePlanForWorker(draft.assignedWorkerId)
    const sourceTasks = sourcePlan.tasks.filter((task) => task.id !== updatedTask.id)
    const destinationTasks = [
      ...destinationPlan.tasks.sort((a, b) => a.sortOrder - b.sortOrder),
      { ...updatedTask, id: createTaskId() },
    ]

    saveUpdatedPlan(sourcePlan, sourceTasks)
    saveUpdatedPlan(destinationPlan, destinationTasks)
    setTaskEditor(null)
  }

  const selectedEmployee = selectedTab
    ? employees.find((employee) => employee.id === selectedTab.workerId)
    : undefined

  const reviewWorkerPlanRows = workerPlans.map((plan) => {
    const tasks = [...plan.tasks].sort((a, b) => a.sortOrder - b.sortOrder)

    return {
      workerName: getEmployeeName(employees, plan.assignedWorkerId),
      planned: calculatePlannedMinutes(tasks),
      remaining: calculateRemainingMinutes(plan.availableMinutes, tasks),
      status: plan.status,
    }
  })

  const overdueJobs = productionJobs.filter((job) => job.dueStatus === 'OVERDUE')
  const atRiskJobs = productionJobs.filter((job) => job.dueStatus === 'AT_RISK')
  const carryForwardTasks = workerPlans.flatMap((plan) =>
    plan.tasks
      .filter((task) => task.carryForward)
      .map((task) => ({
        ...task,
        workerName: getEmployeeName(employees, plan.assignedWorkerId),
      })),
  )

  const actionHint = selectedPlan
    ? !isEditMode
      ? 'Enable edit mode to change tasks.'
      : selectedPlan.status === 'COMPLETED'
        ? 'Completed plans are read-only.'
        : 'Editing enabled for this plan.'
    : 'Create a plan for this worker and date.'

  const formatPlanStatus = (status: BattlePlanStatus): string =>
    status.replace('_', ' ')

  return (
    <section className="page battle-plans-page">
      <div className="page-heading">
        <h2>Battle Plans</h2>
        <p>
          Battle Plans are generated daily from the current Workshop List, independent of
          order importing.
        </p>
      </div>

      <div className="panel">
        <h3>Generation Controls</h3>
        <div className="form-grid battle-plan-shared-controls">
          <label>
            Battle Plan Date
            <input
              type="date"
              value={generationDate}
              onChange={(event) => setGenerationDate(event.target.value)}
            />
          </label>
        </div>

        <div className="worker-config-grid">
          {workers.map((worker) => {
            const config = workerConfigs.find((candidate) => candidate.workerId === worker.id)
            if (!config) {
              return null
            }

            return (
              <article key={worker.id} className="worker-config-card">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.selected}
                    onChange={(event) =>
                      updateWorkerConfig(worker.id, { selected: event.target.checked })
                    }
                  />
                  {worker.name}
                </label>
                <label>
                  Available Minutes
                  <input
                    type="number"
                    min={0}
                    value={config.availableMinutes}
                    onChange={(event) =>
                      updateWorkerConfig(worker.id, {
                        availableMinutes: Number(event.target.value),
                      })
                    }
                  />
                </label>
              </article>
            )
          })}
        </div>

        <div className="button-row">
          <button type="button" className="btn btn-primary" onClick={() => generatePlans(false)}>
            Generate Daily Battle Plans
          </button>
          <button type="button" className="btn" onClick={() => generatePlans(true)}>
            Regenerate
          </button>
        </div>
      </div>

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

      <div className="panel battle-plan-tabs-panel">
        <div className="battle-plan-date-row">
          <p>Selected date: {generationDate}</p>
          <p>{tabs.length} worker tabs available</p>
        </div>

        <div className="bp-tab-row" role="tablist" aria-label="Battle Plan Worker Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.id === selectedTabId}
              className={tab.id === selectedTabId ? 'bp-tab bp-tab-active' : 'bp-tab'}
              onClick={() => setSelectedTabId(tab.id)}
            >
              <span>{tab.label}</span>
              <small>{tab.hasPlan ? 'Plan ready' : 'No plan'}</small>
            </button>
          ))}
        </div>

        <label className="bp-mobile-tab-select">
          Worker View
          <select
            value={selectedTabId}
            onChange={(event) => setSelectedTabId(event.target.value)}
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedTab && !selectedPlan ? (
        <article className="panel battle-plan-empty-state">
          <h3>{selectedTab.label}</h3>
          <p>
            No Battle Plan exists for {selectedTab.label} on {generationDate}.
          </p>
          <div className="button-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const nextPlan = createManualPlan(selectedTab.workerId)
                setSelectedTabId(
                  selectedTab.kind === 'DIRECTOR'
                    ? `director:${nextPlan.assignedWorkerId}`
                    : `worker:${nextPlan.assignedWorkerId}`,
                )
                setPlanEditMode(nextPlan.id, true)
              }}
            >
              Create Plan
            </button>
          </div>
        </article>
      ) : null}

      {selectedTab && selectedPlan ? (
        <article className="panel battle-plan-focus-panel">
          <div className="battle-plan-focus-header">
            <div>
              <h3>{getEmployeeName(employees, selectedPlan.assignedWorkerId)}</h3>
              <p>
                {selectedEmployee ? roleLabel[selectedEmployee.role] : selectedTab.roleLabel} •{' '}
                {generationDate}
              </p>
              <p>
                {selectedPlan.generationType} • {formatPlanStatus(selectedPlan.status)}
              </p>
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
                onClick={() => setPlanEditMode(selectedPlan.id, !isEditMode)}
              >
                {isEditMode ? 'Stop Editing' : 'Edit Plan'}
              </button>
              <button type="button" className="btn" onClick={() => generatePlans(true)}>
                Regenerate Plan
              </button>
              <button
                type="button"
                className="btn"
                disabled={!isEditMode || selectedPlan.status === 'COMPLETED'}
                onClick={() => openAddTaskEditor(selectedPlan)}
              >
                Add Task
              </button>
              <button type="button" className="btn" onClick={() => window.print()}>
                Print Plan
              </button>
              <button
                type="button"
                className="btn"
                disabled={
                  selectedPlan.status === 'COMPLETED' ||
                  selectedPlan.tasks.length === 0 ||
                  selectedPlan.tasks.some((task) => !task.completed)
                }
                onClick={() => completePlan(selectedPlan)}
              >
                Complete Plan
              </button>
            </div>
          </div>

          <p className="subtle">{actionHint}</p>

          <div className="battle-plan-summary-strip">
            <span>Available minutes: {selectedPlan.availableMinutes}</span>
            <span>Planned minutes: {plannedMinutes}</span>
            <span>Completed minutes: {completedMinutes}</span>
            <span>Remaining minutes: {remainingMinutes}</span>
            <span>Capacity used: {capacityUsedPercent}%</span>
            <span>Tasks completed: {completedTasksCount}</span>
            <span>Tasks remaining: {remainingTasksCount}</span>
            <span>Carry-forward count: {carryForwardCount}</span>
          </div>

          {remainingMinutes < 0 ? (
            <p className="warning">Warning: planned minutes exceed available minutes.</p>
          ) : null}

          {selectedTab.kind === 'DIRECTOR' ? (
            <div className="director-sections">
              <section className="panel">
                <h4>Director Tasks</h4>
                {orderedTasks.length === 0 ? (
                  <p>No Director tasks yet.</p>
                ) : (
                  <ul className="plain-list">
                    {orderedTasks.map((task) => (
                      <li key={task.id}>
                        <div>
                          <strong>{task.description}</strong>
                          <p>{task.notes || 'No notes'}</p>
                        </div>
                        <span className="subtle">{task.estimatedMinutes} min</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="panel">
                <h4>Review Tasks by Worker Battle Plan</h4>
                {reviewWorkerPlanRows.length === 0 ? (
                  <p>No worker plans available for this date.</p>
                ) : (
                  <ul className="plain-list">
                    {reviewWorkerPlanRows.map((row) => (
                      <li key={row.workerName}>
                        <div>
                          <strong>{row.workerName}</strong>
                          <p>
                            Planned {row.planned} min • Remaining {row.remaining} min
                          </p>
                        </div>
                        <span className="subtle">{formatPlanStatus(row.status)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="panel">
                <h4>Overdue Follow-up</h4>
                {overdueJobs.length === 0 ? (
                  <p>No overdue jobs.</p>
                ) : (
                  <ul className="plain-list">
                    {overdueJobs.map((job) => (
                      <li key={job.id}>
                        <div>
                          <strong>{job.orderNumber}</strong>
                          <p>{job.artworkTitle}</p>
                        </div>
                        <span className="subtle">{job.dueDate}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="panel">
                <h4>At-risk Job Review</h4>
                {atRiskJobs.length === 0 ? (
                  <p>No at-risk jobs.</p>
                ) : (
                  <ul className="plain-list">
                    {atRiskJobs.map((job) => (
                      <li key={job.id}>
                        <div>
                          <strong>{job.orderNumber}</strong>
                          <p>{job.artworkTitle}</p>
                        </div>
                        <span className="subtle">{job.assignedWorkerId}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="panel">
                <h4>Unassigned Task Review</h4>
                {unassignedBacklog.length === 0 ? (
                  <p>No unassigned backlog tasks.</p>
                ) : (
                  <ul className="plain-list">
                    {unassignedBacklog.map((task) => (
                      <li key={task.id}>
                        <div>
                          <strong>{task.description}</strong>
                          <p>
                            {reasonLabels[task.reason]} • {task.estimatedMinutes} min
                          </p>
                        </div>
                        <span className="subtle">{task.productionStep}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="panel">
                <h4>Carry-forward Review</h4>
                {carryForwardTasks.length === 0 ? (
                  <p>No carry-forward tasks.</p>
                ) : (
                  <ul className="plain-list">
                    {carryForwardTasks.map((task) => (
                      <li key={task.id}>
                        <div>
                          <strong>{task.workerName}</strong>
                          <p>{task.description}</p>
                        </div>
                        <span className="subtle">{task.estimatedMinutes} min</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          ) : (
            <>
              <div className="table-wrap battle-plan-task-table-wrap">
                <table className="bp-table battle-plan-task-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Task</th>
                      <th>Work Item</th>
                      <th>Production Step</th>
                      <th>Estimated Minutes</th>
                      <th>Done</th>
                      <th>Carry Forward</th>
                      <th>Locked</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderedTasks.map((task, index) => {
                      const job = productionJobs.find((candidate) => candidate.id === task.productionJobId)
                      const reassignTarget =
                        reassignSelections[task.id] ?? selectedPlan.assignedWorkerId

                      return (
                        <tr key={task.id}>
                          <td>{job?.orderNumber ?? task.sortOrder}</td>
                          <td>{task.description}</td>
                          <td>
                            <strong>{job?.artworkTitle ?? 'Unknown work item'}</strong>
                            <p>{job?.customerName ?? task.productionJobId}</p>
                          </td>
                          <td>{PRODUCTION_STEP_LABELS[task.productionStep]}</td>
                          <td>{task.estimatedMinutes}</td>
                          <td>
                            <input
                              type="checkbox"
                              checked={task.completed}
                              disabled={!isEditMode || task.locked}
                              onChange={(event) =>
                                toggleTask(selectedPlan, task.id, {
                                  completed: event.target.checked,
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={task.carryForward}
                              disabled={!isEditMode || task.completed || task.locked}
                              onChange={(event) =>
                                toggleTask(selectedPlan, task.id, {
                                  carryForward: event.target.checked,
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={task.locked}
                              disabled={!isEditMode}
                              onChange={(event) =>
                                toggleTask(selectedPlan, task.id, {
                                  locked: event.target.checked,
                                })
                              }
                            />
                          </td>
                          <td>{task.notes || 'No notes'}</td>
                          <td>
                            <div className="battle-plan-task-actions">
                              <button
                                type="button"
                                onClick={() => moveTask(selectedPlan, index, -1)}
                                disabled={!isEditMode || index === 0 || task.locked}
                              >
                                Move Up
                              </button>
                              <button
                                type="button"
                                onClick={() => moveTask(selectedPlan, index, 1)}
                                disabled={
                                  !isEditMode || index === orderedTasks.length - 1 || task.locked
                                }
                              >
                                Move Down
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditTaskEditor(selectedPlan, task)}
                                disabled={!isEditMode}
                              >
                                Edit
                              </button>
                              <label>
                                <span className="sr-only">Reassign worker</span>
                                <select
                                  value={reassignTarget}
                                  disabled={!isEditMode || task.locked}
                                  onChange={(event) =>
                                    setReassignSelections((current) => ({
                                      ...current,
                                      [task.id]: event.target.value,
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
                              <button
                                type="button"
                                onClick={() =>
                                  reassignTask(selectedPlan, task.id, reassignTarget)
                                }
                                disabled={!isEditMode || reassignTarget === selectedPlan.assignedWorkerId}
                              >
                                Reassign
                              </button>
                              <button
                                type="button"
                                onClick={() => removeTask(selectedPlan, task.id)}
                                disabled={!isEditMode || task.locked}
                              >
                                Remove
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  window.location.href = `${import.meta.env.BASE_URL}work-items/${task.productionJobId}`
                                }}
                              >
                                Open Work Item
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </article>
      ) : null}

      {taskEditor && selectedPlan ? (
        <article className="panel battle-plan-task-editor-panel">
          <div className="worker-plan-header">
            <h4>{taskEditor.mode === 'add' ? 'Add Task' : 'Edit Task'}</h4>
            <button type="button" className="btn" onClick={() => setTaskEditor(null)}>
              Close
            </button>
          </div>

          <div className="battle-plan-task-editor-grid">
            <label>
              Work Item
              <select
                value={taskEditorDrafts[taskEditor.planId]?.productionJobId ?? ''}
                onChange={(event) =>
                  updateTaskEditorDraft(taskEditor.planId, {
                    productionJobId: event.target.value,
                  })
                }
              >
                {productionJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.orderNumber} | {job.artworkTitle}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Production Step
              <select
                value={taskEditorDrafts[taskEditor.planId]?.productionStep ?? 'FILES'}
                onChange={(event) =>
                  updateTaskEditorDraft(taskEditor.planId, {
                    productionStep: event.target.value as ProductionStepName,
                  })
                }
              >
                {PRODUCTION_STEP_SEQUENCE.map((stepName) => (
                  <option key={stepName} value={stepName}>
                    {PRODUCTION_STEP_LABELS[stepName]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Task Description
              <input
                type="text"
                value={taskEditorDrafts[taskEditor.planId]?.description ?? ''}
                onChange={(event) =>
                  updateTaskEditorDraft(taskEditor.planId, {
                    description: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Estimated Minutes
              <input
                type="number"
                min={1}
                value={taskEditorDrafts[taskEditor.planId]?.estimatedMinutes ?? 45}
                onChange={(event) =>
                  updateTaskEditorDraft(taskEditor.planId, {
                    estimatedMinutes: Number(event.target.value),
                  })
                }
              />
            </label>

            <label>
              Notes
              <textarea
                value={taskEditorDrafts[taskEditor.planId]?.notes ?? ''}
                onChange={(event) =>
                  updateTaskEditorDraft(taskEditor.planId, {
                    notes: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Assigned Worker
              <select
                value={taskEditorDrafts[taskEditor.planId]?.assignedWorkerId ?? selectedPlan.assignedWorkerId}
                onChange={(event) =>
                  updateTaskEditorDraft(taskEditor.planId, {
                    assignedWorkerId: event.target.value,
                  })
                }
              >
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={taskEditorDrafts[taskEditor.planId]?.carryForward ?? false}
                onChange={(event) =>
                  updateTaskEditorDraft(taskEditor.planId, {
                    carryForward: event.target.checked,
                  })
                }
              />
              Carry Forward
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={taskEditorDrafts[taskEditor.planId]?.locked ?? false}
                onChange={(event) =>
                  updateTaskEditorDraft(taskEditor.planId, {
                    locked: event.target.checked,
                  })
                }
              />
              Locked
            </label>
          </div>

          <div className="button-row">
            <button type="button" className="btn btn-primary" onClick={saveTaskEditor}>
              Save Task
            </button>
            <button type="button" className="btn" onClick={() => setTaskEditor(null)}>
              Cancel
            </button>
          </div>
        </article>
      ) : null}

      <div className="panel">
        <h3>Unassigned Backlog</h3>
        {unassignedBacklog.length === 0 ? (
          <p>No unassigned tasks.</p>
        ) : (
          <ul className="plain-list">
            {unassignedBacklog.map((task) => (
              <li key={task.id}>
                <div>
                  <strong>{task.description}</strong>
                  <p>
                    {reasonLabels[task.reason]} • {task.estimatedMinutes} min
                  </p>
                </div>
                <span className="subtle">{task.productionStep}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default BattlePlansPage
