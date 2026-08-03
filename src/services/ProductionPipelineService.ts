import type { WorkItem } from '../models'
import type { BattlePlan, BattlePlanTask } from '../types/battlePlans'
import type { Employee } from '../types/employees'
import type { ProductionStepName, ProductType } from '../types/production'
import type { ProductionCutCalculationResult } from '../types/productionCut'
import { BaseCalculationService } from './BaseCalculationService'
import { FrameCalculationService } from './FrameCalculationService'
import { StretcherCalculationService } from './StretcherCalculationService'
import type { GenerationResult } from './battlePlanGenerator'
import type { ScheduleEntry } from './scheduling'

export type ProductionOperationName =
  | 'FILES'
  | 'PRINT'
  | 'PRINTED'
  | 'BASE_CUT'
  | 'BASE_ASSEMBLY'
  | 'STRETCHER_CUT'
  | 'STRETCHER_ASSEMBLY'
  | 'STRETCHER'
  | 'STRETCH'
  | 'TRIM'
  | 'SLICE'
  | 'RESIZE'
  | 'DIBOND'
  | 'MOUNT'
  | 'FRAME_CUT'
  | 'FRAME_ASSEMBLY'
  | 'FRAME'
  | 'QC'
  | 'SHIPPING'

export type ProductionOperationStatus =
  | 'PENDING'
  | 'READY'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETE'

export interface ProductionOperation {
  id: string
  workItemId: string
  name: ProductionOperationName
  sequence: number
  status: ProductionOperationStatus
  estimatedMinutes: number
  cutCalculation?: ProductionCutCalculationResult
  cutMemberCount?: number
  cutLinearInches?: number
  materialRequirement?: {
    kind: 'FRAME_MOULDING' | 'BASE_STOCK' | 'STRETCHER_STOCK'
    grossLinearInches: number | null
    reservedLinearInches: number
    availableLinearInches: number
    shortageLinearInches: number
  }
  tagIds?: string[]
  tagStatus?: import('../types/entities').ProductionTagStatus
  workstation?: string
  dependsOnOperationIds: string[]
  assignedEmployeeId?: string
  dueDate?: string
  priority: number
  notes: string[]
  startedAt?: string
  startedBy?: string
  completedAt?: string
  completedBy?: string
  block?: ProductionOperationBlock
  blockHistory: ProductionOperationBlock[]
  completionHistory: ProductionOperationCompletion[]
  carryForwardHistory: ProductionOperationCarryForward[]
  history: ProductionOperationHistoryEntry[]
}

export interface ProductionOperationBlock {
  reason: string
  blockedBy: string
  blockedAt: string
  dependencyOrMaterialReference?: string
  unblockedBy?: string
  unblockedAt?: string
}

export interface ProductionOperationCompletion {
  completedAt: string
  completedBy: string
  overrideReason?: string
  overriddenDependencyIds?: string[]
}

export interface ProductionOperationCarryForward {
  originalBattlePlanDate: string
  newBattlePlanDate: string
  reason: string
  carriedForwardBy: string
  carriedForwardAt: string
}

export interface ProductionOperationHistoryEntry {
  id: string
  action: string
  actorEmployeeId: string
  occurredAt: string
  detail: string
  metadata?: Record<string, string | number | boolean | null>
}

export interface PipelineOrderInput {
  orderNumber: string
  customerName: string
  artworkName: string
  productType: ProductType
  width: number
  height: number
  orientation: string
  priority: number
  dueDate: string
  notes: string[]
  assignedEmployeeId?: string
  departmentName?: string
  productName?: string
  customFields?: Record<string, unknown>
}

export interface PipelineWorkItemInput extends PipelineOrderInput {
  operationNames: ProductionOperationName[]
}

export interface OperationProductionTag {
  id: string
  operationId: string
  workItemId: string
  orderNumber: string
  artworkName: string
  pieceLabel: string
  operation: ProductionOperationName
  customerName: string
  orientation: string
  priority: number
  dueDate: string
  notes: string[]
  assignedEmployeeId?: string
  status: ProductionOperationStatus
}

export interface OperationIntelligenceSignal {
  operation: ProductionOperationName
  queued: number
  blocked: number
  estimatedMinutes: number
  recommendation: string
}

export interface WorkshopOperationNode {
  kind: 'OPERATION'
  id: string
  label: string
  status: ProductionOperationStatus
  dueDate: string
  priority: number
  percentComplete: number
  operation: ProductionOperation
}

export interface WorkshopPieceNode {
  kind: 'PIECE'
  id: string
  label: string
  status: ProductionOperationStatus
  dueDate: string
  priority: number
  percentComplete: number
  workItemId: string
  cutCalculations: ProductionCutCalculationResult[]
  operations: WorkshopOperationNode[]
}

export interface WorkshopArtworkNode {
  kind: 'ARTWORK'
  id: string
  label: string
  status: ProductionOperationStatus
  dueDate: string
  priority: number
  percentComplete: number
  pieces: WorkshopPieceNode[]
}

export interface WorkshopOrderNode {
  kind: 'ORDER'
  id: string
  label: string
  customerName: string
  status: ProductionOperationStatus
  dueDate: string
  priority: number
  percentComplete: number
  artworks: WorkshopArtworkNode[]
}

export interface ProductionPipelineResult {
  workItem: WorkItem
  operations: ProductionOperation[]
  tags: OperationProductionTag[]
  cutCalculations: ProductionCutCalculationResult[]
}

interface ProductionPipelineDependencies {
  createWorkItem: (input: PipelineWorkItemInput) => WorkItem
  nowProvider?: () => Date
}

const OPERATION_MINUTES: Record<ProductionOperationName, number> = {
  FILES: 30,
  PRINT: 55,
  PRINTED: 55,
  BASE_CUT: 25,
  BASE_ASSEMBLY: 35,
  STRETCHER_CUT: 20,
  STRETCHER_ASSEMBLY: 25,
  STRETCHER: 45,
  STRETCH: 40,
  TRIM: 25,
  SLICE: 60,
  RESIZE: 30,
  DIBOND: 75,
  MOUNT: 60,
  FRAME_CUT: 45,
  FRAME_ASSEMBLY: 45,
  FRAME: 90,
  QC: 20,
  SHIPPING: 35,
}

const OPERATION_TEMPLATES: Record<'CANVAS' | 'PAPER' | 'THREE_D' | 'OTHER', ProductionOperationName[]> = {
  CANVAS: ['FILES', 'PRINTED', 'STRETCHER', 'STRETCH', 'FRAME', 'QC', 'SHIPPING'],
  PAPER: ['FILES', 'PRINTED', 'TRIM', 'QC', 'SHIPPING'],
  THREE_D: ['FILES', 'SLICE', 'RESIZE', 'DIBOND', 'MOUNT', 'FRAME', 'QC', 'SHIPPING'],
  OTHER: ['FILES', 'FRAME', 'QC', 'SHIPPING'],
}

const statusRank: Record<ProductionOperationStatus, number> = {
  BLOCKED: 5,
  IN_PROGRESS: 4,
  READY: 3,
  PENDING: 2,
  COMPLETE: 1,
}

const operationStatus = (operations: ProductionOperation[]): ProductionOperationStatus =>
  [...operations].sort((left, right) => statusRank[right.status] - statusRank[left.status])[0]?.status ?? 'COMPLETE'

const percentComplete = (operations: ProductionOperation[]): number =>
  operations.length === 0
    ? 100
    : Math.round((operations.filter((operation) => operation.status === 'COMPLETE').length / operations.length) * 100)

export class ProductionPipelineService {
  private readonly createWorkItem: ProductionPipelineDependencies['createWorkItem']
  private readonly frameCalculationService = new FrameCalculationService()
  private readonly baseCalculationService = new BaseCalculationService()
  private readonly stretcherCalculationService = new StretcherCalculationService()

  constructor(dependencies: ProductionPipelineDependencies) {
    this.createWorkItem = dependencies.createWorkItem
  }

  importOrder(input: PipelineOrderInput): ProductionPipelineResult {
    const cutCalculations = this.calculateCuts(input)
    const operationNames = this.buildOperationRoute(input.productType, cutCalculations)
    const workItem = this.createWorkItem({ ...input, operationNames })
    const operations = this.createOperations(workItem, operationNames, cutCalculations)

    workItem.customFields = {
      ...workItem.customFields,
      pipeline: {
        orderNumber: input.orderNumber,
        customerName: input.customerName,
        artworkName: input.artworkName,
        width: input.width,
        height: input.height,
        orientation: input.orientation,
        cutCalculations,
        operations,
      },
    }
    workItem.tags = operationNames
    workItem.tagLabels = operationNames
    workItem.touch()

    return {
      workItem,
      operations,
      tags: this.buildTags(workItem),
      cutCalculations,
    }
  }

  getRequiredOperationNames(productType: ProductType): ProductionOperationName[] {
    if (productType === 'CANVAS') return [...OPERATION_TEMPLATES.CANVAS]
    if (productType === 'PAPER') return [...OPERATION_TEMPLATES.PAPER]
    if (productType === 'THREE_D_PRINT' || productType === 'TEXTURED_REPLICA_3D') {
      return [...OPERATION_TEMPLATES.THREE_D]
    }
    return [...OPERATION_TEMPLATES.OTHER]
  }

  getOperations(workItem: WorkItem): ProductionOperation[] {
    const pipeline = workItem.customFields.pipeline
    if (!pipeline || typeof pipeline !== 'object' || !('operations' in pipeline)) return []
    const operations = (pipeline as { operations?: unknown }).operations
    return Array.isArray(operations) ? operations as ProductionOperation[] : []
  }

  getCutCalculations(workItem: WorkItem): ProductionCutCalculationResult[] {
    const pipeline = workItem.customFields.pipeline
    if (!pipeline || typeof pipeline !== 'object' || !('cutCalculations' in pipeline)) return []
    const calculations = (pipeline as { cutCalculations?: unknown }).cutCalculations
    return Array.isArray(calculations) ? calculations as ProductionCutCalculationResult[] : []
  }

  buildTags(workItem: WorkItem): OperationProductionTag[] {
    const metadata = this.getMetadata(workItem)
    return this.getOperations(workItem).map((operation) => ({
      id: `tag:${operation.id}`,
      operationId: operation.id,
      workItemId: workItem.id,
      orderNumber: metadata.orderNumber,
      artworkName: metadata.artworkName,
      pieceLabel: `${metadata.width}x${metadata.height} ${this.formatProductType(workItem.type)}`,
      operation: operation.name,
      customerName: metadata.customerName,
      orientation: metadata.orientation,
      priority: workItem.priority,
      dueDate: workItem.dueDate ?? '',
      notes: [...workItem.notes],
      assignedEmployeeId: operation.assignedEmployeeId,
      status: operation.status,
    }))
  }

  buildWorkshopHierarchy(workItems: WorkItem[]): WorkshopOrderNode[] {
    const orders = new Map<string, WorkshopOrderNode>()
    for (const workItem of workItems) {
      const metadata = this.getMetadata(workItem)
      const operations = this.getOperations(workItem)
      if (operations.length === 0) continue
      const operationNodes: WorkshopOperationNode[] = operations.map((operation) => ({
        kind: 'OPERATION',
        id: operation.id,
        label: operation.name,
        status: operation.status,
        dueDate: workItem.dueDate ?? '',
        priority: workItem.priority,
        percentComplete: operation.status === 'COMPLETE' ? 100 : 0,
        operation,
      }))
      const piece: WorkshopPieceNode = {
        kind: 'PIECE',
        id: workItem.id,
        label: `${metadata.width}x${metadata.height} ${this.formatProductType(workItem.type)}`,
        status: operationStatus(operations),
        dueDate: workItem.dueDate ?? '',
        priority: workItem.priority,
        percentComplete: percentComplete(operations),
        workItemId: workItem.id,
        cutCalculations: this.getCutCalculations(workItem),
        operations: operationNodes,
      }
      const existingOrder = orders.get(metadata.orderNumber)
      if (existingOrder) {
        const artwork = existingOrder.artworks.find((node) => node.label === metadata.artworkName)
        if (artwork) artwork.pieces.push(piece)
        else existingOrder.artworks.push(this.createArtworkNode(workItem, metadata.artworkName, piece))
        this.refreshOrder(existingOrder)
      } else {
        orders.set(metadata.orderNumber, {
          kind: 'ORDER',
          id: metadata.orderNumber,
          label: metadata.orderNumber,
          customerName: metadata.customerName,
          status: piece.status,
          dueDate: piece.dueDate,
          priority: piece.priority,
          percentComplete: piece.percentComplete,
          artworks: [this.createArtworkNode(workItem, metadata.artworkName, piece)],
        })
      }
    }
    return [...orders.values()].sort((left, right) => left.dueDate.localeCompare(right.dueDate))
  }

  private createOperations(
    workItem: WorkItem,
    names: ProductionOperationName[],
    cutCalculations: ProductionCutCalculationResult[],
  ): ProductionOperation[] {
    let calculationBlocked = false
    return names.map((name, index) => {
      const cutCalculation = this.calculationForOperation(name, cutCalculations)
      const grossLinearInches = cutCalculation?.status === 'CONFIRMED'
        ? cutCalculation.members.reduce((sum, member) => sum + member.cutLengthInches, 0)
        : null
      const isBlockedByCalculation = this.isCutOperation(name) && cutCalculation?.status === 'NEEDS_REVIEW'
      calculationBlocked = calculationBlocked || isBlockedByCalculation
      return {
      id: `${workItem.id}:operation:${index + 1}`,
      workItemId: workItem.id,
      name,
      sequence: index + 1,
      status: calculationBlocked ? 'BLOCKED' : index === 0 ? 'READY' : 'PENDING',
      estimatedMinutes: OPERATION_MINUTES[name],
      cutCalculation,
      cutMemberCount: cutCalculation?.status === 'CONFIRMED' ? cutCalculation.members.length : undefined,
      cutLinearInches: cutCalculation?.status === 'CONFIRMED'
        ? grossLinearInches ?? undefined
        : undefined,
      materialRequirement: cutCalculation ? {
        kind: cutCalculation.kind === 'FRAME'
          ? 'FRAME_MOULDING'
          : cutCalculation.kind === 'BASE' ? 'BASE_STOCK' : 'STRETCHER_STOCK',
        grossLinearInches,
        reservedLinearInches: 0,
        availableLinearInches: 0,
        shortageLinearInches: grossLinearInches ?? 0,
      } : undefined,
      tagIds: [],
      tagStatus: cutCalculation?.status === 'CONFIRMED' ? 'READY_TO_PRINT' : cutCalculation ? 'NEEDS_REVIEW' : undefined,
      workstation: this.workstationForOperation(name),
      dependsOnOperationIds: index === 0 ? [] : [`${workItem.id}:operation:${index}`],
      assignedEmployeeId: workItem.assignedEmployeeId,
      dueDate: workItem.dueDate,
      priority: workItem.priority,
      notes: [],
      blockHistory: [],
      completionHistory: [],
      carryForwardHistory: [],
      history: [],
      }
    })
  }

  private calculateCuts(input: PipelineOrderInput): ProductionCutCalculationResult[] {
    const frameStyle = typeof input.customFields?.frameStyle === 'string'
      ? input.customFields.frameStyle
      : undefined
    const frameRequired = frameStyle !== undefined && this.requiresFrame(frameStyle)
    const explicitBaseStyle = typeof input.customFields?.baseStyle === 'string'
      ? input.customFields.baseStyle
      : undefined
    const baseStyle = explicitBaseStyle && this.requiresFrame(explicitBaseStyle)
      ? explicitBaseStyle
      : frameRequired ? frameStyle : undefined
    const mouldingIdentifier = typeof input.customFields?.mouldingIdentifier === 'string'
      ? input.customFields.mouldingIdentifier
      : undefined
    const calculations: ProductionCutCalculationResult[] = []

    if (frameRequired && frameStyle) {
      calculations.push(this.frameCalculationService.calculate({
        productType: input.productType,
        width: input.width,
        height: input.height,
        importedFrameName: frameStyle,
        mouldingIdentifier,
      }))
    }
    if ((input.productType === 'THREE_D_PRINT' || input.productType === 'TEXTURED_REPLICA_3D') && baseStyle) {
      calculations.push(this.baseCalculationService.calculate({
        productType: input.productType,
        width: input.width,
        height: input.height,
        importedFrameName: baseStyle,
        mouldingIdentifier,
      }))
    }
    if (input.productType === 'CANVAS' || input.productType === 'ORIGINAL') {
      calculations.push(this.stretcherCalculationService.calculate({
        productType: input.productType,
        width: input.width,
        height: input.height,
      }))
    }

    return calculations
  }

  private requiresFrame(frameStyle: string): boolean {
    const normalized = frameStyle.trim().toLowerCase().replace(/\s+/g, ' ')
    return normalized.length > 0 && normalized !== 'none' && normalized !== 'rolled' && normalized !== 'stretched'
  }

  private calculationForOperation(
    operation: ProductionOperationName,
    calculations: ProductionCutCalculationResult[],
  ): ProductionCutCalculationResult | undefined {
    const kind = operation === 'FRAME_CUT' || operation === 'FRAME_ASSEMBLY' || operation === 'FRAME'
      ? 'FRAME'
      : operation === 'STRETCHER_CUT' || operation === 'STRETCHER_ASSEMBLY' || operation === 'STRETCHER'
        ? 'STRETCHER'
        : operation === 'BASE_CUT' || operation === 'BASE_ASSEMBLY'
          ? 'BASE'
          : undefined
    return kind ? calculations.find((calculation) => calculation.kind === kind) : undefined
  }

  private buildOperationRoute(
    productType: ProductType,
    calculations: ProductionCutCalculationResult[],
  ): ProductionOperationName[] {
    const frame = calculations.find((calculation) => calculation.kind === 'FRAME')
    const base = calculations.find((calculation) => calculation.kind === 'BASE')
    const stretcher = calculations.find((calculation) => calculation.kind === 'STRETCHER')
    const route: ProductionOperationName[] = ['FILES']

    if (productType !== 'ORIGINAL') route.push('PRINT')
    if (base) route.push('BASE_CUT', 'BASE_ASSEMBLY', 'MOUNT')
    if (stretcher) route.push('STRETCHER_CUT', 'STRETCHER_ASSEMBLY', 'STRETCH')
    if (frame) route.push('FRAME_CUT', 'FRAME_ASSEMBLY', 'FRAME')
    if (productType === 'PAPER') route.push('TRIM')
    route.push('QC', 'SHIPPING')
    return route
  }

  private isCutOperation(operation: ProductionOperationName): boolean {
    return operation === 'FRAME_CUT' || operation === 'BASE_CUT' || operation === 'STRETCHER_CUT'
  }

  private workstationForOperation(operation: ProductionOperationName): string {
    if (operation === 'FRAME_CUT' || operation === 'FRAME_ASSEMBLY' || operation === 'FRAME') return 'frames'
    if (operation === 'BASE_CUT' || operation === 'BASE_ASSEMBLY') return 'base-shop'
    if (operation === 'STRETCHER_CUT' || operation === 'STRETCHER_ASSEMBLY' || operation === 'STRETCH') return 'stretching'
    if (operation === 'PRINT' || operation === 'PRINTED' || operation === 'TRIM') return 'printing'
    if (operation === 'MOUNT') return 'mounting'
    if (operation === 'QC') return 'qc'
    if (operation === 'SHIPPING') return 'shipping'
    return 'files'
  }

  private getMetadata(workItem: WorkItem): {
    orderNumber: string
    customerName: string
    artworkName: string
    width: number
    height: number
    orientation: string
  } {
    const raw = workItem.customFields.pipeline
    const pipeline = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
    return {
      orderNumber: typeof pipeline.orderNumber === 'string' ? pipeline.orderNumber : workItem.orderId,
      customerName: typeof pipeline.customerName === 'string' ? pipeline.customerName : workItem.customerId,
      artworkName: typeof pipeline.artworkName === 'string' ? pipeline.artworkName : workItem.artworkId ?? 'Untitled',
      width: typeof pipeline.width === 'number' ? pipeline.width : 0,
      height: typeof pipeline.height === 'number' ? pipeline.height : 0,
      orientation: typeof pipeline.orientation === 'string' ? pipeline.orientation : 'UNSPECIFIED',
    }
  }

  private createArtworkNode(workItem: WorkItem, artworkName: string, piece: WorkshopPieceNode): WorkshopArtworkNode {
    return {
      kind: 'ARTWORK',
      id: `${workItem.orderId}:${workItem.artworkId ?? artworkName}`,
      label: artworkName,
      status: piece.status,
      dueDate: piece.dueDate,
      priority: piece.priority,
      percentComplete: piece.percentComplete,
      pieces: [piece],
    }
  }

  private refreshOrder(order: WorkshopOrderNode): void {
    const pieces = order.artworks.flatMap((artwork) => artwork.pieces)
    for (const artwork of order.artworks) {
      const artworkOperations = artwork.pieces.flatMap((piece) => piece.operations.map((node) => node.operation))
      artwork.status = operationStatus(artworkOperations)
      artwork.percentComplete = percentComplete(artworkOperations)
    }
    const operations = pieces.flatMap((piece) => piece.operations.map((node) => node.operation))
    order.status = operationStatus(operations)
    order.percentComplete = percentComplete(operations)
  }

  private formatProductType(value: string): string {
    if (value === 'TEXTURED_REPLICA_3D' || value === 'THREE_D_PRINT') return '3D'
    return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
  }
}

const LEGACY_STEP_BY_OPERATION: Record<ProductionOperationName, ProductionStepName> = {
  FILES: 'FILES',
  PRINT: 'PRINTED',
  PRINTED: 'PRINTED',
  BASE_CUT: 'STRETCHER_BASE',
  BASE_ASSEMBLY: 'STRETCHER_BASE',
  STRETCHER_CUT: 'STRETCHER_BASE',
  STRETCHER_ASSEMBLY: 'STRETCHER_BASE',
  STRETCHER: 'STRETCHER_BASE',
  STRETCH: 'STRETCHER_BASE',
  TRIM: 'PRINTED',
  SLICE: 'FILES',
  RESIZE: 'FILES',
  DIBOND: 'DIBOND',
  MOUNT: 'MOUNTED',
  FRAME_CUT: 'FRAME_MADE',
  FRAME_ASSEMBLY: 'FRAME_MADE',
  FRAME: 'FRAMED',
  QC: 'SHIPPED',
  SHIPPING: 'SHIPPED',
}

const PRODUCTION_GROUP_BY_OPERATION: Partial<Record<ProductionOperationName, NonNullable<BattlePlanTask['productionGroup']>>> = {
  FRAME_CUT: 'FRAMES_TO_MAKE',
  FRAME_ASSEMBLY: 'FRAMES_TO_MAKE',
  BASE_CUT: 'BASES_TO_MAKE',
  BASE_ASSEMBLY: 'BASES_TO_MAKE',
  STRETCHER_CUT: 'STRETCHERS_TO_MAKE',
  STRETCHER_ASSEMBLY: 'STRETCHERS_TO_MAKE',
}

export const generateBattlePlansFromOperations = (input: {
  date: string
  operations: ScheduleEntry[]
  employees: Employee[]
  workerConfigs: Array<{ workerId: string; selected: boolean; availableMinutes: number }>
  directorId: string
}): GenerationResult => {
  const selectedConfigs = input.workerConfigs.filter((config) => config.selected)
  const tasksByWorker = new Map<string, BattlePlanTask[]>()
  const warnings: string[] = []
  const selectedWorkerIds = new Set(selectedConfigs.map((config) => config.workerId))
  const dailyOperations = input.operations
    .filter((operation) => operation.plannedStart.slice(0, 10) === input.date)
    .sort((left, right) => left.plannedStart.localeCompare(right.plannedStart))
  const attentionOperations = dailyOperations.filter((operation) =>
    operation.status === 'BLOCKED'
    || operation.cutCalculationStatus === 'NEEDS_REVIEW'
    || operation.tagStatus === 'NEEDS_REVIEW')
  const readyOperations = dailyOperations.filter((operation) => !attentionOperations.includes(operation))
  const unassigned = readyOperations.filter((operation) => !selectedWorkerIds.has(operation.assignedEmployee))

  for (const operation of readyOperations.filter((item) => selectedWorkerIds.has(item.assignedEmployee))) {
    const legacyStep = LEGACY_STEP_BY_OPERATION[operation.operation]
    const workerTasks = tasksByWorker.get(operation.assignedEmployee) ?? []
    workerTasks.push({
      id: `battle-task:${input.date}:${operation.operationId}`,
      productionJobId: operation.workItemId,
      productionStep: legacyStep,
      productionOperationId: operation.operationId,
      productionOperationName: operation.operation,
      productionOperationStatus: operation.status,
      operationAssignedEmployeeId: operation.assignedEmployee,
      operationDueDate: operation.dueDate,
      operationPriority: operation.priority,
      cutSummary: operation.cutMemberCount
        ? `${operation.cutMemberCount} members / ${operation.cutLinearInches} linear inches`
        : undefined,
      materialReadiness: operation.materialReadiness,
      tagStatus: operation.tagStatus,
      openWorkItemId: operation.workItemId,
      description: `${operation.operation} | ${operation.orderNumber} | ${operation.pieceLabel}`,
      estimatedMinutes: operation.estimatedMinutes,
      completed: false,
      sortOrder: workerTasks.length + 1,
      notes: `${operation.scheduleReason} Planned ${operation.plannedStart} to ${operation.plannedFinish}.`,
      carryForward: false,
      locked: operation.locked,
    })
    tasksByWorker.set(operation.assignedEmployee, workerTasks)
  }

  if (unassigned.length > 0) {
    warnings.push(`${unassigned.length} scheduled operation(s) are outside the selected worker pool.`)
  }

  const createPlan = (workerId: string, tasks: BattlePlanTask[]): BattlePlan => ({
    id: `pipeline-plan:${input.date}:${workerId}`,
    date: input.date,
    assignedWorkerId: workerId,
    createdById: input.directorId,
    approvedById: '',
    availableMinutes: selectedConfigs.find((config) => config.workerId === workerId)?.availableMinutes ?? 0,
    generationType: 'AUTOMATIC',
    status: 'DRAFT',
    tasks,
    endOfDayNotes: '',
  })

  const workerPlans = selectedConfigs.map((config) => createPlan(config.workerId, tasksByWorker.get(config.workerId) ?? []))
  const directorProductionTasks: BattlePlanTask[] = readyOperations
    .filter((operation) => PRODUCTION_GROUP_BY_OPERATION[operation.operation])
    .map((operation, index) => ({
      id: `battle-production:${input.date}:${operation.operationId}`,
      productionJobId: operation.workItemId,
      productionStep: LEGACY_STEP_BY_OPERATION[operation.operation],
      productionOperationId: operation.operationId,
      productionOperationName: operation.operation,
      productionOperationStatus: operation.status,
      operationAssignedEmployeeId: operation.assignedEmployee,
      operationDueDate: operation.dueDate,
      operationPriority: operation.priority,
      productionGroup: PRODUCTION_GROUP_BY_OPERATION[operation.operation],
      directorSection: 'PRODUCTION',
      description: `${operation.operation} | ${operation.orderNumber} | ${operation.pieceLabel}`,
      estimatedMinutes: operation.estimatedMinutes,
      completed: false,
      sortOrder: index + 1,
      notes: operation.scheduleReason,
      carryForward: false,
      locked: operation.locked,
      cutSummary: operation.cutMemberCount
        ? `${operation.cutMemberCount} members / ${operation.cutLinearInches} linear inches`
        : undefined,
      materialReadiness: operation.materialReadiness,
      tagStatus: operation.tagStatus,
      openWorkItemId: operation.workItemId,
    }))
  const directorTasks: BattlePlanTask[] = attentionOperations.map((operation, index) => ({
    id: `battle-attention:${input.date}:${operation.operationId}`,
    productionJobId: operation.workItemId,
    productionStep: LEGACY_STEP_BY_OPERATION[operation.operation],
    productionOperationId: operation.operationId,
    productionOperationName: operation.operation,
    productionOperationStatus: operation.status,
    operationAssignedEmployeeId: operation.assignedEmployee,
    operationDueDate: operation.dueDate,
    operationPriority: operation.priority,
    description: `CALCULATION ATTENTION | ${operation.operation} | ${operation.orderNumber} | ${operation.pieceLabel}`,
    estimatedMinutes: operation.estimatedMinutes,
    completed: false,
    sortOrder: directorProductionTasks.length + index + 1,
    notes: 'Blocked by Calculation. Review Calculation before assigning this saw work.',
    carryForward: false,
    locked: false,
    cutSummary: operation.cutMemberCount
      ? `${operation.cutMemberCount} members / ${operation.cutLinearInches} linear inches`
      : 'Unresolved cut dimensions',
    materialReadiness: operation.materialReadiness,
    tagStatus: operation.tagStatus ?? 'NEEDS_REVIEW',
    openWorkItemId: operation.workItemId,
    directorSection: 'REVIEW',
  }))
  const workersOverCapacity = selectedConfigs.filter(
    (config) => (tasksByWorker.get(config.workerId) ?? []).reduce((sum, task) => sum + task.estimatedMinutes, 0) > config.availableMinutes,
  ).length

  return {
    workerPlans,
    directorPlan: createPlan(input.directorId, [...directorProductionTasks, ...directorTasks]),
    unassignedBacklog: [],
    summary: {
      plansCreated: workerPlans.length + 1,
      tasksAssigned: workerPlans.reduce((sum, plan) => sum + plan.tasks.length, 0),
      tasksUnassigned: unassigned.length,
      workersOverCapacity,
      remainingBacklogMinutes: unassigned.reduce((sum, operation) => sum + operation.estimatedMinutes, 0),
      warnings,
    },
  }
}