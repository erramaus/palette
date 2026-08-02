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
import { getWorkshopListUiEnvironment } from '../services/workshopListUiBootstrap'
import {
  createSeededThreeDFilePreparation,
  createThreeDFilePreparation,
  finalizeThreeDValidation,
  inferThreeDAlignment,
  isThreeDPreparationReadyForPrinter,
  isThreeDProductType,
  mapImportClassificationToProductType,
  recalculateThreeDFilePreparation,
} from '../services/threeDFilePreparationService'
import type { Employee } from '../types/employees'
import type { ProductionJob, ProductionStepName } from '../types/production'
import type { ProductionEstimatedMinutes, ProductionStepsRecord } from '../types/production'
import type { BattlePlan } from '../types/battlePlans'
import type { ActivityAction, ActivityEntityType } from '../types/entities'
import type {
  ThreeDFilePreparation,
  ThreeDOrderImportClassification,
} from '../types/threeDFilePreparation'
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

export interface ImportProductionOrderInput {
  orderNumber: string
  customerName: string
  artworkTitle: string
  classification: ThreeDOrderImportClassification
  orderedWidth: number
  orderedHeight: number
  alignment?: 'HORIZ' | 'VERT' | 'SQUARE' | 'PANORAMA'
  dueDate: string
  frameInfo: string
  priority?: 'ORIGINALS' | 'CUSTOMER_PURCHASED' | 'GALLERY_INVENTORY'
  assignedWorkerId?: string
  notes?: string
  scanDate?: string
  existingFilesFound?: boolean
  existingFilesCorrectSize?: boolean
  colorFilePresent?: boolean
  depthSlicesPresent?: boolean
}

interface AppStateContextValue {
  employees: Employee[]
  productionJobs: ProductionJob[]
  threeDFilePreparations: ThreeDFilePreparation[]
  battlePlans: BattlePlan[]
  activityLogs: AppActivityLog[]
  updateProductionStep: (jobId: string, stepName: ProductionStepName) => void
  completeProductionStep: (input: CompleteProductionStepInput) => void
  importProductionOrder: (input: ImportProductionOrderInput) => { job: ProductionJob; preparation?: ThreeDFilePreparation }
  saveThreeDFilePreparation: (preparation: ThreeDFilePreparation, actorEmployeeId?: string) => void
  validateThreeDFilePreparation: (preparationId: string, actorEmployeeId?: string) => void
  createBattlePlan: (battlePlan: BattlePlan) => void
  replaceBattlePlansForDate: (date: string, nextPlans: BattlePlan[]) => void
  saveBattlePlan: (updatedPlan: BattlePlan) => void
  addActivityLog: (input: CreateActivityLogInput) => void
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

const defaultStepsForProductType = (productType: ProductionJob['productType']): ProductionStepsRecord => ({
  FILES: isThreeDProductType(productType) ? 'WAITING' : productType === 'ORIGINAL' ? 'NOT_APPLICABLE' : 'COMPLETE',
  PRINTED: productType === 'ORIGINAL' ? 'NOT_APPLICABLE' : 'WAITING',
  DIBOND: isThreeDProductType(productType) ? 'WAITING' : 'NOT_APPLICABLE',
  STRETCHER_BASE: productType === 'ORIGINAL' ? 'COMPLETE' : 'WAITING',
  MOUNTED: 'WAITING',
  FRAME_MADE: 'WAITING',
  FRAMED: 'WAITING',
  SHIPPED: 'WAITING',
})

const defaultEstimatedMinutesForProductType = (productType: ProductionJob['productType']): ProductionEstimatedMinutes => {
  if (isThreeDProductType(productType)) {
    return {
      FILES: 135,
      PRINTED: 55,
      DIBOND: 75,
      STRETCHER_BASE: 80,
      MOUNTED: 95,
      FRAME_MADE: 120,
      FRAMED: 90,
      SHIPPED: 45,
    }
  }

  if (productType === 'ORIGINAL') {
    return {
      FILES: 0,
      PRINTED: 0,
      DIBOND: 0,
      STRETCHER_BASE: 65,
      MOUNTED: 85,
      FRAME_MADE: 130,
      FRAMED: 95,
      SHIPPED: 45,
    }
  }

  return {
    FILES: productType === 'PAPER' ? 18 : 15,
    PRINTED: 50,
    DIBOND: 0,
    STRETCHER_BASE: 80,
    MOUNTED: 90,
    FRAME_MADE: 105,
    FRAMED: 85,
    SHIPPED: 40,
  }
}

const syncJobFilesStep = (
  job: ProductionJob,
  preparation: ThreeDFilePreparation,
): ProductionJob => {
  if (!isThreeDProductType(job.productType)) {
    return job
  }

  return {
    ...job,
    steps: {
      ...job.steps,
      FILES: isThreeDPreparationReadyForPrinter(preparation) ? 'COMPLETE' : 'WAITING',
    },
    dueStatus: calculateDueStatus(job.dueDate, job.onHold),
  }
}

const buildInitialThreeDPreparations = (): ThreeDFilePreparation[] => {
  const environment = getWorkshopListUiEnvironment()
  return mockProductionJobs
    .filter((job) => isThreeDProductType(job.productType))
    .map((job) => {
      const workItemId = environment.getWorkItemIdForOrderNumber(job.orderNumber) ?? `WI-${job.orderNumber}`
      return createSeededThreeDFilePreparation(job, workItemId)
    })
}

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [productionJobs, setProductionJobs] = useState<ProductionJob[]>(mockProductionJobs)
  const [threeDFilePreparations, setThreeDFilePreparations] = useState<ThreeDFilePreparation[]>(() => buildInitialThreeDPreparations())
  const [battlePlans, setBattlePlans] = useState<BattlePlan[]>(mockBattlePlans)
  const [activityLogs, setActivityLogs] = useState<AppActivityLog[]>([])

  const updateProductionStep = useCallback(
    (jobId: string, stepName: ProductionStepName) => {
      setProductionJobs((currentJobs) =>
        currentJobs.map((job) => {
          if (job.id !== jobId) {
            return job
          }

          if (stepName === 'FILES' && isThreeDProductType(job.productType)) {
            const linkedPreparation = threeDFilePreparations.find((preparation) => preparation.productionJobId === job.id)
            if (linkedPreparation && !isThreeDPreparationReadyForPrinter(linkedPreparation)) {
              return job
            }
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
    [setProductionJobs, threeDFilePreparations],
  )

  const completeProductionStep = useCallback(
    (input: CompleteProductionStepInput) => {
      setProductionJobs((currentJobs) =>
        currentJobs.map((job) => {
          if (job.id !== input.jobId) {
            return job
          }

          if (input.stepName === 'FILES' && isThreeDProductType(job.productType)) {
            const linkedPreparation = threeDFilePreparations.find((preparation) => preparation.productionJobId === job.id)
            if (linkedPreparation && !isThreeDPreparationReadyForPrinter(linkedPreparation)) {
              return job
            }
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
    [setProductionJobs, setActivityLogs, threeDFilePreparations],
  )

  const saveThreeDFilePreparation = useCallback(
    (preparation: ThreeDFilePreparation, actorEmployeeId?: string) => {
      const recalculated = recalculateThreeDFilePreparation(preparation)
      const environment = getWorkshopListUiEnvironment()

      setThreeDFilePreparations((currentPreparations) =>
        currentPreparations.map((current) =>
          current.id === recalculated.id ? recalculated : current,
        ),
      )

      setProductionJobs((currentJobs) =>
        currentJobs.map((job) =>
          job.id === recalculated.productionJobId ? syncJobFilesStep(job, recalculated) : job,
        ),
      )

      environment.workItemService.updateWorkItem(recalculated.workItemId, {
        status: recalculated.status === 'VALIDATION_FAILED' ? 'BLOCKED' : undefined,
        customFields: {
          threeDFilePreparationStatus: recalculated.status,
          threeDAttentionRequired: recalculated.attentionRequired,
          threeDSignatureStatus: recalculated.signatureStatus,
        },
        actorEmployeeId,
      })

      setActivityLogs((currentLogs) => [
        {
          id: createEntityId('activity'),
          entityType: 'WorkItem',
          entityId: recalculated.workItemId,
          action: 'THREE_D_FILE_PREPARATION_UPDATED',
          actorEmployeeId,
          occurredAt: nowIso(),
          metadata: {
            status: recalculated.status,
            productionJobId: recalculated.productionJobId,
          },
        },
        ...currentLogs,
      ])
    },
    [setThreeDFilePreparations, setProductionJobs, setActivityLogs],
  )

  const validateThreeDFilePreparation = useCallback(
    (preparationId: string, actorEmployeeId?: string) => {
      const currentPreparation = threeDFilePreparations.find((current) => current.id === preparationId)
      if (!currentPreparation) {
        return
      }

      const validatedPreparation = finalizeThreeDValidation(currentPreparation, actorEmployeeId)
      const environment = getWorkshopListUiEnvironment()

      setThreeDFilePreparations((currentPreparations) =>
        currentPreparations.map((current) => {
          return current.id === preparationId ? validatedPreparation : current
        }),
      )

      setProductionJobs((currentJobs) =>
        currentJobs.map((job) =>
          validatedPreparation && job.id === validatedPreparation.productionJobId
            ? syncJobFilesStep(job, validatedPreparation)
            : job,
        ),
      )

      environment.workItemService.updateWorkItem(validatedPreparation.workItemId, {
        status: validatedPreparation.status === 'VALIDATION_FAILED' ? 'BLOCKED' : 'READY',
        customFields: {
          threeDFilePreparationStatus: validatedPreparation.status,
          threeDAttentionRequired: validatedPreparation.attentionRequired,
          threeDSignatureStatus: validatedPreparation.signatureStatus,
        },
        actorEmployeeId,
      })

      setActivityLogs((currentLogs) =>
        [
          {
            id: createEntityId('activity'),
            entityType: 'WorkItem',
            entityId: validatedPreparation.workItemId,
            action: 'THREE_D_FILE_PREPARATION_VALIDATED',
            actorEmployeeId,
            occurredAt: nowIso(),
            metadata: {
              status: validatedPreparation.status,
              failedChecks: validatedPreparation.validationResults.filter((result) => !result.passed).length,
            },
          },
          ...currentLogs,
        ],
      )
    },
    [threeDFilePreparations, setThreeDFilePreparations, setProductionJobs, setActivityLogs],
  )

  const importProductionOrder = useCallback(
    (input: ImportProductionOrderInput) => {
      const productType = mapImportClassificationToProductType(input.classification)
      const assignedWorkerId = input.assignedWorkerId ?? mockEmployees.find((employee) => employee.role === 'PRODUCTION_DIRECTOR')?.id ?? mockEmployees[0].id
      const jobId = createEntityId('job')
      const job: ProductionJob = {
        id: jobId,
        orderNumber: input.orderNumber,
        customerName: input.customerName,
        artworkTitle: input.artworkTitle,
        productType,
        width: input.orderedWidth,
        height: input.orderedHeight,
        frameInfo: input.frameInfo,
        dueDate: input.dueDate,
        dueStatus: calculateDueStatus(input.dueDate, false),
        priority: input.priority ?? 'CUSTOMER_PURCHASED',
        assignedWorkerId,
        notes: input.notes ?? '',
        steps: defaultStepsForProductType(productType),
        estimatedMinutes: defaultEstimatedMinutesForProductType(productType),
      }

      const environment = getWorkshopListUiEnvironment()
      const workItemId = environment.ingestProductionJob(job)

      const preparation = isThreeDProductType(productType)
        ? recalculateThreeDFilePreparation(
            createThreeDFilePreparation({
              workItemId,
              productionJobId: job.id,
              artworkId: `artwork-${job.id}`,
              artworkName: job.artworkTitle,
              orderedWidth: job.width,
              orderedHeight: job.height,
              importClassification: input.classification,
              productType,
              alignment: input.alignment ?? inferThreeDAlignment(job.width, job.height),
              scanDate: input.scanDate,
              existingFilesFound: input.existingFilesFound,
              existingFilesCorrectSize: input.existingFilesCorrectSize,
              colorFilePresent: input.colorFilePresent,
              depthSlicesPresent: input.depthSlicesPresent,
              notes: input.notes,
            }),
          )
        : undefined

      setProductionJobs((currentJobs) => [
        preparation ? syncJobFilesStep(job, preparation) : job,
        ...currentJobs,
      ])

      if (preparation) {
        setThreeDFilePreparations((currentPreparations) => [preparation, ...currentPreparations])
      }

      setActivityLogs((currentLogs) => [
        {
          id: createEntityId('activity'),
          entityType: 'Order',
          entityId: job.orderNumber,
          action: 'CREATED',
          occurredAt: nowIso(),
          metadata: {
            productType,
            imported: true,
          },
        },
        ...(preparation
          ? [
              {
                id: createEntityId('activity'),
                entityType: 'WorkItem' as const,
                entityId: workItemId,
                action: 'THREE_D_FILE_PREPARATION_CREATED' as const,
                occurredAt: nowIso(),
                metadata: {
                  preparationId: preparation.id,
                  status: preparation.status,
                },
              },
            ]
          : []),
        ...currentLogs,
      ])

      return { job, preparation }
    },
    [setProductionJobs, setThreeDFilePreparations, setActivityLogs],
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
      threeDFilePreparations,
      battlePlans,
      activityLogs,
      updateProductionStep,
      completeProductionStep,
      importProductionOrder,
      saveThreeDFilePreparation,
      validateThreeDFilePreparation,
      createBattlePlan,
      replaceBattlePlansForDate,
      saveBattlePlan,
      addActivityLog,
    }),
    [
      productionJobs,
      threeDFilePreparations,
      battlePlans,
      activityLogs,
      updateProductionStep,
      completeProductionStep,
      importProductionOrder,
      saveThreeDFilePreparation,
      validateThreeDFilePreparation,
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
