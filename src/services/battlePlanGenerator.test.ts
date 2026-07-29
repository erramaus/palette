import { describe, expect, it } from 'vitest'
import {
  assignTasksToWorkers,
  generateDailyBattlePlans,
  getNextActionableStep,
  isStepActionable,
  regenerateBattlePlans,
  type GeneratedCandidateTask,
} from './battlePlanGenerator'
import type { BattlePlan, BattlePlanTask } from '../types/battlePlans'
import type { Employee } from '../types/employees'
import type { ProductionJob, ProductionStepName } from '../types/production'

const baseEstimatedMinutes = {
  FILES: 20,
  PRINTED: 30,
  DIBOND: 40,
  STRETCHER_BASE: 35,
  MOUNTED: 55,
  FRAME_MADE: 60,
  FRAMED: 45,
  SHIPPED: 25,
}

const makeJob = (overrides: Partial<ProductionJob>): ProductionJob => ({
  id: overrides.id ?? 'JOB-1',
  orderNumber: overrides.orderNumber ?? 'WEB-1',
  customerName: overrides.customerName ?? 'Customer',
  artworkTitle: overrides.artworkTitle ?? 'Art',
  productType: overrides.productType ?? 'CANVAS',
  width: 20,
  height: 20,
  frameInfo: overrides.frameInfo ?? 'Frame',
  dueDate: overrides.dueDate ?? '2026-07-28',
  dueStatus: overrides.dueStatus ?? 'ON_TRACK',
  priority: overrides.priority ?? 'CUSTOMER_PURCHASED',
  assignedWorkerId: overrides.assignedWorkerId ?? 'EMP-W1',
  notes: overrides.notes ?? '',
  onHold: overrides.onHold,
  steps:
    overrides.steps ??
    {
      FILES: 'COMPLETE',
      PRINTED: 'WAITING',
      DIBOND: 'NOT_APPLICABLE',
      STRETCHER_BASE: 'WAITING',
      MOUNTED: 'WAITING',
      FRAME_MADE: 'WAITING',
      FRAMED: 'WAITING',
      SHIPPED: 'WAITING',
    },
  estimatedMinutes: overrides.estimatedMinutes ?? baseEstimatedMinutes,
})

const makeEmployees = (): Employee[] => [
  {
    id: 'EMP-DIR',
    name: 'Director',
    role: 'PRODUCTION_DIRECTOR',
    skills: ['FILES', 'PRINTED', 'DIBOND', 'STRETCHER_BASE', 'MOUNTED', 'FRAME_MADE', 'FRAMED', 'SHIPPED'],
    defaultAvailableMinutes: 480,
    active: true,
  },
  {
    id: 'EMP-W1',
    name: 'Worker 1',
    role: 'WORKER',
    skills: ['PRINTED', 'DIBOND', 'MOUNTED', 'FRAMED', 'SHIPPED'],
    defaultAvailableMinutes: 120,
    active: true,
  },
  {
    id: 'EMP-W2',
    name: 'Worker 2',
    role: 'WORKER',
    skills: ['FILES', 'STRETCHER_BASE', 'FRAME_MADE', 'FRAMED'],
    defaultAvailableMinutes: 90,
    active: true,
  },
]

const makeWorkerConfigs = () => [
  { workerId: 'EMP-W1', selected: true, availableMinutes: 120 },
  { workerId: 'EMP-W2', selected: true, availableMinutes: 90 },
]

describe('battlePlanGenerator', () => {
  it('ranks overdue work ahead of due-soon work', () => {
    const jobs = [
      makeJob({
        id: 'JOB-SOON',
        dueDate: '2026-07-30',
        dueStatus: 'DUE_SOON',
        steps: {
          FILES: 'COMPLETE',
          PRINTED: 'WAITING',
          DIBOND: 'NOT_APPLICABLE',
          STRETCHER_BASE: 'WAITING',
          MOUNTED: 'WAITING',
          FRAME_MADE: 'WAITING',
          FRAMED: 'WAITING',
          SHIPPED: 'WAITING',
        },
      }),
      makeJob({
        id: 'JOB-OVERDUE',
        dueDate: '2026-07-27',
        dueStatus: 'OVERDUE',
        orderNumber: 'WEB-OVERDUE',
        steps: {
          FILES: 'COMPLETE',
          PRINTED: 'WAITING',
          DIBOND: 'NOT_APPLICABLE',
          STRETCHER_BASE: 'WAITING',
          MOUNTED: 'WAITING',
          FRAME_MADE: 'WAITING',
          FRAMED: 'WAITING',
          SHIPPED: 'WAITING',
        },
      }),
    ]

    const result = generateDailyBattlePlans({
      date: '2026-07-28',
      jobs,
      employees: makeEmployees(),
      workerConfigs: makeWorkerConfigs(),
      existingPlans: [],
    })

    const firstTask = result.workerPlans
      .flatMap((plan) => plan.tasks)
      .sort((a, b) => a.sortOrder - b.sortOrder)[0]

    expect(firstTask.description).toContain('WEB-OVERDUE')
  })

  it('never generates tasks for COMPLETE steps', () => {
    const job = makeJob({
      steps: {
        FILES: 'COMPLETE',
        PRINTED: 'COMPLETE',
        DIBOND: 'NOT_APPLICABLE',
        STRETCHER_BASE: 'COMPLETE',
        MOUNTED: 'WAITING',
        FRAME_MADE: 'WAITING',
        FRAMED: 'WAITING',
        SHIPPED: 'WAITING',
      },
    })

    const next = getNextActionableStep(job)
    expect(next).toBe('MOUNTED')
    expect(next).not.toBe('PRINTED')
  })

  it('never generates tasks for NOT_APPLICABLE steps', () => {
    const job = makeJob({
      productType: 'CANVAS',
      steps: {
        FILES: 'COMPLETE',
        PRINTED: 'COMPLETE',
        DIBOND: 'NOT_APPLICABLE',
        STRETCHER_BASE: 'COMPLETE',
        MOUNTED: 'WAITING',
        FRAME_MADE: 'WAITING',
        FRAMED: 'WAITING',
        SHIPPED: 'WAITING',
      },
    })

    expect(getNextActionableStep(job)).toBe('MOUNTED')
  })

  it('generates DIBOND for 3D jobs and skips for non-3D jobs', () => {
    const job3d = makeJob({
      id: 'JOB-3D',
      productType: 'TEXTURED_REPLICA_3D',
      steps: {
        FILES: 'COMPLETE',
        PRINTED: 'COMPLETE',
        DIBOND: 'WAITING',
        STRETCHER_BASE: 'WAITING',
        MOUNTED: 'WAITING',
        FRAME_MADE: 'WAITING',
        FRAMED: 'WAITING',
        SHIPPED: 'WAITING',
      },
    })
    const non3d = makeJob({
      id: 'JOB-2D',
      productType: 'CANVAS',
      steps: {
        FILES: 'COMPLETE',
        PRINTED: 'COMPLETE',
        DIBOND: 'NOT_APPLICABLE',
        STRETCHER_BASE: 'COMPLETE',
        MOUNTED: 'WAITING',
        FRAME_MADE: 'WAITING',
        FRAMED: 'WAITING',
        SHIPPED: 'WAITING',
      },
    })

    expect(getNextActionableStep(job3d)).toBe('DIBOND')
    expect(getNextActionableStep(non3d)).toBe('MOUNTED')
  })

  it('blocks MOUNTED until prerequisites are complete', () => {
    const blockedJob = makeJob({
      productType: 'TEXTURED_REPLICA_3D',
      steps: {
        FILES: 'COMPLETE',
        PRINTED: 'COMPLETE',
        DIBOND: 'WAITING',
        STRETCHER_BASE: 'COMPLETE',
        MOUNTED: 'WAITING',
        FRAME_MADE: 'WAITING',
        FRAMED: 'WAITING',
        SHIPPED: 'WAITING',
      },
    })

    expect(isStepActionable(blockedJob, 'MOUNTED')).toBe(false)
    expect(isStepActionable(blockedJob, 'DIBOND')).toBe(true)
  })

  it('blocks FRAMED until MOUNTED and FRAME_MADE are complete', () => {
    const blockedJob = makeJob({
      steps: {
        FILES: 'COMPLETE',
        PRINTED: 'COMPLETE',
        DIBOND: 'NOT_APPLICABLE',
        STRETCHER_BASE: 'COMPLETE',
        MOUNTED: 'WAITING',
        FRAME_MADE: 'COMPLETE',
        FRAMED: 'WAITING',
        SHIPPED: 'WAITING',
      },
    })

    expect(isStepActionable(blockedJob, 'FRAMED')).toBe(false)
  })

  it('blocks SHIPPED until required production steps are complete', () => {
    const blockedJob = makeJob({
      steps: {
        FILES: 'COMPLETE',
        PRINTED: 'COMPLETE',
        DIBOND: 'NOT_APPLICABLE',
        STRETCHER_BASE: 'COMPLETE',
        MOUNTED: 'COMPLETE',
        FRAME_MADE: 'COMPLETE',
        FRAMED: 'WAITING',
        SHIPPED: 'WAITING',
      },
    })

    expect(isStepActionable(blockedJob, 'SHIPPED')).toBe(false)
  })

  it('assigns tasks only to qualified workers', () => {
    const tasks: GeneratedCandidateTask[] = [
      {
        id: 'T1',
        productionJobId: 'JOB-1',
        productionStep: 'DIBOND',
        description: 'dibond task',
        estimatedMinutes: 30,
        notes: '',
        dueDate: '2026-07-28',
        dueStatus: 'DUE_TODAY',
        priority: 'CUSTOMER_PURCHASED',
        assignedWorkerId: 'EMP-W1',
        carryForward: false,
        source: 'NEW',
      },
    ]

    const workers = makeEmployees().filter((employee) => employee.role === 'WORKER')
    const availability = new Map<string, number>([
      ['EMP-W1', 120],
      ['EMP-W2', 90],
    ])

    const assigned = assignTasksToWorkers(tasks, workers, availability)
    const allAssigned = Array.from(assigned.workerTasks.values()).flat()

    expect(allAssigned).toHaveLength(1)
    expect(allAssigned[0].productionStep).toBe('DIBOND')
    expect(assigned.unassignedTasks).toHaveLength(0)
  })

  it('respects worker capacity and sends overflow to backlog', () => {
    const tasks: GeneratedCandidateTask[] = [
      {
        id: 'T1',
        productionJobId: 'JOB-1',
        productionStep: 'DIBOND',
        description: 'big task',
        estimatedMinutes: 200,
        notes: '',
        dueDate: '2026-07-28',
        dueStatus: 'OVERDUE',
        priority: 'CUSTOMER_PURCHASED',
        assignedWorkerId: 'EMP-W1',
        carryForward: false,
        source: 'NEW',
      },
    ]

    const workers = makeEmployees().filter((employee) => employee.role === 'WORKER')
    const availability = new Map<string, number>([
      ['EMP-W1', 120],
      ['EMP-W2', 90],
    ])

    const assigned = assignTasksToWorkers(tasks, workers, availability)
    expect(assigned.unassignedTasks).toHaveLength(1)
    expect(assigned.unassignedTasks[0].reason).toBe('INSUFFICIENT_CAPACITY')
  })

  it('does not duplicate carry-forward tasks', () => {
    const previousTask: BattlePlanTask = {
      id: 'OLD-1',
      productionJobId: 'JOB-CF',
      productionStep: 'PRINTED',
      description: 'carry task',
      estimatedMinutes: 30,
      completed: false,
      sortOrder: 1,
      notes: '',
      carryForward: true,
      locked: false,
    }

    const previousPlan: BattlePlan = {
      id: 'BP-PREV',
      date: '2026-07-27',
      assignedWorkerId: 'EMP-W1',
      createdById: 'EMP-DIR',
      approvedById: 'EMP-DIR',
      availableMinutes: 120,
      generationType: 'AUTOMATIC',
      status: 'IN_PROGRESS',
      tasks: [previousTask],
      endOfDayNotes: '',
    }

    const jobs = [
      makeJob({
        id: 'JOB-CF',
        steps: {
          FILES: 'COMPLETE',
          PRINTED: 'WAITING',
          DIBOND: 'NOT_APPLICABLE',
          STRETCHER_BASE: 'WAITING',
          MOUNTED: 'WAITING',
          FRAME_MADE: 'WAITING',
          FRAMED: 'WAITING',
          SHIPPED: 'WAITING',
        },
      }),
    ]

    const result = generateDailyBattlePlans({
      date: '2026-07-28',
      jobs,
      employees: makeEmployees(),
      workerConfigs: makeWorkerConfigs(),
      existingPlans: [previousPlan],
    })

    const generatedTasks = result.workerPlans.flatMap((plan) => plan.tasks)
    const matching = generatedTasks.filter(
      (task) => task.productionJobId === 'JOB-CF' && task.productionStep === 'PRINTED',
    )

    expect(matching).toHaveLength(1)
  })

  it('preserves locked tasks during regeneration', () => {
    const existing: BattlePlan = {
      id: 'AUTO-BP-2026-07-28-EMP-W1',
      date: '2026-07-28',
      assignedWorkerId: 'EMP-W1',
      createdById: 'EMP-DIR',
      approvedById: 'EMP-DIR',
      availableMinutes: 120,
      generationType: 'AUTOMATIC',
      status: 'DRAFT',
      tasks: [
        {
          id: 'LOCK-1',
          productionJobId: 'JOB-LOCK',
          productionStep: 'PRINTED',
          description: 'locked task',
          estimatedMinutes: 30,
          completed: false,
          sortOrder: 1,
          notes: '',
          carryForward: false,
          locked: true,
        },
      ],
      endOfDayNotes: '',
    }

    const generated = generateDailyBattlePlans({
      date: '2026-07-28',
      jobs: [
        makeJob({
          id: 'JOB-NEW',
          orderNumber: 'WEB-NEW',
        }),
      ],
      employees: makeEmployees(),
      workerConfigs: makeWorkerConfigs(),
      existingPlans: [],
    })

    const regenerated = regenerateBattlePlans([existing], generated)
    const workerPlan = regenerated.workerPlans.find((plan) => plan.assignedWorkerId === 'EMP-W1')

    expect(workerPlan?.tasks.some((task) => task.productionJobId === 'JOB-LOCK')).toBe(true)
  })

  it('generates separate worker and director plans', () => {
    const result = generateDailyBattlePlans({
      date: '2026-07-28',
      jobs: [makeJob({ id: 'JOB-X' })],
      employees: makeEmployees(),
      workerConfigs: makeWorkerConfigs(),
      existingPlans: [],
    })

    expect(result.workerPlans.length).toBe(2)
    expect(result.directorPlan.assignedWorkerId).toBe('EMP-DIR')
  })

  it('director plan includes worker review tasks', () => {
    const result = generateDailyBattlePlans({
      date: '2026-07-28',
      jobs: [makeJob({ id: 'JOB-X' })],
      employees: makeEmployees(),
      workerConfigs: makeWorkerConfigs(),
      existingPlans: [],
    })

    const reviewTasks = result.directorPlan.tasks.filter((task) =>
      task.description.includes('Review and manage'),
    )

    expect(reviewTasks.length).toBeGreaterThanOrEqual(2)
  })

  it('returns unassigned when no qualified worker exists', () => {
    const employees = makeEmployees().map((employee) =>
      employee.id === 'EMP-W1'
        ? { ...employee, skills: ['PRINTED'] as ProductionStepName[] }
        : employee,
    )

    const jobs = [
      makeJob({
        id: 'JOB-DIBOND',
        productType: 'TEXTURED_REPLICA_3D',
        steps: {
          FILES: 'COMPLETE',
          PRINTED: 'COMPLETE',
          DIBOND: 'WAITING',
          STRETCHER_BASE: 'WAITING',
          MOUNTED: 'WAITING',
          FRAME_MADE: 'WAITING',
          FRAMED: 'WAITING',
          SHIPPED: 'WAITING',
        },
      }),
    ]

    const result = generateDailyBattlePlans({
      date: '2026-07-28',
      jobs,
      employees,
      workerConfigs: makeWorkerConfigs(),
      existingPlans: [],
    })

    expect(result.unassignedBacklog.some((task) => task.reason === 'NO_QUALIFIED_WORKER')).toBe(true)
  })
})
