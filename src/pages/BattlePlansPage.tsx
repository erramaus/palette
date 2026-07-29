import { useMemo, useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import type { BattlePlan, BattlePlanTask } from '../types/battlePlans'
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

interface AddTaskDraft {
  productionJobId: string
  productionStep: ProductionStepName
  estimatedMinutes: number
  notes: string
}

const formatLocalDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const createTaskId = (): string =>
  `BPT-${Date.now()}-${Math.floor(Math.random() * 10000)}`

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

const BattlePlansPage = () => {
  const {
    employees,
    productionJobs,
    battlePlans,
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
  const [addTaskDrafts, setAddTaskDrafts] = useState<Record<string, AddTaskDraft>>({})

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
        .sort((a, b) => a.assignedWorkerId.localeCompare(b.assignedWorkerId)),
    [plansForDate, employees],
  )

  const directorPlan = useMemo(
    () => plansForDate.find((plan) => plan.assignedWorkerId === director?.id),
    [plansForDate, director],
  )

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

  const reassignTask = (
    fromPlan: BattlePlan,
    taskId: string,
    toWorkerId: string,
  ): void => {
    if (toWorkerId === fromPlan.assignedWorkerId) {
      return
    }

    const destinationPlan = workerPlans.find((plan) => plan.assignedWorkerId === toWorkerId)
    if (!destinationPlan) {
      return
    }

    const sourceTasks = [...fromPlan.tasks].sort((a, b) => a.sortOrder - b.sortOrder)
    const task = sourceTasks.find((candidate) => candidate.id === taskId)
    if (!task) {
      return
    }

    const updatedSource = sourceTasks.filter((candidate) => candidate.id !== taskId)
    const updatedDestination = [
      ...destinationPlan.tasks.sort((a, b) => a.sortOrder - b.sortOrder),
      { ...task, id: createTaskId(), locked: false },
    ]

    saveUpdatedPlan(fromPlan, updatedSource)
    saveUpdatedPlan(destinationPlan, updatedDestination)
  }

  const addTaskToPlan = (plan: BattlePlan): void => {
    const existingDraft = addTaskDrafts[plan.id]
    const fallbackJobId = productionJobs[0]?.id ?? ''
    const draft: AddTaskDraft =
      existingDraft ?? {
        productionJobId: fallbackJobId,
        productionStep: 'FILES',
        estimatedMinutes: 45,
        notes: '',
      }

    const job = productionJobs.find((candidate) => candidate.id === draft.productionJobId)
    if (!job) {
      return
    }

    const nextTask: BattlePlanTask = {
      id: createTaskId(),
      productionJobId: job.id,
      productionStep: draft.productionStep,
      description: `${job.orderNumber} | ${job.artworkTitle} | ${draft.productionStep}`,
      estimatedMinutes: draft.estimatedMinutes,
      completed: false,
      sortOrder: plan.tasks.length + 1,
      notes: draft.notes,
      carryForward: false,
      locked: false,
    }

    saveUpdatedPlan(plan, [...plan.tasks.sort((a, b) => a.sortOrder - b.sortOrder), nextTask])
  }

  const updateAddTaskDraft = (
    planId: string,
    updates: Partial<AddTaskDraft>,
  ): void => {
    setAddTaskDrafts((currentDrafts) => {
      const baseDraft: AddTaskDraft =
        currentDrafts[planId] ?? {
          productionJobId: productionJobs[0]?.id ?? '',
          productionStep: 'FILES',
          estimatedMinutes: 45,
          notes: '',
        }

      return {
        ...currentDrafts,
        [planId]: {
          ...baseDraft,
          ...updates,
        },
      }
    })
  }

  return (
    <section className="page">
      <div className="page-heading">
        <h2>Battle Plans</h2>
        <p>
          Battle Plans are generated daily from the current Workshop List, independent of
          order importing.
        </p>
      </div>

      <div className="panel">
        <h3>Generation Controls</h3>
        <div className="form-grid">
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

      <div className="worker-plan-grid">
        {workerPlans.map((plan) => {
          const orderedTasks = [...plan.tasks].sort((a, b) => a.sortOrder - b.sortOrder)
          const plannedMinutes = calculatePlannedMinutes(orderedTasks)
          const completedMinutes = calculateCompletedMinutes(orderedTasks)
          const remainingMinutes = calculateRemainingMinutes(plan.availableMinutes, orderedTasks)
          const addTaskDraft =
            addTaskDrafts[plan.id] ??
            ({
              productionJobId: productionJobs[0]?.id ?? '',
              productionStep: 'FILES',
              estimatedMinutes: 45,
              notes: '',
            } as AddTaskDraft)

          return (
            <article className="panel" key={plan.id}>
              <div className="worker-plan-header">
                <div>
                  <h3>{getEmployeeName(employees, plan.assignedWorkerId)}</h3>
                  <p>
                    {plan.generationType} • {plan.status}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn"
                  disabled={!canApprovePlan(plan.status)}
                  onClick={() => approvePlan(plan)}
                >
                  Approve Plan
                </button>
              </div>

              <div className="summary-line-list">
                <span>Available: {plan.availableMinutes}</span>
                <span>Planned: {plannedMinutes}</span>
                <span>Completed: {completedMinutes}</span>
                <span>Remaining: {remainingMinutes}</span>
              </div>

              {remainingMinutes < 0 ? (
                <p className="warning">Warning: planned minutes exceed available minutes.</p>
              ) : null}

              <div className="table-wrap">
                <table className="bp-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Task</th>
                      <th>Min</th>
                      <th>Done</th>
                      <th>Carry</th>
                      <th>Lock</th>
                      <th>Reassign</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderedTasks.map((task, index) => (
                      <tr key={task.id}>
                        <td>{task.sortOrder}</td>
                        <td>
                          <strong>{task.description}</strong>
                          <p>{task.notes || 'No notes'}</p>
                        </td>
                        <td>{task.estimatedMinutes}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={(event) =>
                              toggleTask(plan, task.id, { completed: event.target.checked })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={task.carryForward}
                            disabled={task.completed}
                            onChange={(event) =>
                              toggleTask(plan, task.id, { carryForward: event.target.checked })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={task.locked}
                            onChange={(event) =>
                              toggleTask(plan, task.id, { locked: event.target.checked })
                            }
                          />
                        </td>
                        <td>
                          <select
                            value={plan.assignedWorkerId}
                            onChange={(event) =>
                              reassignTask(plan, task.id, event.target.value)
                            }
                          >
                            {workers.map((worker) => (
                              <option key={worker.id} value={worker.id}>
                                {worker.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="table-actions">
                          <button type="button" onClick={() => moveTask(plan, index, -1)}>
                            Up
                          </button>
                          <button type="button" onClick={() => moveTask(plan, index, 1)}>
                            Down
                          </button>
                          <button type="button" onClick={() => removeTask(plan, task.id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4>Add Task</h4>
              <div className="task-draft-grid">
                <label>
                  Job
                  <select
                    value={addTaskDraft.productionJobId}
                    onChange={(event) =>
                      updateAddTaskDraft(plan.id, { productionJobId: event.target.value })
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
                  Step
                  <select
                    value={addTaskDraft.productionStep}
                    onChange={(event) =>
                      updateAddTaskDraft(plan.id, {
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
                  Minutes
                  <input
                    type="number"
                    min={1}
                    value={addTaskDraft.estimatedMinutes}
                    onChange={(event) =>
                      updateAddTaskDraft(plan.id, {
                        estimatedMinutes: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Notes
                  <input
                    type="text"
                    value={addTaskDraft.notes}
                    onChange={(event) =>
                      updateAddTaskDraft(plan.id, { notes: event.target.value })
                    }
                  />
                </label>
                <button type="button" className="btn" onClick={() => addTaskToPlan(plan)}>
                  Add Task
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="panel">
        <h3>Production Director Battle Plan</h3>
        {directorPlan ? (
          <ul className="plain-list">
            {directorPlan.tasks
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((task) => (
                <li key={task.id}>
                  <div>
                    <strong>{task.description}</strong>
                    <p>{task.notes || 'No notes'}</p>
                  </div>
                  <span className="subtle">{task.estimatedMinutes} min</span>
                </li>
              ))}
          </ul>
        ) : (
          <p>No Director plan generated for this date.</p>
        )}
      </div>

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
