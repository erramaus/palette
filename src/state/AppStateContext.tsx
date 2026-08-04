import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createEntityId } from '../utils/id'
import { nowIso } from '../utils/time'
import { mockEmployees } from '../data/mockEmployees'
import { mockProductionJobs } from '../data/mockProductionJobs'
import { mockBattlePlans } from '../data/mockBattlePlans'
import { getWorkshopListUiEnvironment } from '../services/workshopListUiBootstrap'
import type {
  OperationIntelligenceSignal,
  OperationProductionTag,
  ProductionOperation,
  WorkshopOrderNode,
} from '../services/ProductionPipelineService'
import { ProductionOperationService } from '../services/ProductionOperationService'
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
import type { ActivityAction, ActivityEntityType, ProductionTag } from '../types/entities'
import type {
  ThreeDFilePreparation,
  ThreeDOrderImportClassification,
} from '../types/threeDFilePreparation'
import { cycleStepStatus } from '../utils/productionSteps'
import { calculateDueStatus } from '../utils/dueStatus'
import { DEFAULT_FORECAST_CONFIG, type ForecastConfig } from '../types/productionForecasting'
import { DEFAULT_PRODUCTION_ANALYTICS_TARGETS, type ProductionAnalyticsTargets } from '../types/productionAnalytics'
import type { OptimizationConstraint, OptimizationWeights } from '../types/battlePlanOptimization'
import { DEFAULT_OPTIMIZATION_CONSTRAINTS, DEFAULT_OPTIMIZATION_WEIGHTS } from '../services/battlePlanOptimizationConfig'
import { getWorkItemDetailService } from '../services/WorkItemDetailService'
import {
  WebsiteOrderExcelImportService,
  type WebsiteOrderImportPreview,
} from '../services/WebsiteOrderExcelImportService'
import { ensureRecurringInventoryBattlePlanTasks } from '../services/inventoryBattlePlanTasks'
import {
  LocalStoragePersistenceAdapter,
  PersistenceService,
  createPersistenceSnapshot,
  rebuildWorkItemsFromSnapshot,
  summarizeSnapshot,
  type IntelligenceReviewState,
  type PersistenceRecordSummary,
  type PersistenceSnapshot,
} from '../services/persistence'
import {
  DEFAULT_PRODUCTION_CALENDAR,
  SchedulingService,
  type ScheduleEntry,
  type ScheduleResult,
  type SchedulingCategory,
} from '../services/scheduling'

export type PersistenceStatus = 'Saved' | 'Saving' | 'Save Failed' | 'Restored' | 'Migration Required'

export interface RestorePersistenceResult {
  preRestoreBackup: string
  summary: PersistenceRecordSummary
}

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
  orderSource?: string
  requestedDeliveryOrPickupDate?: string
  redNotes?: string
  shippingOrPickupMethod?: import('../types/entities').PackagingMethodCode
  originalImport?: Record<string, unknown>
}

export interface ImportWarehouseExcelInput {
  preview: WebsiteOrderImportPreview
  selectedSourceRecordIds: string[]
  importedByEmployeeId: string
}

export interface ImportWarehouseExcelResult {
  importedSourceRecordIds: string[]
  reusedSourceRecordIds: string[]
  skippedSourceRecordIds: string[]
}

interface AppStateContextValue {
  employees: Employee[]
  productionJobs: ProductionJob[]
  threeDFilePreparations: ThreeDFilePreparation[]
  battlePlans: BattlePlan[]
  activityLogs: AppActivityLog[]
  productionOperations: ProductionOperation[]
  operationTags: OperationProductionTag[]
  productionTags: ProductionTag[]
  scheduleResult: ScheduleResult
  scheduleEntries: ScheduleEntry[]
  operationBattlePlanItems: ScheduleEntry[]
  operationTimeline: ScheduleEntry[]
  operationIntelligence: OperationIntelligenceSignal[]
  workshopHierarchy: WorkshopOrderNode[]
  forecastSettings: ForecastConfig
  analyticsTargets: ProductionAnalyticsTargets
  optimizationWeights: OptimizationWeights
  optimizationConstraints: OptimizationConstraint
  intelligenceReviewState: IntelligenceReviewState
  persistenceStatus: PersistenceStatus
  persistenceWarning: string | null
  assignOperation: (operationId: string, employeeId: string, assignedBy: string) => void
  unassignOperation: (operationId: string, unassignedBy: string) => void
  startOperation: (operationId: string, startedBy: string) => void
  blockOperation: (input: { operationId: string; reason: string; blockedBy: string; dependencyOrMaterialReference?: string }) => void
  unblockOperation: (operationId: string, unblockedBy: string) => void
  completeOperation: (input: { operationId: string; completedBy: string; directorOverride?: { approvedBy: string; reason: string } }) => void
  reopenOperation: (operationId: string, reopenedBy: string, reason: string) => void
  carryForwardOperation: (input: { operationId: string; originalBattlePlanDate: string; newBattlePlanDate: string; reason: string; carriedForwardBy: string }) => void
  changeOperationDueDate: (operationId: string, dueDate: string, changedBy: string) => void
  changeOperationPriority: (operationId: string, priority: number, changedBy: string) => void
  addOperationNote: (operationId: string, note: string, addedBy: string) => void
  getOperationHistory: (operationId: string) => import('../services/ProductionPipelineService').ProductionOperationHistoryEntry[]
  updateProductionStep: (jobId: string, stepName: ProductionStepName) => void
  completeProductionStep: (input: CompleteProductionStepInput) => void
  importProductionOrder: (input: ImportProductionOrderInput) => { job: ProductionJob; preparation?: ThreeDFilePreparation }
  importWarehouseExcelOrders: (input: ImportWarehouseExcelInput) => ImportWarehouseExcelResult
  saveThreeDFilePreparation: (preparation: ThreeDFilePreparation, actorEmployeeId?: string) => void
  validateThreeDFilePreparation: (preparationId: string, actorEmployeeId?: string) => void
  createBattlePlan: (battlePlan: BattlePlan) => void
  replaceBattlePlansForDate: (date: string, nextPlans: BattlePlan[]) => void
  saveBattlePlan: (updatedPlan: BattlePlan) => void
  addActivityLog: (input: CreateActivityLogInput) => void
  saveForecastSettings: (settings: ForecastConfig) => void
  saveAnalyticsTargets: (targets: ProductionAnalyticsTargets) => void
  saveOptimizationSettings: (weights: OptimizationWeights, constraints: OptimizationConstraint) => void
  notifyWorkItemMutation: () => void
  generateProductionTags: (workItemId: string, actorEmployeeId?: string) => void
  printProductionTag: (workItemId: string, tagId: string, actorEmployeeId?: string) => void
  setIntelligenceReviewState: (state: IntelligenceReviewState) => void
  exportPersistenceBackup: () => string
  inspectPersistenceBackup: (serialized: string) => { snapshot: PersistenceSnapshot; summary: PersistenceRecordSummary }
  restorePersistenceBackup: (serialized: string) => RestorePersistenceResult
  resetLocalPersistence: () => void
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

const emptyIntelligenceReviewState = (): IntelligenceReviewState => ({
  dismissedRecommendationIds: {},
  reviewedRecommendationIds: {},
  acceptedRecommendationIds: {},
})

const APPLICATION_VERSION = '0.0.0'

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const environment = useMemo(() => getWorkshopListUiEnvironment(), [])
  const persistenceService = useMemo(
    () => new PersistenceService(new LocalStoragePersistenceAdapter(window.localStorage)),
    [],
  )
  const baselineWorkItems = useMemo(() => structuredClone(environment.workItemService.listWorkItems()), [environment])
  const initialPersistence = useMemo(() => {
    try {
      const result = persistenceService.load()
      if (result.snapshot) {
        const restoredWorkflowContexts = result.snapshot.data.settings.workflowContexts
        if (restoredWorkflowContexts && typeof restoredWorkflowContexts === 'object') {
          environment.replaceWorkflowContexts(restoredWorkflowContexts as typeof environment.workflowContexts)
        }
        environment.replaceCustomers(result.snapshot.data.customers)
        environment.replaceArtworks(result.snapshot.data.artworks)
        environment.replaceProducts(result.snapshot.data.products)
        environment.replaceDepartments(result.snapshot.data.departments)
        environment.workItemService.replaceAllWorkItems(rebuildWorkItemsFromSnapshot(result.snapshot))
      }
      return { ...result, error: null as string | null }
    } catch (error) {
      return {
        snapshot: null,
        migrated: false,
        error: error instanceof Error ? error.message : 'Saved production data could not be loaded.',
      }
    }
  }, [environment, persistenceService])
  const [productionJobs, setProductionJobs] = useState<ProductionJob[]>(initialPersistence.snapshot?.data.orders ?? mockProductionJobs)
  const [threeDFilePreparations, setThreeDFilePreparations] = useState<ThreeDFilePreparation[]>(
    initialPersistence.snapshot?.data.productionPieces ?? buildInitialThreeDPreparations(),
  )
  const [battlePlans, setBattlePlans] = useState<BattlePlan[]>(
    ensureRecurringInventoryBattlePlanTasks(initialPersistence.snapshot?.data.battlePlans ?? mockBattlePlans),
  )
  const [activityLogs, setActivityLogs] = useState<AppActivityLog[]>(initialPersistence.snapshot?.data.activityLogs ?? [])
  const [forecastSettings, setForecastSettings] = useState<ForecastConfig>(() => ({
    ...DEFAULT_FORECAST_CONFIG,
    ...((initialPersistence.snapshot?.data.settings.forecastSettings as Partial<ForecastConfig> | undefined) ?? {}),
  }))
  const [analyticsTargets, setAnalyticsTargets] = useState<ProductionAnalyticsTargets>(() => ({
    ...DEFAULT_PRODUCTION_ANALYTICS_TARGETS,
    ...((initialPersistence.snapshot?.data.settings.analyticsTargets as Partial<ProductionAnalyticsTargets> | undefined) ?? {}),
  }))
  const [optimizationWeights, setOptimizationWeights] = useState<OptimizationWeights>(() => ({
    ...DEFAULT_OPTIMIZATION_WEIGHTS,
    ...((initialPersistence.snapshot?.data.settings.optimizationWeights as Partial<OptimizationWeights> | undefined) ?? {}),
  }))
  const [optimizationConstraints, setOptimizationConstraints] = useState<OptimizationConstraint>(() => ({
    ...DEFAULT_OPTIMIZATION_CONSTRAINTS,
    ...((initialPersistence.snapshot?.data.settings.optimizationConstraints as Partial<OptimizationConstraint> | undefined) ?? {}),
  }))
  const [intelligenceReviewState, setIntelligenceReviewState] = useState<IntelligenceReviewState>(
    initialPersistence.snapshot?.data.intelligenceReviewState ?? emptyIntelligenceReviewState(),
  )
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>(
    initialPersistence.error ? 'Save Failed' : initialPersistence.migrated ? 'Migration Required' : initialPersistence.snapshot ? 'Restored' : 'Saved',
  )
  const [persistenceWarning, setPersistenceWarning] = useState<string | null>(initialPersistence.error)
  const [operationRevision, setOperationRevision] = useState(0)
  const persistenceUnlocked = useRef(initialPersistence.error === null)
  const skipInitialSave = useRef(true)
  const workItemDetailService = useMemo(() => {
    const service = getWorkItemDetailService(environment)
    service.refreshLookupMaps(productionJobs)
    return service
  }, [environment, productionJobs])
  const websiteOrderExcelImportService = useMemo(() => new WebsiteOrderExcelImportService(), [])
  useEffect(() => {
    if (initialPersistence.snapshot) {
      workItemDetailService.replaceGeneratedTags(initialPersistence.snapshot.data.productionTags)
    }
  }, [initialPersistence.snapshot, workItemDetailService])
  const productionOperationService = useMemo(() => new ProductionOperationService({
    listWorkItems: () => environment.workItemService.listWorkItems(),
    recordActivity: (input) => setActivityLogs((currentLogs) => [{
      id: createEntityId('activity'),
      entityType: 'ProductionOperation',
      entityId: input.entityId,
      action: input.action,
      actorEmployeeId: input.actorEmployeeId,
      occurredAt: nowIso(),
      metadata: input.metadata,
    }, ...currentLogs]),
  }), [environment])

  const pipelineProjections = useMemo(() => {
    const workItems = environment.workItemService.listWorkItems()
    const pipeline = environment.productionPipelineService
    return {
      productionOperations: workItems.flatMap((workItem) => pipeline.getOperations(workItem)),
      operationTags: workItems.flatMap((workItem) => pipeline.buildTags(workItem)),
      workshopHierarchy: pipeline.buildWorkshopHierarchy(workItems),
    }
  }, [environment, productionJobs, operationRevision])
  const productionTags = useMemo(
    () => workItemDetailService.listGeneratedTags().sort((left, right) => right.generatedAt.localeCompare(left.generatedAt)),
    [workItemDetailService, operationRevision],
  )

  const scheduleResult = useMemo(() => {
    const workItems = environment.workItemService.listWorkItems()
    const lockedTaskByOperationId = new Map(battlePlans.flatMap((plan) => plan.tasks
      .filter((task) => task.locked && task.productionOperationId)
      .map((task) => [task.productionOperationId!, { plan, task }] as const)))
    const schedulingService = new SchedulingService()
    return schedulingService.schedule({
      operations: workItems.flatMap((workItem) => {
        const pipeline = workItem.customFields.pipeline && typeof workItem.customFields.pipeline === 'object'
          ? workItem.customFields.pipeline as Record<string, unknown>
          : {}
        const orderNumber = typeof pipeline.orderNumber === 'string' ? pipeline.orderNumber : workItem.orderId
        const job = productionJobs.find((candidate) => candidate.orderNumber === orderNumber)
        const category: SchedulingCategory = workItem.type === 'ORIGINAL'
          ? 'ORIGINAL'
          : workItem.type === 'GALLERY_INVENTORY' ? 'GALLERY' : 'CUSTOMER'
        const width = typeof pipeline.width === 'number' ? pipeline.width : 0
        const height = typeof pipeline.height === 'number' ? pipeline.height : 0
        return environment.productionPipelineService.getOperations(workItem).map((operation) => ({
          id: operation.id,
          workItemId: workItem.id,
          orderNumber,
          pieceLabel: `${width}x${height} ${workItem.type.replaceAll('_', ' ')}`,
          operation: operation.name,
          status: operation.status,
          estimatedMinutes: operation.estimatedMinutes,
          cutMemberCount: operation.cutMemberCount,
          cutLinearInches: operation.cutLinearInches,
          cutCalculationStatus: operation.cutCalculation?.status,
          tagStatus: operation.tagStatus,
          dependencyIds: operation.dependsOnOperationIds,
          dueDate: operation.dueDate ?? workItem.dueDate ?? '',
          priority: operation.priority,
          category,
          createdAt: workItem.createdAt,
          assignedEmployeeId: operation.assignedEmployeeId,
          materialNotes: job?.notes ?? '',
        }))
      }),
      employees: mockEmployees.filter((employee) => employee.active && employee.role === 'WORKER').map((employee) => ({
        employeeId: employee.id,
        employeeName: employee.name,
        skills: employee.skills,
        availableMinutes: employee.defaultAvailableMinutes,
        overtimeApprovedMinutes: optimizationConstraints.allowOvertime ? optimizationConstraints.overtimeLimitMinutes : 0,
      })),
      calendar: DEFAULT_PRODUCTION_CALENDAR,
      constraints: workItems.flatMap((workItem) => {
        const job = productionJobs.find((candidate) => candidate.orderNumber === workItem.orderId)
        const notes = job?.notes.toLowerCase() ?? ''
        return environment.productionPipelineService.getOperations(workItem).map((operation) => {
          const locked = lockedTaskByOperationId.get(operation.id)
          return {
            operationId: operation.id,
            materialReadiness: /missing material|waiting (on )?material|supply unavailable/.test(notes) ? 'MISSING' as const
              : operation.materialRequirement?.grossLinearInches === null
                ? 'MISSING' as const
                : /material|supply|crate|dibond/.test(notes) ? 'LIMITED' as const : 'READY' as const,
            approvalReady: !/missing approval|waiting (on )?approval/.test(notes),
            lockedEmployeeId: locked?.plan.assignedWorkerId,
            lockedStart: locked ? `${locked.plan.date}T08:00:00` : undefined,
            overtimeApproved: optimizationConstraints.allowOvertime,
          }
        })
      }),
    })
  }, [battlePlans, environment, operationRevision, optimizationConstraints, productionJobs])

  const scheduleEntries = scheduleResult.entries
  const operationBattlePlanItems = useMemo(
    () => scheduleEntries.filter((entry) => entry.status !== 'COMPLETE'),
    [scheduleEntries],
  )
  const operationIntelligence = useMemo<OperationIntelligenceSignal[]>(() => {
    const activeEntries = scheduleEntries.filter((entry) => entry.status !== 'COMPLETE')
    return [...new Set(activeEntries.map((entry) => entry.operation))].map((operation) => {
      const entries = activeEntries.filter((entry) => entry.operation === operation)
      const conflicts = scheduleResult.conflicts.filter((conflict) => entries.some((entry) => entry.operationId === conflict.operationId))
      const estimatedMinutes = entries.reduce((sum, entry) => sum + entry.estimatedMinutes, 0)
      return {
        operation,
        queued: entries.length,
        blocked: conflicts.filter((conflict) => conflict.severity === 'CRITICAL').length,
        estimatedMinutes,
        recommendation: conflicts.length > 0
          ? `${operation} has ${conflicts.length} schedule conflict(s) requiring director review.`
          : `${operation} has ${estimatedMinutes} scheduled minute(s) across ${entries.length} operation(s).`,
      }
    }).sort((left, right) => right.estimatedMinutes - left.estimatedMinutes)
  }, [scheduleEntries, scheduleResult.conflicts])

  const buildSnapshot = useCallback((): PersistenceSnapshot => createPersistenceSnapshot({
    applicationVersion: APPLICATION_VERSION,
    orders: productionJobs,
    customers: environment.listCustomers(),
    artworks: environment.listArtworks(),
    products: environment.listProducts(),
    departments: environment.listDepartments(),
    productionPieces: threeDFilePreparations,
    workItems: environment.workItemService.listWorkItems(),
    productionOperations: pipelineProjections.productionOperations,
    battlePlans,
    productionTags: workItemDetailService.listGeneratedTags(),
    tagSnapshots: pipelineProjections.operationTags,
    timelineEvents: scheduleEntries,
    activityLogs,
    intelligenceReviewState,
    settings: {
      forecastSettings,
      analyticsTargets,
      optimizationWeights,
      optimizationConstraints,
      workflowContexts: environment.workflowContexts,
    },
  }), [
    activityLogs,
    analyticsTargets,
    battlePlans,
    environment,
    forecastSettings,
    intelligenceReviewState,
    optimizationConstraints,
    optimizationWeights,
    pipelineProjections,
    productionJobs,
    scheduleEntries,
    threeDFilePreparations,
    workItemDetailService,
  ])

  useEffect(() => {
    if (!persistenceUnlocked.current) return
    if (skipInitialSave.current) {
      skipInitialSave.current = false
      return
    }

    setPersistenceStatus('Saving')
    const timeout = window.setTimeout(() => {
      try {
        persistenceService.save(buildSnapshot())
        setPersistenceStatus('Saved')
        setPersistenceWarning(null)
      } catch (error) {
        setPersistenceStatus('Save Failed')
        setPersistenceWarning(error instanceof Error ? error.message : 'Production data could not be saved.')
      }
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [buildSnapshot, persistenceService])

  const synchronizeOperation = useCallback((updated: ProductionOperation): void => {
    setOperationRevision((current) => current + 1)
    setBattlePlans((currentPlans) => ensureRecurringInventoryBattlePlanTasks(currentPlans.map((plan) => ({
      ...plan,
      tasks: plan.tasks.map((task) => task.productionOperationId === updated.id ? {
        ...task,
        completed: updated.status === 'COMPLETE',
        carryForward: updated.carryForwardHistory.length > 0,
        productionOperationStatus: updated.status,
        operationAssignedEmployeeId: updated.assignedEmployeeId,
        operationDueDate: updated.dueDate,
        operationPriority: updated.priority,
      } : task),
    }))))
  }, [])

  const assignOperation = useCallback((operationId: string, employeeId: string, assignedBy: string) =>
    synchronizeOperation(productionOperationService.assignOperation(operationId, employeeId, assignedBy)),
  [productionOperationService, synchronizeOperation])
  const unassignOperation = useCallback((operationId: string, unassignedBy: string) =>
    synchronizeOperation(productionOperationService.unassignOperation(operationId, unassignedBy)),
  [productionOperationService, synchronizeOperation])
  const startOperation = useCallback((operationId: string, startedBy: string) =>
    synchronizeOperation(productionOperationService.startOperation(operationId, startedBy)),
  [productionOperationService, synchronizeOperation])
  const blockOperation = useCallback((input: { operationId: string; reason: string; blockedBy: string; dependencyOrMaterialReference?: string }) =>
    synchronizeOperation(productionOperationService.blockOperation(input)),
  [productionOperationService, synchronizeOperation])
  const unblockOperation = useCallback((operationId: string, unblockedBy: string) =>
    synchronizeOperation(productionOperationService.unblockOperation(operationId, unblockedBy)),
  [productionOperationService, synchronizeOperation])
  const completeOperation = useCallback((input: { operationId: string; completedBy: string; directorOverride?: { approvedBy: string; reason: string } }) =>
    synchronizeOperation(productionOperationService.completeOperation(input)),
  [productionOperationService, synchronizeOperation])
  const reopenOperation = useCallback((operationId: string, reopenedBy: string, reason: string) =>
    synchronizeOperation(productionOperationService.reopenOperation(operationId, reopenedBy, reason)),
  [productionOperationService, synchronizeOperation])
  const carryForwardOperation = useCallback((input: { operationId: string; originalBattlePlanDate: string; newBattlePlanDate: string; reason: string; carriedForwardBy: string }) =>
    synchronizeOperation(productionOperationService.carryForwardOperation(input)),
  [productionOperationService, synchronizeOperation])
  const changeOperationDueDate = useCallback((operationId: string, dueDate: string, changedBy: string) =>
    synchronizeOperation(productionOperationService.changeOperationDueDate(operationId, dueDate, changedBy)),
  [productionOperationService, synchronizeOperation])
  const changeOperationPriority = useCallback((operationId: string, priority: number, changedBy: string) =>
    synchronizeOperation(productionOperationService.changeOperationPriority(operationId, priority, changedBy)),
  [productionOperationService, synchronizeOperation])
  const addOperationNote = useCallback((operationId: string, note: string, addedBy: string) =>
    synchronizeOperation(productionOperationService.addOperationNote(operationId, note, addedBy)),
  [productionOperationService, synchronizeOperation])
  const getOperationHistory = useCallback((operationId: string) => productionOperationService.getOperationHistory(operationId), [productionOperationService])

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
      const defaultWorkerId = mockEmployees.find(
        (employee) => employee.role === 'WORKER' && employee.active,
      )?.id
      const assignedWorkerId =
        input.assignedWorkerId
        ?? defaultWorkerId
        ?? mockEmployees.find((employee) => employee.role === 'PRODUCTION_DIRECTOR')?.id
        ?? mockEmployees[0].id
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
        orderSource: input.orderSource ?? 'PALETTE_UI',
        requestedDeliveryOrPickupDate: input.requestedDeliveryOrPickupDate,
        redNotes: input.redNotes,
        shippingOrPickupMethod: input.shippingOrPickupMethod,
        originalImport: input.originalImport ?? { ...input },
      }

      const result = environment.ingestProductionJob(job)
      const workItemId = result.workItem.id
      const { artworkId } = result

      const preparation = isThreeDProductType(productType)
        ? recalculateThreeDFilePreparation(
            createThreeDFilePreparation({
              workItemId,
              productionJobId: job.id,
              artworkId,
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
                  attentionRequired: preparation.attentionRequired,
                },
              },
            ]
          : []),
        ...currentLogs,
      ])

      return { job, preparation }
    },
    [environment, setProductionJobs, setThreeDFilePreparations, setActivityLogs],
  )

  const importWarehouseExcelOrders = useCallback(
    ({ preview, selectedSourceRecordIds, importedByEmployeeId }: ImportWarehouseExcelInput): ImportWarehouseExcelResult => {
      const selectedRows = preview.rows.filter((row) => selectedSourceRecordIds.includes(row.sourceRecordId))
      const importedSourceRecordIds: string[] = []
      const reusedSourceRecordIds: string[] = []
      const skippedSourceRecordIds: string[] = []

      setProductionJobs((currentJobs) => {
        const nextJobs = [...currentJobs]

        for (const row of selectedRows) {
          if (!row.normalized || row.bucket === 'SKIPPED_ROWS' || row.bucket === 'ERRORS') {
            skippedSourceRecordIds.push(row.sourceRecordId)
            continue
          }

          const importInput = websiteOrderExcelImportService.toProductionInput(row, importedByEmployeeId)
          const existingIndex = nextJobs.findIndex((job) => job.id === row.sourceRecordId)
          const job: ProductionJob = {
            id: row.sourceRecordId,
            orderNumber: importInput.orderNumber,
            customerName: importInput.customerName,
            artworkTitle: importInput.artworkName,
            productType: importInput.productType,
            width: importInput.width,
            height: importInput.height,
            frameInfo: row.normalized.frameSelection.normalized ?? row.normalized.frameSelection.original,
            dueDate: importInput.dueDate,
            dueStatus: calculateDueStatus(importInput.dueDate, false),
            priority: importInput.priority,
            assignedWorkerId: mockEmployees.find((employee) => employee.role === 'PRODUCTION_DIRECTOR')?.id ?? mockEmployees[0].id,
            notes: importInput.notes.join('\n'),
            steps: defaultStepsForProductType(importInput.productType),
            estimatedMinutes: defaultEstimatedMinutesForProductType(importInput.productType),
            orderSource: 'WAREHOUSE_EXCEL_EXPORT',
            requestedDeliveryOrPickupDate: undefined,
            redNotes: undefined,
            shippingOrPickupMethod: importInput.originalImport.shippingOrPickupMethod as ProductionJob['shippingOrPickupMethod'],
            originalImport: importInput.originalImport,
          }

          if (existingIndex >= 0) {
            nextJobs.splice(existingIndex, 1, job)
            reusedSourceRecordIds.push(row.sourceRecordId)
          } else {
            nextJobs.unshift(job)
            importedSourceRecordIds.push(row.sourceRecordId)
          }

          const result = environment.ingestProductionJob(job)
          workItemDetailService.refreshLookupMaps(nextJobs)
          if (workItemDetailService.getGeneratedTagsForWorkItem(result.workItem.id).length === 0) {
            workItemDetailService.generateTags(result.workItem.id, importedByEmployeeId)
          }
        }

        return nextJobs
      })

      setOperationRevision((current) => current + 1)

      return {
        importedSourceRecordIds,
        reusedSourceRecordIds,
        skippedSourceRecordIds,
      }
    },
    [environment, setProductionJobs, workItemDetailService, websiteOrderExcelImportService],
  )

  const createBattlePlan = useCallback(
    (battlePlan: BattlePlan) => {
      setBattlePlans((currentPlans) =>
        ensureRecurringInventoryBattlePlanTasks([battlePlan, ...currentPlans]),
      )
    },
    [setBattlePlans],
  )

  const replaceBattlePlansForDate = useCallback(
    (date: string, nextPlans: BattlePlan[]) => {
      setBattlePlans((currentPlans) =>
        ensureRecurringInventoryBattlePlanTasks([
          ...nextPlans,
          ...currentPlans.filter((plan) => plan.date !== date),
        ]),
      )
    },
    [setBattlePlans],
  )

  const saveBattlePlan = useCallback(
    (updatedPlan: BattlePlan) => {
      setBattlePlans((currentPlans) =>
        ensureRecurringInventoryBattlePlanTasks(
          currentPlans.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan)),
        ),
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

  const saveForecastSettings = useCallback((settings: ForecastConfig): void => {
    setForecastSettings(settings)
    addActivityLog({
      entityType: 'BattlePlan',
      entityId: 'PRODUCTION_FORECAST_SETTINGS',
      action: 'FORECAST_CONFIG_CHANGED',
      metadata: {
        minimumHistoricalSampleCount: settings.minimumHistoricalSampleCount,
        conservativePercentile: settings.conservativePercentile,
        forecastBufferHours: settings.forecastBufferHours,
      },
    })
  }, [addActivityLog])

  const saveAnalyticsTargets = useCallback((targets: ProductionAnalyticsTargets): void => {
    setAnalyticsTargets(targets)
    addActivityLog({
      entityType: 'BattlePlan',
      entityId: 'WEEKLY_ANALYTICS_TARGETS',
      action: 'TARGET_CHANGED',
      metadata: {
        onTimeCompletionRateTarget: targets.onTimeCompletionRateTarget,
        scheduleAttainmentTarget: targets.scheduleAttainmentTarget,
        firstPassQualityTarget: targets.firstPassQualityTarget,
      },
    })
  }, [addActivityLog])

  const saveOptimizationSettings = useCallback((weights: OptimizationWeights, constraints: OptimizationConstraint): void => {
    setOptimizationWeights(weights)
    setOptimizationConstraints(constraints)
  }, [])

  const notifyWorkItemMutation = useCallback((): void => {
    setOperationRevision((current) => current + 1)
  }, [])

  const generateProductionTags = useCallback((workItemId: string, actorEmployeeId?: string): void => {
    workItemDetailService.generateTags(workItemId, actorEmployeeId)
    setOperationRevision((current) => current + 1)
  }, [workItemDetailService])

  const printProductionTag = useCallback((workItemId: string, tagId: string, actorEmployeeId?: string): void => {
    workItemDetailService.printTag(workItemId, tagId, actorEmployeeId)
    setOperationRevision((current) => current + 1)
  }, [workItemDetailService])

  const exportPersistenceBackup = useCallback((): string =>
    persistenceService.exportBackup(buildSnapshot()),
  [buildSnapshot, persistenceService])

  const inspectPersistenceBackup = useCallback((serialized: string) => {
    const snapshot = persistenceService.importBackup(serialized)
    return { snapshot, summary: summarizeSnapshot(snapshot) }
  }, [persistenceService])

  const applySnapshot = useCallback((snapshot: PersistenceSnapshot): void => {
    const restoredWorkflowContexts = snapshot.data.settings.workflowContexts
    if (restoredWorkflowContexts && typeof restoredWorkflowContexts === 'object') {
      environment.replaceWorkflowContexts(restoredWorkflowContexts as typeof environment.workflowContexts)
    }
    environment.replaceCustomers(snapshot.data.customers)
    environment.replaceArtworks(snapshot.data.artworks)
    environment.replaceProducts(snapshot.data.products)
    environment.replaceDepartments(snapshot.data.departments)
    environment.workItemService.replaceAllWorkItems(rebuildWorkItemsFromSnapshot(snapshot))
    workItemDetailService.refreshLookupMaps(snapshot.data.orders)
    setProductionJobs(snapshot.data.orders)
    setThreeDFilePreparations(snapshot.data.productionPieces)
    setBattlePlans(ensureRecurringInventoryBattlePlanTasks(snapshot.data.battlePlans))
    setActivityLogs(snapshot.data.activityLogs)
    setForecastSettings({
      ...DEFAULT_FORECAST_CONFIG,
      ...((snapshot.data.settings.forecastSettings as Partial<ForecastConfig> | undefined) ?? {}),
    })
    setAnalyticsTargets({
      ...DEFAULT_PRODUCTION_ANALYTICS_TARGETS,
      ...((snapshot.data.settings.analyticsTargets as Partial<ProductionAnalyticsTargets> | undefined) ?? {}),
    })
    setOptimizationWeights({
      ...DEFAULT_OPTIMIZATION_WEIGHTS,
      ...((snapshot.data.settings.optimizationWeights as Partial<OptimizationWeights> | undefined) ?? {}),
    })
    setOptimizationConstraints({
      ...DEFAULT_OPTIMIZATION_CONSTRAINTS,
      ...((snapshot.data.settings.optimizationConstraints as Partial<OptimizationConstraint> | undefined) ?? {}),
    })
    workItemDetailService.replaceGeneratedTags(snapshot.data.productionTags)
    setIntelligenceReviewState(snapshot.data.intelligenceReviewState)
    setOperationRevision((current) => current + 1)
  }, [environment, workItemDetailService])

  const restorePersistenceBackup = useCallback((serialized: string): RestorePersistenceResult => {
    const preRestoreBackup = persistenceService.exportBackup(buildSnapshot())
    const snapshot = persistenceService.importBackup(serialized)
    applySnapshot(snapshot)
    persistenceUnlocked.current = true
    setPersistenceWarning(null)
    setPersistenceStatus('Restored')
    setActivityLogs((current) => [{
      id: createEntityId('activity'),
      entityType: 'BattlePlan',
      entityId: 'LOCAL_PERSISTENCE',
      action: 'UPDATED',
      occurredAt: nowIso(),
      metadata: { operation: 'RESTORE', sourceSavedAt: snapshot.savedAt },
    }, ...current])
    return { preRestoreBackup, summary: summarizeSnapshot(snapshot) }
  }, [applySnapshot, buildSnapshot, persistenceService])

  const resetLocalPersistence = useCallback((): void => {
    persistenceService.reset()
    environment.workItemService.replaceAllWorkItems(baselineWorkItems)
    setProductionJobs(mockProductionJobs)
    setThreeDFilePreparations(buildInitialThreeDPreparations())
    setBattlePlans(ensureRecurringInventoryBattlePlanTasks(mockBattlePlans))
    setForecastSettings(DEFAULT_FORECAST_CONFIG)
    setAnalyticsTargets(DEFAULT_PRODUCTION_ANALYTICS_TARGETS)
    setOptimizationWeights(DEFAULT_OPTIMIZATION_WEIGHTS)
    setOptimizationConstraints(DEFAULT_OPTIMIZATION_CONSTRAINTS)
    workItemDetailService.replaceGeneratedTags([])
    setIntelligenceReviewState(emptyIntelligenceReviewState())
    setActivityLogs([{
      id: createEntityId('activity'),
      entityType: 'BattlePlan',
      entityId: 'LOCAL_PERSISTENCE',
      action: 'UPDATED',
      occurredAt: nowIso(),
      metadata: { operation: 'RESET' },
    }])
    setOperationRevision((current) => current + 1)
    persistenceUnlocked.current = true
    setPersistenceWarning(null)
    setPersistenceStatus('Restored')
  }, [baselineWorkItems, environment, persistenceService, workItemDetailService])

  const value = useMemo(
    () => ({
      employees: mockEmployees,
      productionJobs,
      threeDFilePreparations,
      battlePlans,
      activityLogs,
      scheduleResult,
      scheduleEntries,
      operationBattlePlanItems,
      operationTimeline: scheduleEntries,
      operationIntelligence,
      productionTags,
      forecastSettings,
      analyticsTargets,
      optimizationWeights,
      optimizationConstraints,
      intelligenceReviewState,
      persistenceStatus,
      persistenceWarning,
      ...pipelineProjections,
      assignOperation,
      unassignOperation,
      startOperation,
      blockOperation,
      unblockOperation,
      completeOperation,
      reopenOperation,
      carryForwardOperation,
      changeOperationDueDate,
      changeOperationPriority,
      addOperationNote,
      getOperationHistory,
      updateProductionStep,
      completeProductionStep,
      importProductionOrder,
      importWarehouseExcelOrders,
      saveThreeDFilePreparation,
      validateThreeDFilePreparation,
      createBattlePlan,
      replaceBattlePlansForDate,
      saveBattlePlan,
      addActivityLog,
      saveForecastSettings,
      saveAnalyticsTargets,
      saveOptimizationSettings,
      notifyWorkItemMutation,
      generateProductionTags,
      printProductionTag,
      setIntelligenceReviewState,
      exportPersistenceBackup,
      inspectPersistenceBackup,
      restorePersistenceBackup,
      resetLocalPersistence,
    }),
    [
      productionJobs,
      threeDFilePreparations,
      battlePlans,
      activityLogs,
      forecastSettings,
      analyticsTargets,
      optimizationWeights,
      optimizationConstraints,
      intelligenceReviewState,
      persistenceStatus,
      persistenceWarning,
      pipelineProjections,
      scheduleResult,
      scheduleEntries,
      operationBattlePlanItems,
      operationIntelligence,
      productionTags,
      assignOperation,
      unassignOperation,
      startOperation,
      blockOperation,
      unblockOperation,
      completeOperation,
      reopenOperation,
      carryForwardOperation,
      changeOperationDueDate,
      changeOperationPriority,
      addOperationNote,
      getOperationHistory,
      updateProductionStep,
      completeProductionStep,
      importProductionOrder,
      importWarehouseExcelOrders,
      saveThreeDFilePreparation,
      validateThreeDFilePreparation,
      createBattlePlan,
      replaceBattlePlansForDate,
      saveBattlePlan,
      addActivityLog,
      saveForecastSettings,
      saveAnalyticsTargets,
      saveOptimizationSettings,
      notifyWorkItemMutation,
      generateProductionTags,
      printProductionTag,
      exportPersistenceBackup,
      inspectPersistenceBackup,
      restorePersistenceBackup,
      resetLocalPersistence,
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
