import type {
  BattlePlan,
  BattlePlanTask,
  BattlePlanStatus,
} from '../types/battlePlans'
import type { Employee } from '../types/employees'
import type {
  DueStatus,
  Priority,
  ProductionJob,
  ProductionStepName,
  ProductionStepStatus,
} from '../types/production'
import { PRODUCTION_STEP_SEQUENCE } from '../utils/productionSteps'
import { calculateDueStatus } from '../utils/dueStatus'

export type BacklogReason =
  | 'NO_QUALIFIED_WORKER'
  | 'INSUFFICIENT_CAPACITY'
  | 'MISSING_PREREQUISITE'
  | 'JOB_ON_HOLD'

export interface GeneratedCandidateTask {
  id: string
  productionJobId: string
  productionStep: ProductionStepName
  description: string
  estimatedMinutes: number
  notes: string
  dueDate: string
  dueStatus: DueStatus
  priority: Priority
  assignedWorkerId: string
  carryForward: boolean
  source: 'NEW' | 'CARRY_FORWARD'
}

export interface UnassignedTask extends GeneratedCandidateTask {
  reason: BacklogReason
}

export interface GenerationWorkerConfig {
  workerId: string
  availableMinutes: number
  selected: boolean
}

export interface GenerationSummary {
  plansCreated: number
  tasksAssigned: number
  tasksUnassigned: number
  workersOverCapacity: number
  remainingBacklogMinutes: number
  warnings: string[]
}

export interface GenerationResult {
  workerPlans: BattlePlan[]
  directorPlan: BattlePlan
  unassignedBacklog: UnassignedTask[]
  summary: GenerationSummary
}

export interface GenerateBattlePlansInput {
  date: string
  jobs: ProductionJob[]
  employees: Employee[]
  workerConfigs: GenerationWorkerConfig[]
  existingPlans: BattlePlan[]
}

const dueStatusRank: Record<DueStatus, number> = {
  OVERDUE: 0,
  DUE_TODAY: 1,
  AT_RISK: 2,
  DUE_SOON: 3,
  ON_TRACK: 4,
  ON_HOLD: 5,
}

const priorityRank: Record<Priority, number> = {
  ORIGINALS: 0,
  CUSTOMER_PURCHASED: 1,
  GALLERY_INVENTORY: 2,
}

const stepEndOfLineRank: Record<ProductionStepName, number> = {
  SHIPPED: 0,
  FRAMED: 1,
  FRAME_MADE: 2,
  MOUNTED: 3,
  STRETCHER_BASE: 4,
  DIBOND: 5,
  PRINTED: 6,
  FILES: 7,
}

const systemStep: ProductionStepName = 'FILES'

const taskKey = (jobId: string, step: ProductionStepName): string => `${jobId}::${step}`

const parseLocalDate = (value: string): Date => {
  const [yearRaw, monthRaw, dayRaw] = value.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)

  return new Date(year, month - 1, day)
}

const formatDateLong = (date: string): string => {
  const localDate = parseLocalDate(date)
  return localDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

const isFrameRequired = (job: ProductionJob): boolean => {
  if (job.steps.FRAME_MADE === 'NOT_APPLICABLE') {
    return false
  }

  const frameInfo = job.frameInfo.toLowerCase()
  return !frameInfo.includes('unframed') && !frameInfo.includes('no frame')
}

const isStepRequired = (job: ProductionJob, step: ProductionStepName): boolean => {
  if (step === 'DIBOND') {
    return job.productType === 'TEXTURED_REPLICA_3D'
  }

  if (step === 'FRAME_MADE') {
    return isFrameRequired(job)
  }

  if (step === 'FRAMED') {
    return job.steps.FRAMED !== 'NOT_APPLICABLE'
  }

  if (step === 'SHIPPED') {
    return job.steps.SHIPPED !== 'NOT_APPLICABLE'
  }

  return job.steps[step] !== 'NOT_APPLICABLE'
}

const isDoneForDependency = (status: ProductionStepStatus): boolean =>
  status === 'COMPLETE' || status === 'NOT_APPLICABLE'

export const isStepActionable = (job: ProductionJob, step: ProductionStepName): boolean => {
  const status = job.steps[step]
  if (status !== 'WAITING') {
    return false
  }

  if (!isStepRequired(job, step)) {
    return false
  }

  if (step === 'FILES') {
    return true
  }

  if (step === 'PRINTED') {
    return job.steps.FILES === 'COMPLETE'
  }

  if (step === 'DIBOND') {
    return job.steps.PRINTED === 'COMPLETE'
  }

  if (step === 'STRETCHER_BASE') {
    return isDoneForDependency(job.steps.FILES)
  }

  if (step === 'MOUNTED') {
    return (
      job.steps.PRINTED === 'COMPLETE' &&
      isDoneForDependency(job.steps.DIBOND) &&
      isDoneForDependency(job.steps.STRETCHER_BASE)
    )
  }

  if (step === 'FRAME_MADE') {
    return isFrameRequired(job)
  }

  if (step === 'FRAMED') {
    return isDoneForDependency(job.steps.MOUNTED) && isDoneForDependency(job.steps.FRAME_MADE)
  }

  return (
    isDoneForDependency(job.steps.FRAMED) &&
    PRODUCTION_STEP_SEQUENCE.filter((candidateStep) => candidateStep !== 'SHIPPED')
      .filter((candidateStep) => isStepRequired(job, candidateStep))
      .every((requiredStep) => isDoneForDependency(job.steps[requiredStep]))
  )
}

export const getNextActionableStep = (job: ProductionJob): ProductionStepName | null => {
  for (const step of PRODUCTION_STEP_SEQUENCE) {
    if (isStepActionable(job, step)) {
      return step
    }
  }

  return null
}

export const getNextActionableSteps = (job: ProductionJob): ProductionStepName[] => {
  const next = getNextActionableStep(job)
  return next ? [next] : []
}

export const calculateTaskPriority = (
  job: ProductionJob,
  step: ProductionStepName,
): number[] => {
  return [
    dueStatusRank[job.dueStatus],
    parseLocalDate(job.dueDate).getTime(),
    priorityRank[job.priority],
    stepEndOfLineRank[step],
  ]
}

export const getQualifiedWorkers = (
  step: ProductionStepName,
  employees: Employee[],
): Employee[] => employees.filter((employee) => employee.active && employee.skills.includes(step))

const compareTaskPriority = (a: GeneratedCandidateTask, b: GeneratedCandidateTask): number => {
  const aPriority = [
    dueStatusRank[a.dueStatus],
    parseLocalDate(a.dueDate).getTime(),
    priorityRank[a.priority],
    stepEndOfLineRank[a.productionStep],
  ]
  const bPriority = [
    dueStatusRank[b.dueStatus],
    parseLocalDate(b.dueDate).getTime(),
    priorityRank[b.priority],
    stepEndOfLineRank[b.productionStep],
  ]

  for (let index = 0; index < aPriority.length; index += 1) {
    const delta = aPriority[index] - bPriority[index]
    if (delta !== 0) {
      return delta
    }
  }

  return a.productionStep.localeCompare(b.productionStep)
}

const buildCandidateTasks = (jobs: ProductionJob[]): {
  candidates: GeneratedCandidateTask[]
  blockedBacklog: UnassignedTask[]
} => {
  const candidates: GeneratedCandidateTask[] = []
  const blockedBacklog: UnassignedTask[] = []

  for (const job of jobs) {
    if (job.onHold || job.dueStatus === 'ON_HOLD') {
      blockedBacklog.push({
        id: `UNASSIGNED-${job.id}-ON_HOLD`,
        productionJobId: job.id,
        productionStep: systemStep,
        description: `${job.orderNumber} is on hold`,
        estimatedMinutes: 0,
        notes: 'Job is on hold and excluded from daily assignment.',
        dueDate: job.dueDate,
        dueStatus: job.dueStatus,
        priority: job.priority,
        assignedWorkerId: job.assignedWorkerId,
        carryForward: false,
        source: 'NEW',
        reason: 'JOB_ON_HOLD',
      })
      continue
    }

    const updatedDueStatus = calculateDueStatus(job.dueDate, job.onHold)
    const normalizedJob = { ...job, dueStatus: updatedDueStatus }
    const nextStep = getNextActionableStep(normalizedJob)

    if (!nextStep) {
      const unresolvedStep = PRODUCTION_STEP_SEQUENCE.find(
        (step) =>
          normalizedJob.steps[step] === 'WAITING' &&
          isStepRequired(normalizedJob, step) &&
          !isStepActionable(normalizedJob, step),
      )

      if (unresolvedStep) {
        blockedBacklog.push({
          id: `UNASSIGNED-${normalizedJob.id}-${unresolvedStep}`,
          productionJobId: normalizedJob.id,
          productionStep: unresolvedStep,
          description: `${normalizedJob.orderNumber} blocked at ${unresolvedStep}`,
          estimatedMinutes: normalizedJob.estimatedMinutes[unresolvedStep],
          notes: 'Prerequisite production step is incomplete.',
          dueDate: normalizedJob.dueDate,
          dueStatus: normalizedJob.dueStatus,
          priority: normalizedJob.priority,
          assignedWorkerId: normalizedJob.assignedWorkerId,
          carryForward: false,
          source: 'NEW',
          reason: 'MISSING_PREREQUISITE',
        })
      }

      continue
    }

    candidates.push({
      id: `AUTO-${normalizedJob.id}-${nextStep}`,
      productionJobId: normalizedJob.id,
      productionStep: nextStep,
      description: `${normalizedJob.orderNumber} | ${normalizedJob.artworkTitle} | ${nextStep}`,
      estimatedMinutes: normalizedJob.estimatedMinutes[nextStep],
      notes: normalizedJob.notes,
      dueDate: normalizedJob.dueDate,
      dueStatus: normalizedJob.dueStatus,
      priority: normalizedJob.priority,
      assignedWorkerId: normalizedJob.assignedWorkerId,
      carryForward: false,
      source: 'NEW',
    })
  }

  candidates.sort(compareTaskPriority)
  return { candidates, blockedBacklog }
}

export const mergeCarryForwardTasks = (
  carryForwardTasks: GeneratedCandidateTask[],
  generatedTasks: GeneratedCandidateTask[],
): GeneratedCandidateTask[] => {
  const byKey = new Map<string, GeneratedCandidateTask>()

  carryForwardTasks.forEach((task) => {
    byKey.set(taskKey(task.productionJobId, task.productionStep), {
      ...task,
      source: 'CARRY_FORWARD',
      carryForward: true,
    })
  })

  generatedTasks.forEach((task) => {
    const key = taskKey(task.productionJobId, task.productionStep)
    if (!byKey.has(key)) {
      byKey.set(key, task)
    }
  })

  return Array.from(byKey.values()).sort((a, b) => {
    if (a.source !== b.source) {
      return a.source === 'CARRY_FORWARD' ? -1 : 1
    }
    return compareTaskPriority(a, b)
  })
}

const getPreviousDayCarryForwardTasks = (
  date: string,
  existingPlans: BattlePlan[],
  jobsById: Map<string, ProductionJob>,
): GeneratedCandidateTask[] => {
  const previousDates = Array.from(
    new Set(existingPlans.map((plan) => plan.date).filter((planDate) => planDate < date)),
  ).sort((a, b) => parseLocalDate(b).getTime() - parseLocalDate(a).getTime())

  const previousDate = previousDates[0]
  if (!previousDate) {
    return []
  }

  const previousPlans = existingPlans.filter((plan) => plan.date === previousDate)
  const tasks: GeneratedCandidateTask[] = []
  const seen = new Set<string>()

  previousPlans.forEach((plan) => {
    plan.tasks
      .filter((task) => !task.completed)
      .forEach((task) => {
        const job = jobsById.get(task.productionJobId)
        if (!job) {
          return
        }

        const refreshedDueStatus = calculateDueStatus(job.dueDate, job.onHold)
        const uniqueKey = taskKey(task.productionJobId, task.productionStep)
        if (seen.has(uniqueKey)) {
          return
        }

        seen.add(uniqueKey)

        tasks.push({
          id: `CF-${task.id}`,
          productionJobId: task.productionJobId,
          productionStep: task.productionStep,
          description: task.description,
          estimatedMinutes: task.estimatedMinutes,
          notes: task.notes || 'Carry-forward from previous workday.',
          dueDate: job.dueDate,
          dueStatus: refreshedDueStatus,
          priority: job.priority,
          assignedWorkerId: plan.assignedWorkerId,
          carryForward: true,
          source: 'CARRY_FORWARD',
        })
      })
  })

  return tasks
}

interface AssignmentResult {
  workerTasks: Map<string, GeneratedCandidateTask[]>
  unassignedTasks: UnassignedTask[]
  remainingByWorker: Map<string, number>
}

export const assignTasksToWorkers = (
  tasks: GeneratedCandidateTask[],
  workers: Employee[],
  availabilityByWorker: Map<string, number>,
): AssignmentResult => {
  const workerTasks = new Map<string, GeneratedCandidateTask[]>()
  const unassignedTasks: UnassignedTask[] = []
  const remainingByWorker = new Map(availabilityByWorker)
  const workersById = new Map(workers.map((worker) => [worker.id, worker]))

  workers.forEach((worker) => workerTasks.set(worker.id, []))

  tasks.forEach((task) => {
    const qualified = getQualifiedWorkers(task.productionStep, workers)
    if (qualified.length === 0) {
      unassignedTasks.push({ ...task, reason: 'NO_QUALIFIED_WORKER' })
      return
    }

    const preferredWorker = workersById.get(task.assignedWorkerId)
    const preferredCandidate =
      preferredWorker && qualified.some((worker) => worker.id === preferredWorker.id)
        ? preferredWorker
        : null

    const rankedQualified = [...qualified].sort((a, b) => {
      if (preferredCandidate && a.id === preferredCandidate.id) {
        return -1
      }
      if (preferredCandidate && b.id === preferredCandidate.id) {
        return 1
      }

      const remainingA = remainingByWorker.get(a.id) ?? 0
      const remainingB = remainingByWorker.get(b.id) ?? 0
      return remainingB - remainingA
    })

    const assignedWorker = rankedQualified.find(
      (worker) => (remainingByWorker.get(worker.id) ?? 0) >= task.estimatedMinutes,
    )

    if (!assignedWorker) {
      unassignedTasks.push({ ...task, reason: 'INSUFFICIENT_CAPACITY' })
      return
    }

    const currentTasks = workerTasks.get(assignedWorker.id) ?? []
    currentTasks.push(task)
    workerTasks.set(assignedWorker.id, currentTasks)

    const currentRemaining = remainingByWorker.get(assignedWorker.id) ?? 0
    remainingByWorker.set(assignedWorker.id, currentRemaining - task.estimatedMinutes)
  })

  return { workerTasks, unassignedTasks, remainingByWorker }
}

const buildWorkerPlanTask = (
  task: GeneratedCandidateTask,
  index: number,
): BattlePlanTask => ({
  id: `${task.id}-${index}`,
  productionJobId: task.productionJobId,
  productionStep: task.productionStep,
  description: task.description,
  estimatedMinutes: task.estimatedMinutes,
  completed: false,
  sortOrder: index + 1,
  notes: task.notes,
  carryForward: task.carryForward,
  locked: false,
})

const applyTaskOrder = (tasks: BattlePlanTask[]): BattlePlanTask[] =>
  tasks.map((task, index) => ({ ...task, sortOrder: index + 1 }))

export const generateWorkerBattlePlans = (
  date: string,
  workers: Employee[],
  tasksByWorker: Map<string, GeneratedCandidateTask[]>,
  availabilityByWorker: Map<string, number>,
  directorId: string,
): BattlePlan[] => {
  return workers.map((worker) => {
    const generatedTasks = (tasksByWorker.get(worker.id) ?? []).map((task, index) =>
      buildWorkerPlanTask(task, index),
    )

    return {
      id: `AUTO-BP-${date}-${worker.id}`,
      date,
      assignedWorkerId: worker.id,
      createdById: directorId,
      approvedById: directorId,
      availableMinutes: availabilityByWorker.get(worker.id) ?? worker.defaultAvailableMinutes,
      generationType: 'AUTOMATIC',
      status: 'DRAFT',
      tasks: applyTaskOrder(generatedTasks),
      endOfDayNotes: '',
    }
  })
}

export const generateDirectorBattlePlan = (
  date: string,
  director: Employee,
  workerPlans: BattlePlan[],
  unassignedBacklog: UnassignedTask[],
  overdueCount: number,
  atRiskCount: number,
): BattlePlan => {
  const staticTasks: BattlePlanTask[] = [
    {
      id: `DIR-${date}-1`,
      productionJobId: 'SYSTEM',
      productionStep: systemStep,
      description: 'Review and approve generated worker Battle Plans',
      estimatedMinutes: 45,
      completed: false,
      sortOrder: 1,
      notes: '',
      carryForward: false,
      locked: false,
    },
    {
      id: `DIR-${date}-2`,
      productionJobId: 'SYSTEM',
      productionStep: systemStep,
      description: `Review overdue production jobs (${overdueCount})`,
      estimatedMinutes: 40,
      completed: false,
      sortOrder: 2,
      notes: '',
      carryForward: false,
      locked: false,
    },
    {
      id: `DIR-${date}-3`,
      productionJobId: 'SYSTEM',
      productionStep: systemStep,
      description: `Review at-risk production jobs (${atRiskCount})`,
      estimatedMinutes: 35,
      completed: false,
      sortOrder: 3,
      notes: '',
      carryForward: false,
      locked: false,
    },
    {
      id: `DIR-${date}-4`,
      productionJobId: 'SYSTEM',
      productionStep: systemStep,
      description: `Follow up on unassigned tasks (${unassignedBacklog.length})`,
      estimatedMinutes: 35,
      completed: false,
      sortOrder: 4,
      notes: '',
      carryForward: false,
      locked: false,
    },
    {
      id: `DIR-${date}-5`,
      productionJobId: 'SYSTEM',
      productionStep: systemStep,
      description: 'Check worker progress during the day',
      estimatedMinutes: 30,
      completed: false,
      sortOrder: 5,
      notes: '',
      carryForward: false,
      locked: false,
    },
    {
      id: `DIR-${date}-6`,
      productionJobId: 'SYSTEM',
      productionStep: systemStep,
      description: 'Reassign unfinished urgent work',
      estimatedMinutes: 35,
      completed: false,
      sortOrder: 6,
      notes: '',
      carryForward: false,
      locked: false,
    },
    {
      id: `DIR-${date}-7`,
      productionJobId: 'SYSTEM',
      productionStep: systemStep,
      description: 'Review carry-forward tasks from the previous workday',
      estimatedMinutes: 30,
      completed: false,
      sortOrder: 7,
      notes: '',
      carryForward: false,
      locked: false,
    },
  ]

  const reviewTasks = workerPlans.map((plan, index) => ({
    id: `DIR-${date}-REVIEW-${plan.assignedWorkerId}`,
    productionJobId: 'SYSTEM',
    productionStep: systemStep,
    description: `Review and manage ${plan.assignedWorkerId} ${formatDateLong(date)} Battle Plan`,
    estimatedMinutes: 20,
    completed: false,
    sortOrder: staticTasks.length + index + 1,
    notes: '',
    carryForward: false,
    locked: false,
  }))

  const tasks = applyTaskOrder([...staticTasks, ...reviewTasks])

  return {
    id: `AUTO-BP-${date}-${director.id}`,
    date,
    assignedWorkerId: director.id,
    createdById: director.id,
    approvedById: director.id,
    availableMinutes: director.defaultAvailableMinutes,
    generationType: 'AUTOMATIC',
    status: 'DRAFT',
    tasks,
    endOfDayNotes: '',
  }
}

const preserveTasksForRegeneration = (
  existingPlan: BattlePlan,
): BattlePlanTask[] =>
  existingPlan.tasks
    .filter((task) => task.completed || task.locked)
    .sort((a, b) => a.sortOrder - b.sortOrder)

const taskIdentityFromPlanTask = (task: BattlePlanTask): string =>
  taskKey(task.productionJobId, task.productionStep)

export const regenerateBattlePlans = (
  existingDatePlans: BattlePlan[],
  generatedResult: GenerationResult,
): GenerationResult => {
  const existingByWorker = new Map(
    existingDatePlans.map((plan) => [plan.assignedWorkerId, plan]),
  )

  const workerPlans = generatedResult.workerPlans.map((generatedPlan) => {
    const existingPlan = existingByWorker.get(generatedPlan.assignedWorkerId)
    if (!existingPlan) {
      return generatedPlan
    }

    const preserved = preserveTasksForRegeneration(existingPlan)
    const preservedKeys = new Set(preserved.map(taskIdentityFromPlanTask))

    const regenerated = generatedPlan.tasks.filter(
      (task) => !preservedKeys.has(taskIdentityFromPlanTask(task)),
    )

    const mergedTasks = applyTaskOrder([...preserved, ...regenerated])

    return {
      ...generatedPlan,
      status: existingPlan.status,
      tasks: mergedTasks,
    }
  })

  const existingDirectorPlan = existingByWorker.get(generatedResult.directorPlan.assignedWorkerId)
  const directorPlan = existingDirectorPlan
    ? {
        ...generatedResult.directorPlan,
        status: existingDirectorPlan.status,
        tasks: applyTaskOrder([
          ...preserveTasksForRegeneration(existingDirectorPlan),
          ...generatedResult.directorPlan.tasks.filter(
            (task) =>
              !preserveTasksForRegeneration(existingDirectorPlan)
                .map(taskIdentityFromPlanTask)
                .includes(taskIdentityFromPlanTask(task)),
          ),
        ]),
      }
    : generatedResult.directorPlan

  return {
    ...generatedResult,
    workerPlans,
    directorPlan,
  }
}

export const generateDailyBattlePlans = (
  input: GenerateBattlePlansInput,
): GenerationResult => {
  const { date, jobs, employees, workerConfigs, existingPlans } = input
  const workers = employees.filter(
    (employee) =>
      employee.role === 'WORKER' &&
      employee.active &&
      workerConfigs.some((config) => config.selected && config.workerId === employee.id),
  )

  const director = employees.find((employee) => employee.role === 'PRODUCTION_DIRECTOR')
  if (!director) {
    throw new Error('No production director configured for automatic plan generation.')
  }

  const availabilityByWorker = new Map(
    workers.map((worker) => {
      const configured = workerConfigs.find((config) => config.workerId === worker.id)
      return [worker.id, configured?.availableMinutes ?? worker.defaultAvailableMinutes]
    }),
  )

  const jobsById = new Map(jobs.map((job) => [job.id, job]))
  const carryForwardTasks = getPreviousDayCarryForwardTasks(date, existingPlans, jobsById)
  const { candidates, blockedBacklog } = buildCandidateTasks(jobs)
  const mergedTasks = mergeCarryForwardTasks(carryForwardTasks, candidates)
  const assignment = assignTasksToWorkers(mergedTasks, workers, availabilityByWorker)

  const workerPlans = generateWorkerBattlePlans(
    date,
    workers,
    assignment.workerTasks,
    availabilityByWorker,
    director.id,
  )

  const overdueCount = jobs.filter((job) => calculateDueStatus(job.dueDate, job.onHold) === 'OVERDUE').length
  const atRiskCount = jobs.filter((job) => calculateDueStatus(job.dueDate, job.onHold) === 'AT_RISK').length

  const unassignedBacklog = [...assignment.unassignedTasks, ...blockedBacklog]

  const directorPlan = generateDirectorBattlePlan(
    date,
    director,
    workerPlans,
    unassignedBacklog,
    overdueCount,
    atRiskCount,
  )

  const workersOverCapacity = workerPlans.filter((plan) => {
    const used = plan.tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0)
    return used > plan.availableMinutes
  }).length

  const summary: GenerationSummary = {
    plansCreated: workerPlans.length + 1,
    tasksAssigned: workerPlans.reduce((sum, plan) => sum + plan.tasks.length, 0),
    tasksUnassigned: unassignedBacklog.length,
    workersOverCapacity,
    remainingBacklogMinutes: unassignedBacklog.reduce(
      (sum, task) => sum + task.estimatedMinutes,
      0,
    ),
    warnings: unassignedBacklog
      .filter((task) => task.reason === 'NO_QUALIFIED_WORKER')
      .map(
        (task) =>
          `No qualified worker for ${task.productionJobId} ${task.productionStep}. Added to Director attention list.`,
      ),
  }

  return {
    workerPlans,
    directorPlan,
    unassignedBacklog,
    summary,
  }
}

export const canApprovePlan = (status: BattlePlanStatus): boolean => status === 'DRAFT'
