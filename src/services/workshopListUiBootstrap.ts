import { mockEmployees } from '../data/mockEmployees'
import { workshopProductionSheetJobs } from '../data/workshopProductionSheetJobs'
import type { ProductType, ProductionJob } from '../types/production'
import type { CanonicalOrderImport, NormalizationResult } from '../types/orderImport'
import { OrderImportService } from './OrderImportService'
import {
  ProductionPipelineService,
  type ProductionOperation,
  type ProductionOperationName,
  type ProductionPipelineResult,
} from './ProductionPipelineService'
import { WorkItemService, type WorkflowContext } from './WorkItemService'
import { WorkflowService } from './WorkflowService'
import {
  WorkshopListService,
  type WorkshopListLookupProvider,
} from './WorkshopListService'

interface NamedEntity {
  id: string
  name: string
}

export interface WorkshopListUiEnvironment {
  workItemService: WorkItemService
  workflowService: WorkflowService
  workshopListService: WorkshopListService
  workflowContexts: Record<string, WorkflowContext>
  customers: NamedEntity[]
  artworks: NamedEntity[]
  products: Array<NamedEntity & { code: string; type: ProductType }>
  departments: NamedEntity[]
  employees: NamedEntity[]
  productionPipelineService: ProductionPipelineService
  ingestProductionJob: (job: ProductionJob) => ProductionPipelineResult & { artworkId: string }
  getWorkItemIdForOrderNumber: (orderNumber: string) => string | undefined
  listCustomers: () => NamedEntity[]
  replaceCustomers: (customers: NamedEntity[]) => void
  listArtworks: () => NamedEntity[]
  replaceArtworks: (artworks: NamedEntity[]) => void
  listProducts: () => Array<NamedEntity & { code: string; type: ProductType }>
  replaceProducts: (products: Array<NamedEntity & { code: string; type: ProductType }>) => void
  listDepartments: () => NamedEntity[]
  replaceDepartments: (departments: NamedEntity[]) => void
  replaceWorkflowContexts: (contexts: Record<string, WorkflowContext>) => void
}

const createId = (prefix: string, value: string): string =>
  `${prefix}-${value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`

const normalize = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ')

const requireNormalized = <T>(field: string, result: NormalizationResult<unknown, T>): T => {
  if (result.normalized === null || result.normalized === undefined) {
    throw new Error(`Cannot import order: ${field} ${result.reviewReason ?? 'requires review.'}`)
  }
  return result.normalized
}

const pipelineOrientation = (
  orientation: NonNullable<CanonicalOrderImport['orientation']['normalized']>,
): 'HORIZ' | 'VERT' | 'SQUARE' | 'PANORAMA' => {
  if (orientation === 'HORIZONTAL') return 'HORIZ'
  if (orientation === 'VERTICAL') return 'VERT'
  return orientation
}

const inferProductCode = (productType: ProductType): string => {
  if (productType === 'CANVAS') {
    return '3 Canv'
  }

  if (productType === 'ORIGINAL' || productType === 'PAPER') {
    return '4 Paper'
  }

  return '2 3D'
}

const inferDepartment = (job: ProductionJob): string => {
  if (job.steps.PRINTED === 'WAITING') {
    return 'Print Studio'
  }

  if (job.steps.FRAME_MADE === 'WAITING' || job.steps.FRAMED === 'WAITING') {
    return 'Frame Shop'
  }

  if (job.steps.SHIPPED === 'WAITING') {
    return 'Shipping'
  }

  return 'Production'
}

const SOURCE_STEP_BY_OPERATION: Partial<Record<ProductionOperationName, keyof ProductionJob['steps']>> = {
  FILES: 'FILES',
  PRINT: 'PRINTED',
  PRINTED: 'PRINTED',
  DIBOND: 'DIBOND',
  BASE_CUT: 'STRETCHER_BASE',
  BASE_ASSEMBLY: 'STRETCHER_BASE',
  STRETCHER_CUT: 'STRETCHER_BASE',
  STRETCHER_ASSEMBLY: 'STRETCHER_BASE',
  STRETCHER: 'STRETCHER_BASE',
  MOUNT: 'MOUNTED',
  FRAME_CUT: 'FRAME_MADE',
  FRAME_ASSEMBLY: 'FRAME_MADE',
  FRAME: 'FRAMED',
  SHIPPING: 'SHIPPED',
}

const hasPaletteLifecycle = (operation: ProductionOperation): boolean =>
  Boolean(
    operation.startedAt
    || operation.completedAt
    || operation.block
    || operation.blockHistory.length
    || operation.completionHistory.length
    || operation.carryForwardHistory.length
    || operation.history.length,
  )

const applySourceCompletion = (
  job: ProductionJob,
  operations: ProductionOperation[],
): void => {
  for (const operation of operations) {
    const sourceStep = SOURCE_STEP_BY_OPERATION[operation.name]
    if (
      sourceStep
      && job.steps[sourceStep] === 'COMPLETE'
      && !hasPaletteLifecycle(operation)
    ) {
      operation.status = 'COMPLETE'
    }
  }
}

const createWorkflowContexts = (workflowService: WorkflowService): Record<string, WorkflowContext> => {
  const customerPrint = workflowService.createWorkflow({
    name: 'Customer Print Workflow',
    workflowType: 'CUSTOMER_PRINT',
    stages: [
      {
        name: 'Intake',
        sequence: 1,
        estimatedDuration: 30,
      },
      {
        name: 'Print',
        sequence: 2,
        estimatedDuration: 60,
      },
      {
        name: 'Mount',
        sequence: 3,
        estimatedDuration: 75,
      },
      {
        name: 'Frame',
        sequence: 4,
        estimatedDuration: 90,
      },
      {
        name: 'Ship',
        sequence: 5,
        estimatedDuration: 45,
      },
    ],
    transitions: [
      { fromStageSequence: 1, toStageSequence: 2 },
      { fromStageSequence: 2, toStageSequence: 3 },
      { fromStageSequence: 3, toStageSequence: 4 },
      { fromStageSequence: 4, toStageSequence: 5 },
      { fromStageSequence: 2, toStageSequence: 1, allowBackward: true },
      { fromStageSequence: 3, toStageSequence: 2, allowBackward: true },
      { fromStageSequence: 4, toStageSequence: 3, allowBackward: true },
      { fromStageSequence: 5, toStageSequence: 4, allowBackward: true },
    ],
  })

  const original = workflowService.createWorkflow({
    name: 'Original Workflow',
    workflowType: 'ORIGINAL',
    stages: [
      {
        name: 'Intake',
        sequence: 1,
        estimatedDuration: 20,
      },
      {
        name: 'Frame',
        sequence: 2,
        estimatedDuration: 110,
      },
      {
        name: 'Ship',
        sequence: 3,
        estimatedDuration: 45,
      },
    ],
    transitions: [
      { fromStageSequence: 1, toStageSequence: 2 },
      { fromStageSequence: 2, toStageSequence: 3 },
      { fromStageSequence: 2, toStageSequence: 1, allowBackward: true },
      { fromStageSequence: 3, toStageSequence: 2, allowBackward: true },
    ],
  })

  const gallery = workflowService.createWorkflow({
    name: 'Gallery Inventory Workflow',
    workflowType: 'GALLERY_INVENTORY',
    stages: [
      {
        name: 'Prep',
        sequence: 1,
        estimatedDuration: 35,
      },
      {
        name: 'Finish',
        sequence: 2,
        estimatedDuration: 80,
      },
      {
        name: 'Stage',
        sequence: 3,
        estimatedDuration: 35,
      },
    ],
    transitions: [
      { fromStageSequence: 1, toStageSequence: 2 },
      { fromStageSequence: 2, toStageSequence: 3 },
      { fromStageSequence: 2, toStageSequence: 1, allowBackward: true },
      { fromStageSequence: 3, toStageSequence: 2, allowBackward: true },
    ],
  })

  return {
    [customerPrint.workflow.id]: customerPrint,
    [original.workflow.id]: original,
    [gallery.workflow.id]: gallery,
  }
}

const workflowForProductType = (
  productType: ProductType,
  contexts: Record<string, WorkflowContext>,
): WorkflowContext => {
  const contextByType = Object.values(contexts).find((context) => {
    if (productType === 'ORIGINAL') {
      return context.workflow.workflowType === 'ORIGINAL'
    }

    if (productType === 'GALLERY_INVENTORY') {
      return context.workflow.workflowType === 'GALLERY_INVENTORY'
    }

    return context.workflow.workflowType === 'CUSTOMER_PRINT'
  })

  if (!contextByType) {
    throw new Error(`No workflow context available for product type: ${productType}`)
  }

  return contextByType
}

export const createWorkshopListUiEnvironment = (): WorkshopListUiEnvironment => {
  const workflowService = new WorkflowService()
  const workItemService = new WorkItemService(workflowService)
  const workflowContexts = createWorkflowContexts(workflowService)

  const customers = new Map<string, NamedEntity>()
  const artworks = new Map<string, NamedEntity>()
  const products = new Map<string, NamedEntity & { code: string; type: ProductType }>()
  const departments = new Map<string, NamedEntity>()
  const employees = new Map<string, NamedEntity>()
  const workItemIdByOrderNumber = new Map<string, string>()
  const workItemIdBySourceRecordId = new Map<string, string>()
  const workItemIdByPieceKey = new Map<string, string>()
  const orderImportService = new OrderImportService()

  for (const employee of mockEmployees) {
    employees.set(employee.id, { id: employee.id, name: employee.name })
  }

  const productionPipelineService = new ProductionPipelineService({
    createWorkItem: (input) => {
      const customerId = createId('customer', input.customerName)
      const artworkId = createId('artwork', `${input.customerName}-${input.artworkName}`)
      const productId = createId('product', `${input.productType}-${input.artworkName}-${input.width}x${input.height}`)
      const departmentName = input.departmentName ?? 'Production'
      const departmentId = createId('department', departmentName)

      customers.set(customerId, { id: customerId, name: input.customerName })
      artworks.set(artworkId, { id: artworkId, name: input.artworkName })
      products.set(productId, {
        id: productId,
        name: input.productName ?? `${input.productType.replaceAll('_', ' ')} Product`,
        code: inferProductCode(input.productType),
        type: input.productType,
      })
      departments.set(departmentId, { id: departmentId, name: departmentName })

      const workflowContext = workflowForProductType(input.productType, workflowContexts)
      return workItemService.createWorkItem({
        id: input.id,
        workItemNumber: `WI-${input.orderNumber}-${workItemIdByOrderNumber.size + 1}`,
        type: input.productType,
        workflowContext,
        customerId,
        orderId: input.orderNumber,
        artworkId,
        productId,
        priority: input.priority,
        dueDate: input.dueDate,
        assignedDepartmentId: departmentId,
        assignedEmployeeId: input.assignedEmployeeId,
        notes: input.notes,
        tags: input.operationNames,
        customFields: {
          ...input.customFields,
          orientation: input.orientation,
        },
      })
    },
  })

  const ingestProductionJob = (job: ProductionJob): ProductionPipelineResult & { artworkId: string } => {
    const canonicalImport = orderImportService.normalize({
      source: job.orderSource ?? 'UNSPECIFIED',
      orderIdentifier: job.orderNumber,
      customerIdentifier: job.customerName,
      artwork: job.artworkTitle,
      productType: job.productType,
      width: job.width,
      height: job.height,
      frameSelection: job.frameInfo,
      dueDate: job.dueDate,
      redNotes: job.redNotes,
      requestedDeliveryOrPickupDate: job.requestedDeliveryOrPickupDate,
      priority: job.priority,
      shippingOrPickupMethod: job.shippingOrPickupMethod,
      originalImport: job.originalImport ?? {
        orderNumber: job.orderNumber,
        customerName: job.customerName,
        artworkTitle: job.artworkTitle,
        productType: job.productType,
        width: job.width,
        height: job.height,
        frameInfo: job.frameInfo,
        dueDate: job.dueDate,
        priority: job.priority,
        notes: job.notes,
      },
    })
    const productionPiece = requireNormalized('production piece', canonicalImport.productionPiece)
    const orderNumber = requireNormalized('order identifier', canonicalImport.orderIdentifier)
    const customerName = requireNormalized('customer identifier', canonicalImport.customerIdentifier)
    const artworkTitle = requireNormalized('artwork', canonicalImport.artwork)
    const productType = requireNormalized('product type', canonicalImport.productType)
    const size = requireNormalized('size', canonicalImport.size)
    const orientation = requireNormalized('orientation', canonicalImport.orientation)
    const frameSelection = requireNormalized('frame selection', canonicalImport.frameSelection)
    const dueDate = requireNormalized('due date', canonicalImport.dueDate)
    const priority = requireNormalized('priority', canonicalImport.priority)
    const departmentName = inferDepartment(job)
    const packagingMethod = canonicalImport.shippingOrPickupMethod.normalized
    const pieceKey = productionPiece.key
    const sourceRecordId = typeof job.originalImport?.sourceRecordId === 'string' ? job.originalImport.sourceRecordId : job.id
    const existingSourceRecordWorkItemId = workItemIdBySourceRecordId.get(sourceRecordId)
    if (existingSourceRecordWorkItemId) {
      const workItem = workItemService.getWorkItemById(existingSourceRecordWorkItemId)
      if (!workItem) throw new Error(`WorkItem not found for source record ${sourceRecordId}`)

      const rebuilt = productionPipelineService.rebuildOrder(workItem, {
        workItemId: sourceRecordId,
        orderNumber,
        customerName,
        artworkName: artworkTitle,
        productType,
        width: size.width,
        height: size.height,
        orientation: pipelineOrientation(orientation),
        priority:
          priority === 'ORIGINALS'
            ? 100
            : priority === 'CUSTOMER_PURCHASED'
              ? 80
              : 60,
        dueDate,
        assignedEmployeeId: job.assignedWorkerId,
        notes: [job.notes, canonicalImport.redNotes.normalized].filter((note): note is string => Boolean(note)),
        departmentName,
        customFields: {
          canonicalOrderImport: canonicalImport,
          frameStyle: frameSelection,
          departmentTag: normalize(departmentName).replaceAll(' ', '_').toUpperCase(),
          ...(packagingMethod ? { packagingMethod } : {}),
        },
      })

      workItemIdByPieceKey.set(pieceKey, rebuilt.workItem.id)
      workItemIdByOrderNumber.set(orderNumber, rebuilt.workItem.id)
      applySourceCompletion(job, rebuilt.operations)
      return {
        workItem: rebuilt.workItem,
        operations: rebuilt.operations,
        tags: rebuilt.tags,
        cutCalculations: rebuilt.cutCalculations,
        artworkId: workItem.artworkId ?? createId('artwork', `${customerName}-${artworkTitle}`),
      }
    }
    const existingWorkItemId = workItemIdByPieceKey.get(pieceKey)
    if (existingWorkItemId) {
      const workItem = workItemService.getWorkItemById(existingWorkItemId)
      if (!workItem) throw new Error(`WorkItem not found for order ${orderNumber}`)
      return {
        workItem,
        operations: productionPipelineService.getOperations(workItem),
        tags: productionPipelineService.buildTags(workItem),
        cutCalculations: productionPipelineService.getCutCalculations(workItem),
        artworkId: workItem.artworkId ?? createId('artwork', `${customerName}-${artworkTitle}`),
      }
    }
    const artworkId = createId('artwork', `${customerName}-${artworkTitle}`)
    const result = productionPipelineService.importOrder({
      orderNumber,
      customerName,
      artworkName: artworkTitle,
      productType,
      width: size.width,
      height: size.height,
      orientation: pipelineOrientation(orientation),
      priority:
        priority === 'ORIGINALS'
          ? 100
          : priority === 'CUSTOMER_PURCHASED'
            ? 80
            : 60,
      dueDate,
      assignedEmployeeId: job.assignedWorkerId,
      notes: [job.notes, canonicalImport.redNotes.normalized].filter((note): note is string => Boolean(note)),
      departmentName,
      customFields: {
        canonicalOrderImport: canonicalImport,
        frameStyle: frameSelection,
        departmentTag: normalize(departmentName).replaceAll(' ', '_').toUpperCase(),
        ...(packagingMethod ? { packagingMethod } : {}),
      },
    })

    workItemIdByPieceKey.set(pieceKey, result.workItem.id)
    workItemIdBySourceRecordId.set(sourceRecordId, result.workItem.id)
    if (!workItemIdByOrderNumber.has(orderNumber)) {
      workItemIdByOrderNumber.set(orderNumber, result.workItem.id)
    }

    if (job.onHold) {
      workItemService.updateWorkItem(result.workItem.id, { status: 'BLOCKED' })
    }

    applySourceCompletion(job, result.operations)

    if (job.steps.SHIPPED === 'COMPLETE') {
      workItemService.updateWorkItem(result.workItem.id, { status: 'COMPLETE' })
    }

    return {
      ...result,
      artworkId,
    }
  }

  for (const job of workshopProductionSheetJobs) {
    ingestProductionJob(job)
  }

  const workflowContextById = new Map(Object.values(workflowContexts).map((context) => [context.workflow.id, context]))

  const lookupProvider: WorkshopListLookupProvider = {
    getWorkflowContext: (workflowId) => workflowContextById.get(workflowId),
    getCustomerName: (customerId) => customers.get(customerId)?.name,
    getArtworkName: (artworkId) => artworks.get(artworkId)?.name,
    getProductName: (productId) => products.get(productId)?.name,
    getDepartmentName: (departmentId) => departments.get(departmentId)?.name,
    getEmployeeName: (employeeId) => employees.get(employeeId)?.name,
  }

  const workshopListService = new WorkshopListService(
    workItemService,
    workflowService,
    lookupProvider,
    {
      priorityDirection: 'desc',
    },
  )

  return {
    workItemService,
    workflowService,
    workshopListService,
    workflowContexts,
    customers: [...customers.values()].sort((a, b) => a.name.localeCompare(b.name)),
    artworks: [...artworks.values()].sort((a, b) => a.name.localeCompare(b.name)),
    products: [...products.values()].sort((a, b) => a.name.localeCompare(b.name)),
    departments: [...departments.values()].sort((a, b) => a.name.localeCompare(b.name)),
    employees: [...employees.values()].sort((a, b) => a.name.localeCompare(b.name)),
    productionPipelineService,
    ingestProductionJob,
    getWorkItemIdForOrderNumber: (orderNumber: string) => workItemIdByOrderNumber.get(orderNumber),
    listCustomers: () => [...customers.values()].sort((a, b) => a.name.localeCompare(b.name)),
    replaceCustomers: (nextCustomers) => {
      customers.clear()
      nextCustomers.forEach((customer) => customers.set(customer.id, customer))
    },
    listArtworks: () => [...artworks.values()].sort((a, b) => a.name.localeCompare(b.name)),
    replaceArtworks: (nextArtworks) => {
      artworks.clear()
      nextArtworks.forEach((artwork) => artworks.set(artwork.id, artwork))
    },
    listProducts: () => [...products.values()].sort((a, b) => a.name.localeCompare(b.name)),
    replaceProducts: (nextProducts) => {
      products.clear()
      nextProducts.forEach((product) => products.set(product.id, product))
    },
    listDepartments: () => [...departments.values()].sort((a, b) => a.name.localeCompare(b.name)),
    replaceDepartments: (nextDepartments) => {
      departments.clear()
      nextDepartments.forEach((department) => departments.set(department.id, department))
    },
    replaceWorkflowContexts: (nextContexts) => {
      Object.keys(workflowContexts).forEach((id) => delete workflowContexts[id])
      workflowContextById.clear()
      Object.entries(nextContexts).forEach(([id, context]) => {
        workflowContexts[id] = context
        workflowContextById.set(id, context)
      })
    },
  }
}

let workshopListUiEnvironment: WorkshopListUiEnvironment | null = null

export const getWorkshopListUiEnvironment = (): WorkshopListUiEnvironment => {
  if (!workshopListUiEnvironment) {
    workshopListUiEnvironment = createWorkshopListUiEnvironment()
  }

  return workshopListUiEnvironment
}
