import { mockEmployees } from '../data/mockEmployees'
import { mockProductionJobs } from '../data/mockProductionJobs'
import type { ProductType, ProductionJob } from '../types/production'
import {
  ProductionPipelineService,
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
  listArtworks: () => NamedEntity[]
  replaceArtworks: (artworks: NamedEntity[]) => void
  replaceWorkflowContexts: (contexts: Record<string, WorkflowContext>) => void
}

const createId = (prefix: string, value: string): string =>
  `${prefix}-${value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`

const normalize = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ')

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
  const workItemIdByPieceKey = new Map<string, string>()

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
    const pieceKey = `${job.orderNumber}:${job.artworkTitle}:${job.productType}:${job.width}x${job.height}`
    const existingWorkItemId = workItemIdByPieceKey.get(pieceKey)
    if (existingWorkItemId) {
      const workItem = workItemService.getWorkItemById(existingWorkItemId)
      if (!workItem) throw new Error(`WorkItem not found for order ${job.orderNumber}`)
      return {
        workItem,
        operations: productionPipelineService.getOperations(workItem),
        tags: productionPipelineService.buildTags(workItem),
        artworkId: workItem.artworkId ?? createId('artwork', `${job.customerName}-${job.artworkTitle}`),
      }
    }
    const artworkId = createId('artwork', `${job.customerName}-${job.artworkTitle}`)
    const departmentName = inferDepartment(job)
    const result = productionPipelineService.importOrder({
      orderNumber: job.orderNumber,
      customerName: job.customerName,
      artworkName: job.artworkTitle,
      productType: job.productType,
      width: job.width,
      height: job.height,
      orientation: job.width === job.height ? 'SQUARE' : job.width > job.height ? 'HORIZ' : 'VERT',
      priority:
        job.priority === 'ORIGINALS'
          ? 100
          : job.priority === 'CUSTOMER_PURCHASED'
            ? 80
            : 60,
      dueDate: job.dueDate,
      assignedEmployeeId: job.assignedWorkerId,
      notes: [job.notes],
      departmentName,
      customFields: {
        frameStyle: job.frameInfo,
        departmentTag: normalize(departmentName).replaceAll(' ', '_').toUpperCase(),
        packagingMethod: job.orderNumber.startsWith('GAL-') ? 'GALLERY' : 'STANDARD_BOX',
      },
    })

    workItemIdByPieceKey.set(pieceKey, result.workItem.id)
    if (!workItemIdByOrderNumber.has(job.orderNumber)) {
      workItemIdByOrderNumber.set(job.orderNumber, result.workItem.id)
    }

    if (job.onHold) {
      workItemService.updateWorkItem(result.workItem.id, { status: 'BLOCKED' })
    }

    if (job.steps.SHIPPED === 'COMPLETE') {
      workItemService.updateWorkItem(result.workItem.id, { status: 'COMPLETE' })
    }

    return {
      ...result,
      artworkId,
    }
  }

  for (const job of mockProductionJobs) {
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
    listArtworks: () => [...artworks.values()].sort((a, b) => a.name.localeCompare(b.name)),
    replaceArtworks: (nextArtworks) => {
      artworks.clear()
      nextArtworks.forEach((artwork) => artworks.set(artwork.id, artwork))
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
