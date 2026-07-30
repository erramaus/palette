import { mockEmployees } from '../data/mockEmployees'
import { mockProductionJobs } from '../data/mockProductionJobs'
import type { ProductType, ProductionJob } from '../types/production'
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

  if (productType === 'ORIGINAL') {
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

  for (const employee of mockEmployees) {
    employees.set(employee.id, { id: employee.id, name: employee.name })
  }

  for (const job of mockProductionJobs) {
    const customerId = createId('customer', job.customerName)
    const artworkId = createId('artwork', `${job.customerName}-${job.artworkTitle}`)
    const productId = createId('product', `${job.productType}-${job.artworkTitle}`)

    const departmentName = inferDepartment(job)
    const departmentId = createId('department', departmentName)

    customers.set(customerId, { id: customerId, name: job.customerName })
    artworks.set(artworkId, { id: artworkId, name: job.artworkTitle })
    products.set(productId, {
      id: productId,
      name: `${job.productType.replaceAll('_', ' ')} Product`,
      code: inferProductCode(job.productType),
      type: job.productType,
    })
    departments.set(departmentId, { id: departmentId, name: departmentName })

    const workflowContext = workflowForProductType(job.productType, workflowContexts)

    const created = workItemService.createWorkItem({
      workItemNumber: `WI-${job.orderNumber}`,
      type: job.productType,
      workflowContext,
      customerId,
      orderId: job.orderNumber,
      artworkId,
      productId,
      priority:
        job.priority === 'ORIGINALS'
          ? 100
          : job.priority === 'CUSTOMER_PURCHASED'
            ? 80
            : 60,
      dueDate: job.dueDate,
      assignedDepartmentId: departmentId,
      assignedEmployeeId: job.assignedWorkerId,
      notes: [job.notes],
      tags: [job.productType, normalize(departmentName).replaceAll(' ', '_').toUpperCase()],
      customFields: {
        orderNumber: job.orderNumber,
        frameStyle: job.frameInfo,
        packagingMethod: job.orderNumber.startsWith('GAL-') ? 'GALLERY' : 'STANDARD_BOX',
      },
    })

    if (job.onHold) {
      workItemService.updateWorkItem(created.id, { status: 'BLOCKED' })
    }

    if (job.steps.SHIPPED === 'COMPLETE') {
      workItemService.updateWorkItem(created.id, { status: 'COMPLETE' })
    }
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
  }
}

let workshopListUiEnvironment: WorkshopListUiEnvironment | null = null

export const getWorkshopListUiEnvironment = (): WorkshopListUiEnvironment => {
  if (!workshopListUiEnvironment) {
    workshopListUiEnvironment = createWorkshopListUiEnvironment()
  }

  return workshopListUiEnvironment
}
