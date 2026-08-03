import type { WorkItem } from '../models'
import type { BattlePlan, BattlePlanTask } from '../types/battlePlans'
import type { Employee } from '../types/employees'
import type { ProductionStepName, ProductType } from '../types/production'
import type { GenerationResult } from './battlePlanGenerator'
import type { ScheduleEntry } from './scheduling'

export type ProductionOperationName =
  | 'FILES'
  | 'PRINTED'
  | 'STRETCHER'
  | 'STRETCH'
  | 'TRIM'
  | 'SLICE'
  | 'RESIZE'
  | 'DIBOND'
  | 'MOUNT'
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
}

interface ProductionPipelineDependencies {
  createWorkItem: (input: PipelineWorkItemInput) => WorkItem
  nowProvider?: () => Date
}

const OPERATION_MINUTES: Record<ProductionOperationName, number> = {
  FILES: 30,
  PRINTED: 55,
  STRETCHER: 45,
  STRETCH: 40,
  TRIM: 25,
  SLICE: 60,
  RESIZE: 30,
  DIBOND: 75,
  MOUNT: 60,
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

  constructor(dependencies: ProductionPipelineDependencies) {
    this.createWorkItem = dependencies.createWorkItem
  }

  importOrder(input: PipelineOrderInput): ProductionPipelineResult {
    const operationNames = this.getRequiredOperationNames(input.productType)
    const workItem = this.createWorkItem({ ...input, operationNames })
    const operations = this.createOperations(workItem, operationNames)

    workItem.customFields = {
      ...workItem.customFields,
      pipeline: {
        orderNumber: input.orderNumber,
        customerName: input.customerName,
        artworkName: input.artworkName,
        width: input.width,
        height: input.height,
        orientation: input.orientation,
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

  private createOperations(workItem: WorkItem, names: ProductionOperationName[]): ProductionOperation[] {
    return names.map((name, index) => ({
      id: `${workItem.id}:operation:${index + 1}`,
      workItemId: workItem.id,
      name,
      sequence: index + 1,
      status: index === 0 ? 'READY' : 'PENDING',
      estimatedMinutes: OPERATION_MINUTES[name],
      dependsOnOperationIds: index === 0 ? [] : [`${workItem.id}:operation:${index}`],
      assignedEmployeeId: workItem.assignedEmployeeId,
      dueDate: workItem.dueDate,
      priority: workItem.priority,
      notes: [],
      blockHistory: [],
      completionHistory: [],
      carryForwardHistory: [],
      history: [],
    }))
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
  PRINTED: 'PRINTED',
  STRETCHER: 'STRETCHER_BASE',
  STRETCH: 'STRETCHER_BASE',
  TRIM: 'PRINTED',
  SLICE: 'FILES',
  RESIZE: 'FILES',
  DIBOND: 'DIBOND',
  MOUNT: 'MOUNTED',
  FRAME: 'FRAMED',
  QC: 'SHIPPED',
  SHIPPING: 'SHIPPED',
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
  const unassigned = dailyOperations.filter((operation) => !selectedWorkerIds.has(operation.assignedEmployee))

  for (const operation of dailyOperations.filter((item) => selectedWorkerIds.has(item.assignedEmployee))) {
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
  const workersOverCapacity = selectedConfigs.filter(
    (config) => (tasksByWorker.get(config.workerId) ?? []).reduce((sum, task) => sum + task.estimatedMinutes, 0) > config.availableMinutes,
  ).length

  return {
    workerPlans,
    directorPlan: createPlan(input.directorId, []),
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