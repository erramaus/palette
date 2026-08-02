import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createEntityId } from '../utils/id'
import { nowIso } from '../utils/time'
import { mockEmployees } from '../data/mockEmployees'
import { mockProductionJobs } from '../data/mockProductionJobs'
import { mockBattlePlans } from '../data/mockBattlePlans'
import type { Employee } from '../types/employees'
import type { ProductionJob, ProductionStepName } from '../types/production'
import type { BattlePlan } from '../types/battlePlans'
import type { ActivityAction, ActivityEntityType } from '../types/entities'
import { cycleStepStatus } from '../utils/productionSteps'
import { calculateDueStatus } from '../utils/dueStatus'

export interface AppActivityLog {
  id: string
  entityType: ActivityEntityType
  entityId: string
  action: ActivityAction
  actorEmployeeId?: string
  occurredAt: string
  metadata?: Record<string, string | number | boolean | null>
}

export interface CreateActivityLogInput {
  entityType: ActivityEntityType
  entityId: string
  action: ActivityAction
  actorEmployeeId?: string
  metadata?: Record<string, string | number | boolean | null>
}

export interface CompleteProductionStepInput {
  jobId: string
  stepName: ProductionStepName
  actualMinutes: number
  actorEmployeeId?: string
  metadata?: Record<string, string | number | boolean | null>
}

interface AppStateContextValue {
  employees: Employee[]
  productionJobs: ProductionJob[]
  battlePlans: BattlePlan[]
  activityLogs: AppActivityLog[]
  updateProductionStep: (jobId: string, stepName: ProductionStepName) => void
  completeProductionStep: (input: CompleteProductionStepInput) => void
  createBattlePlan: (battlePlan: BattlePlan) => void
  replaceBattlePlansForDate: (date: string, nextPlans: BattlePlan[]) => void
  saveBattlePlan: (updatedPlan: BattlePlan) => void
  addActivityLog: (input: CreateActivityLogInput) => void
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [productionJobs, setProductionJobs] = useState<ProductionJob[]>(mockProductionJobs)
  const [battlePlans, setBattlePlans] = useState<BattlePlan[]>(mockBattlePlans)
  const [activityLogs, setActivityLogs] = useState<AppActivityLog[]>([])

  const updateProductionStep = useCallback(
    (jobId: string, stepName: ProductionStepName) => {
      setProductionJobs((currentJobs) =>
        currentJobs.map((job) => {
          if (job.id !== jobId) {
            return job
          }

          const updatedSteps = {
            ...job.steps,
            [stepName]: cycleStepStatus(job.steps[stepName]),
          }

          return {
            ...job,
            steps: updatedSteps,
            dueStatus: calculateDueStatus(job.dueDate, job.onHold),
          }
        }),
      )
    },
    [setProductionJobs],
  )

  const completeProductionStep = useCallback(
    (input: CompleteProductionStepInput) => {
      setProductionJobs((currentJobs) =>
        currentJobs.map((job) => {
          if (job.id !== input.jobId) {
            return job
          }

          const updatedSteps = {
            ...job.steps,
            [input.stepName]: 'COMPLETE',
          }

          return {
            ...job,
            steps: updatedSteps,
            dueStatus: calculateDueStatus(job.dueDate, job.onHold),
          }
        }),
      )

      setActivityLogs((currentLogs) => [
        {
          id: createEntityId('activity'),
          entityType: 'ProductionStep',
          entityId: `${input.jobId}:${input.stepName}`,
          action: 'STEP_COMPLETED',
          actorEmployeeId: input.actorEmployeeId,
          occurredAt: nowIso(),
          metadata: {
            actualMinutes: input.actualMinutes,
            ...(input.metadata ?? {}),
          },
        },
        ...currentLogs,
      ])
    },
    [setProductionJobs, setActivityLogs],
  )

  const createBattlePlan = useCallback(
    (battlePlan: BattlePlan) => {
      setBattlePlans((currentPlans) => [battlePlan, ...currentPlans])
    },
    [setBattlePlans],
  )

  const replaceBattlePlansForDate = useCallback(
    (date: string, nextPlans: BattlePlan[]) => {
      setBattlePlans((currentPlans) => [
        ...nextPlans,
        ...currentPlans.filter((plan) => plan.date !== date),
      ])
    },
    [setBattlePlans],
  )

  const saveBattlePlan = useCallback(
    (updatedPlan: BattlePlan) => {
      setBattlePlans((currentPlans) =>
        currentPlans.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan)),
      )
    },
    [setBattlePlans],
  )

  const addActivityLog = useCallback(
    (input: CreateActivityLogInput) => {
      setActivityLogs((currentLogs) => [
        {
          id: createEntityId('activity'),
          entityType: input.entityType,
          entityId: input.entityId,
          action: input.action,
          actorEmployeeId: input.actorEmployeeId,
          occurredAt: nowIso(),
          metadata: input.metadata,
        },
        ...currentLogs,
      ])
    },
    [setActivityLogs],
  )

  const value = useMemo(
    () => ({
      employees: mockEmployees,
      productionJobs,
      battlePlans,
      activityLogs,
      updateProductionStep,
      completeProductionStep,
      createBattlePlan,
      replaceBattlePlansForDate,
      saveBattlePlan,
      addActivityLog,
    }),
    [
      productionJobs,
      battlePlans,
      activityLogs,
      updateProductionStep,
      completeProductionStep,
      createBattlePlan,
      replaceBattlePlansForDate,
      saveBattlePlan,
      addActivityLog,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export const useAppState = (): AppStateContextValue => {
  const contextValue = useContext(AppStateContext)

  if (!contextValue) {
    throw new Error('useAppState must be used within AppStateProvider')
  }

  return contextValue
}
