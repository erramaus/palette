import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { mockEmployees } from '../data/mockEmployees'
import { mockProductionJobs } from '../data/mockProductionJobs'
import { mockBattlePlans } from '../data/mockBattlePlans'
import type { Employee } from '../types/employees'
import type { ProductionJob, ProductionStepName } from '../types/production'
import type { BattlePlan } from '../types/battlePlans'
import { cycleStepStatus } from '../utils/productionSteps'
import { calculateDueStatus } from '../utils/dueStatus'

interface AppStateContextValue {
  employees: Employee[]
  productionJobs: ProductionJob[]
  battlePlans: BattlePlan[]
  updateProductionStep: (jobId: string, stepName: ProductionStepName) => void
  createBattlePlan: (battlePlan: BattlePlan) => void
  replaceBattlePlansForDate: (date: string, nextPlans: BattlePlan[]) => void
  saveBattlePlan: (updatedPlan: BattlePlan) => void
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [productionJobs, setProductionJobs] = useState<ProductionJob[]>(mockProductionJobs)
  const [battlePlans, setBattlePlans] = useState<BattlePlan[]>(mockBattlePlans)

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

  const value = useMemo(
    () => ({
      employees: mockEmployees,
      productionJobs,
      battlePlans,
      updateProductionStep,
      createBattlePlan,
      replaceBattlePlansForDate,
      saveBattlePlan,
    }),
    [
      productionJobs,
      battlePlans,
      updateProductionStep,
      createBattlePlan,
      replaceBattlePlansForDate,
      saveBattlePlan,
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
