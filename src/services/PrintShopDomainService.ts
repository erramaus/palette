import {
  ActivityLog,
  Artwork,
  Customer,
  Department,
  Employee,
  InventoryItem,
  Order,
  Product,
  ProductionStep,
  Shipment,
  Workflow,
  WorkItem,
} from '../models'
import type {
  ActivityAction,
  ActivityEntityType,
  Address,
  InventoryCategory,
  OrderStatus,
  ShipmentStatus,
  WorkItemStatus,
} from '../types/entities'
import { addUniqueId, removeId } from '../utils/collection'
import { nowIso } from '../utils/time'

interface CreateCustomerInput {
  name: string
  email?: string
  phone?: string
  billingAddress?: Address
  shippingAddress?: Address
  isActive?: boolean
}

interface CreateOrderInput {
  customerId: string
  orderNumber: string
  status?: OrderStatus
  orderedAt?: string
  dueAt?: string
  notes?: string
}

interface CreateProductInput {
  sku: string
  name: string
  category: string
  description?: string
  defaultWidthInches?: number
  defaultHeightInches?: number
  workflowId?: string
  isActive?: boolean
}

interface CreateArtworkInput {
  customerId: string
  title: string
  fileUri: string
  colorProfile?: string
  revision?: number
  approvedAt?: string
}

interface CreateWorkflowInput {
  name: string
  workflowType?: string
  version?: number
  departmentId?: string
  isActive?: boolean
}

interface AddWorkflowStepInput {
  workflowId: string
  name: string
  sequence: number
  estimatedMinutes: number
  departmentId?: string
  dependsOnStepIds?: string[]
}

interface CreateWorkItemInput {
  orderId: string
  productId: string
  workflowId: string
  quantity: number
  priority?: number
  artworkId?: string
  dueAt?: string
  tagLabels?: string[]
}

interface CreateEmployeeInput {
  employeeNumber: string
  fullName: string
  role: Employee['role']
  departmentId?: string
  email?: string
  active?: boolean
  hiredAt?: string
  skillStepNames?: string[]
}

interface CreateDepartmentInput {
  code: string
  name: string
  managerEmployeeId?: string
  description?: string
}

interface CreateShipmentInput {
  orderId: string
  status?: ShipmentStatus
  workItemIds: string[]
  destination: Address
  carrier?: string
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
}

interface CreateInventoryItemInput {
  sku: string
  name: string
  category: InventoryCategory
  unitOfMeasure: string
  onHandQuantity: number
  reservedQuantity?: number
  reorderPoint?: number
  locationCode?: string
  lastCountedAt?: string
}

interface ActivityInput {
  entityType: ActivityEntityType
  entityId: string
  action: ActivityAction
  actorEmployeeId?: string
  metadata?: Record<string, string | number | boolean | null>
}

export class PrintShopDomainService {
  private customers = new Map<string, Customer>()
  private orders = new Map<string, Order>()
  private workItems = new Map<string, WorkItem>()
  private artworks = new Map<string, Artwork>()
  private products = new Map<string, Product>()
  private workflows = new Map<string, Workflow>()
  private productionSteps = new Map<string, ProductionStep>()
  private employees = new Map<string, Employee>()
  private departments = new Map<string, Department>()
  private shipments = new Map<string, Shipment>()
  private inventoryItems = new Map<string, InventoryItem>()
  private activityLogs: ActivityLog[] = []

  createCustomer(input: CreateCustomerInput): Customer {
    const customer = new Customer({
      ...input,
      orderIds: [],
      isActive: input.isActive ?? true,
    })

    this.customers.set(customer.id, customer)
    this.logActivity({ entityType: 'Customer', entityId: customer.id, action: 'CREATED' })

    return customer
  }

  createOrder(input: CreateOrderInput): Order {
    const customer = this.getRequired(this.customers, input.customerId, 'Customer')
    const order = new Order({
      ...input,
      status: input.status ?? 'DRAFT',
      orderedAt: input.orderedAt ?? nowIso(),
      workItemIds: [],
      shipmentIds: [],
    })

    this.orders.set(order.id, order)
    customer.orderIds = addUniqueId(customer.orderIds, order.id)
    customer.touch()

    this.logActivity({ entityType: 'Order', entityId: order.id, action: 'CREATED' })
    return order
  }

  createProduct(input: CreateProductInput): Product {
    if (input.workflowId) {
      this.getRequired(this.workflows, input.workflowId, 'Workflow')
    }

    const product = new Product({
      ...input,
      isActive: input.isActive ?? true,
    })

    this.products.set(product.id, product)
    this.logActivity({ entityType: 'Product', entityId: product.id, action: 'CREATED' })
    return product
  }

  createArtwork(input: CreateArtworkInput): Artwork {
    this.getRequired(this.customers, input.customerId, 'Customer')

    const artwork = new Artwork({
      ...input,
      revision: input.revision ?? 1,
    })

    this.artworks.set(artwork.id, artwork)
    this.logActivity({ entityType: 'Artwork', entityId: artwork.id, action: 'CREATED' })
    return artwork
  }

  createWorkflow(input: CreateWorkflowInput): Workflow {
    if (input.departmentId) {
      this.getRequired(this.departments, input.departmentId, 'Department')
    }

    const workflow = new Workflow({
      ...input,
      workflowType: input.workflowType ?? 'CUSTOM',
      version: input.version ?? 1,
      isActive: input.isActive ?? true,
      stageIds: [],
      transitionIds: [],
      ruleIds: [],
      stepTemplateIds: [],
    })

    this.workflows.set(workflow.id, workflow)
    this.logActivity({ entityType: 'Workflow', entityId: workflow.id, action: 'CREATED' })
    return workflow
  }

  addStepToWorkflow(input: AddWorkflowStepInput): ProductionStep {
    const workflow = this.getRequired(this.workflows, input.workflowId, 'Workflow')

    const step = new ProductionStep({
      workflowId: workflow.id,
      workItemId: '',
      name: input.name,
      sequence: input.sequence,
      estimatedMinutes: input.estimatedMinutes,
      departmentId: input.departmentId,
      status: 'PENDING',
      dependsOnStepIds: input.dependsOnStepIds ?? [],
    })

    this.productionSteps.set(step.id, step)
    workflow.stepTemplateIds = addUniqueId(workflow.stepTemplateIds, step.id)
    workflow.touch()

    this.logActivity({
      entityType: 'ProductionStep',
      entityId: step.id,
      action: 'CREATED',
      metadata: { workflowId: workflow.id },
    })

    return step
  }

  createWorkItem(input: CreateWorkItemInput): WorkItem {
    const order = this.getRequired(this.orders, input.orderId, 'Order')
    const product = this.getRequired(this.products, input.productId, 'Product')
    const workflow = this.getRequired(this.workflows, input.workflowId, 'Workflow')

    if (input.artworkId) {
      this.getRequired(this.artworks, input.artworkId, 'Artwork')
    }

    const workItem = new WorkItem({
      workItemNumber: `WI-${order.orderNumber}-${order.workItemIds.length + 1}`,
      type: product.category,
      customerId: order.customerId,
      orderId: input.orderId,
      productId: input.productId,
      artworkId: input.artworkId,
      workflowId: input.workflowId,
      currentStageId: workflow.initialStageId ?? 'STAGE_UNASSIGNED',
      status: 'QUEUED',
      priority: input.priority ?? 100,
      quantity: input.quantity,
      dueDate: input.dueAt,
      notes: [],
      attachments: [],
      tags: input.tagLabels ?? [],
      customFields: {},
      activityHistory: [],
      productionStepIds: [],
      currentWorkflowStageId: workflow.initialStageId,
      dueAt: input.dueAt,
      tagLabels: input.tagLabels ?? [],
    })

    const templateSteps = workflow.stepTemplateIds
      .map((templateId) => this.getRequired(this.productionSteps, templateId, 'ProductionStep'))
      .sort((a, b) => a.sequence - b.sequence)

    const templateToRuntimeStep = new Map<string, ProductionStep>()

    for (const template of templateSteps) {
      const runtimeStep = new ProductionStep({
        workflowId: workflow.id,
        workItemId: workItem.id,
        name: template.name,
        departmentId: template.departmentId,
        sequence: template.sequence,
        estimatedMinutes: template.estimatedMinutes,
        status: template.sequence === 1 ? 'READY' : 'PENDING',
        dependsOnStepIds: [],
      })

      this.productionSteps.set(runtimeStep.id, runtimeStep)
      templateToRuntimeStep.set(template.id, runtimeStep)
      workItem.productionStepIds.push(runtimeStep.id)
    }

    for (const template of templateSteps) {
      const runtimeStep = templateToRuntimeStep.get(template.id)
      if (!runtimeStep) {
        continue
      }

      runtimeStep.dependsOnStepIds = template.dependsOnStepIds
        .map((templateDependencyId) => templateToRuntimeStep.get(templateDependencyId)?.id)
        .filter((id): id is string => Boolean(id))

      runtimeStep.touch()
    }

    workItem.currentStepId = workItem.productionStepIds[0]
    if (workItem.currentStepId && workItem.currentStageId === 'STAGE_UNASSIGNED') {
      workItem.currentStageId = workItem.currentStepId
      workItem.currentWorkflowStageId = workItem.currentStepId
    }
    workItem.status = workItem.currentStepId ? 'READY' : 'QUEUED'

    this.workItems.set(workItem.id, workItem)
    order.workItemIds = addUniqueId(order.workItemIds, workItem.id)
    order.touch()

    this.logActivity({ entityType: 'WorkItem', entityId: workItem.id, action: 'CREATED' })

    return workItem
  }

  createEmployee(input: CreateEmployeeInput): Employee {
    if (input.departmentId) {
      this.getRequired(this.departments, input.departmentId, 'Department')
    }

    const employee = new Employee({
      ...input,
      active: input.active ?? true,
      skillStepNames: input.skillStepNames ?? [],
    })

    this.employees.set(employee.id, employee)

    if (employee.departmentId) {
      this.assignEmployeeToDepartment(employee.id, employee.departmentId)
    }

    this.logActivity({ entityType: 'Employee', entityId: employee.id, action: 'CREATED' })
    return employee
  }

  createDepartment(input: CreateDepartmentInput): Department {
    if (input.managerEmployeeId) {
      this.getRequired(this.employees, input.managerEmployeeId, 'Employee')
    }

    const department = new Department({
      ...input,
      employeeIds: [],
    })

    this.departments.set(department.id, department)
    this.logActivity({ entityType: 'Department', entityId: department.id, action: 'CREATED' })
    return department
  }

  assignEmployeeToDepartment(employeeId: string, departmentId: string): void {
    const employee = this.getRequired(this.employees, employeeId, 'Employee')
    const department = this.getRequired(this.departments, departmentId, 'Department')

    if (employee.departmentId) {
      const previousDepartment = this.departments.get(employee.departmentId)
      if (previousDepartment) {
        previousDepartment.employeeIds = removeId(previousDepartment.employeeIds, employee.id)
        previousDepartment.touch()
      }
    }

    employee.departmentId = department.id
    employee.touch()

    department.employeeIds = addUniqueId(department.employeeIds, employee.id)
    department.touch()

    this.logActivity({
      entityType: 'Employee',
      entityId: employee.id,
      action: 'ASSIGNED',
      metadata: { departmentId: department.id },
    })
  }

  createShipment(input: CreateShipmentInput): Shipment {
    const order = this.getRequired(this.orders, input.orderId, 'Order')
    const customer = this.getRequired(this.customers, order.customerId, 'Customer')

    for (const workItemId of input.workItemIds) {
      const workItem = this.getRequired(this.workItems, workItemId, 'WorkItem')
      if (workItem.orderId !== order.id) {
        throw new Error(`WorkItem ${workItem.id} does not belong to Order ${order.id}`)
      }
    }

    const shipment = new Shipment({
      ...input,
      customerId: customer.id,
      status: input.status ?? 'PENDING',
    })

    this.shipments.set(shipment.id, shipment)
    order.shipmentIds = addUniqueId(order.shipmentIds, shipment.id)
    order.touch()

    if (shipment.status === 'IN_TRANSIT' || shipment.status === 'DELIVERED') {
      this.logActivity({ entityType: 'Shipment', entityId: shipment.id, action: 'SHIPPED' })
    } else {
      this.logActivity({ entityType: 'Shipment', entityId: shipment.id, action: 'CREATED' })
    }

    return shipment
  }

  createInventoryItem(input: CreateInventoryItemInput): InventoryItem {
    const item = new InventoryItem({
      ...input,
      reservedQuantity: input.reservedQuantity ?? 0,
      reorderPoint: input.reorderPoint ?? 0,
    })

    this.inventoryItems.set(item.id, item)
    this.logActivity({ entityType: 'InventoryItem', entityId: item.id, action: 'CREATED' })

    return item
  }

  reserveInventory(itemId: string, quantity: number, actorEmployeeId?: string): void {
    const item = this.getRequired(this.inventoryItems, itemId, 'InventoryItem')

    if (quantity <= 0) {
      throw new Error('Reserve quantity must be greater than zero')
    }

    if (item.onHandQuantity - item.reservedQuantity < quantity) {
      throw new Error(`Insufficient available inventory for ${item.sku}`)
    }

    item.reservedQuantity += quantity
    item.touch()

    this.logActivity({
      entityType: 'InventoryItem',
      entityId: item.id,
      action: 'INVENTORY_RESERVED',
      actorEmployeeId,
      metadata: { quantity },
    })
  }

  releaseInventory(itemId: string, quantity: number, actorEmployeeId?: string): void {
    const item = this.getRequired(this.inventoryItems, itemId, 'InventoryItem')

    if (quantity <= 0) {
      throw new Error('Release quantity must be greater than zero')
    }

    if (item.reservedQuantity < quantity) {
      throw new Error(`Cannot release more than reserved quantity for ${item.sku}`)
    }

    item.reservedQuantity -= quantity
    item.touch()

    this.logActivity({
      entityType: 'InventoryItem',
      entityId: item.id,
      action: 'INVENTORY_RELEASED',
      actorEmployeeId,
      metadata: { quantity },
    })
  }

  startProductionStep(stepId: string, actorEmployeeId?: string): void {
    const step = this.getRequired(this.productionSteps, stepId, 'ProductionStep')
    const workItem = this.getRequired(this.workItems, step.workItemId, 'WorkItem')

    if (!this.areDependenciesComplete(step.dependsOnStepIds)) {
      throw new Error(`Step ${step.id} has unfinished dependencies`)
    }

    step.status = 'IN_PROGRESS'
    step.startedAt = step.startedAt ?? nowIso()

    if (actorEmployeeId) {
      this.getRequired(this.employees, actorEmployeeId, 'Employee')
      step.assignedEmployeeId = actorEmployeeId
      workItem.assignedEmployeeId = actorEmployeeId
      workItem.touch()
    }

    step.touch()
    workItem.status = 'IN_PROGRESS'
    workItem.currentStepId = step.id
    workItem.touch()

    this.logActivity({
      entityType: 'ProductionStep',
      entityId: step.id,
      action: 'STEP_STARTED',
      actorEmployeeId,
      metadata: { workItemId: workItem.id },
    })
  }

  completeProductionStep(stepId: string, actorEmployeeId?: string): void {
    const step = this.getRequired(this.productionSteps, stepId, 'ProductionStep')
    const workItem = this.getRequired(this.workItems, step.workItemId, 'WorkItem')

    step.status = 'DONE'
    step.completedAt = nowIso()
    step.touch()

    const sortedSteps = workItem.productionStepIds
      .map((id) => this.getRequired(this.productionSteps, id, 'ProductionStep'))
      .sort((a, b) => a.sequence - b.sequence)

    const nextStep = sortedSteps.find(
      (candidate) => candidate.status !== 'DONE' && candidate.status !== 'SKIPPED',
    )

    if (!nextStep) {
      workItem.status = 'COMPLETE'
      workItem.currentStepId = undefined
    } else {
      if (
        nextStep.status === 'PENDING' &&
        this.areDependenciesComplete(nextStep.dependsOnStepIds)
      ) {
        nextStep.status = 'READY'
        nextStep.touch()
      }

      workItem.currentStepId = nextStep.id
      workItem.status = nextStep.status === 'BLOCKED' ? 'BLOCKED' : 'READY'
    }

    workItem.touch()

    this.logActivity({
      entityType: 'ProductionStep',
      entityId: step.id,
      action: 'STEP_COMPLETED',
      actorEmployeeId,
      metadata: { workItemId: workItem.id },
    })

    this.logActivity({
      entityType: 'WorkItem',
      entityId: workItem.id,
      action: 'STATUS_CHANGED',
      actorEmployeeId,
      metadata: { status: workItem.status },
    })
  }

  updateOrderStatus(orderId: string, status: OrderStatus, actorEmployeeId?: string): void {
    const order = this.getRequired(this.orders, orderId, 'Order')
    order.status = status
    order.touch()

    this.logActivity({
      entityType: 'Order',
      entityId: order.id,
      action: 'STATUS_CHANGED',
      actorEmployeeId,
      metadata: { status },
    })
  }

  updateWorkItemStatus(workItemId: string, status: WorkItemStatus, actorEmployeeId?: string): void {
    const workItem = this.getRequired(this.workItems, workItemId, 'WorkItem')
    workItem.status = status
    workItem.touch()

    this.logActivity({
      entityType: 'WorkItem',
      entityId: workItem.id,
      action: 'STATUS_CHANGED',
      actorEmployeeId,
      metadata: { status },
    })
  }

  listCustomers(): Customer[] {
    return [...this.customers.values()]
  }

  listOrders(): Order[] {
    return [...this.orders.values()]
  }

  listWorkItems(): WorkItem[] {
    return [...this.workItems.values()]
  }

  listArtworks(): Artwork[] {
    return [...this.artworks.values()]
  }

  listProducts(): Product[] {
    return [...this.products.values()]
  }

  listWorkflows(): Workflow[] {
    return [...this.workflows.values()]
  }

  listProductionSteps(): ProductionStep[] {
    return [...this.productionSteps.values()]
  }

  listEmployees(): Employee[] {
    return [...this.employees.values()]
  }

  listDepartments(): Department[] {
    return [...this.departments.values()]
  }

  listShipments(): Shipment[] {
    return [...this.shipments.values()]
  }

  listInventoryItems(): InventoryItem[] {
    return [...this.inventoryItems.values()]
  }

  listActivityLogs(): ActivityLog[] {
    return [...this.activityLogs]
  }

  private areDependenciesComplete(stepIds: string[]): boolean {
    return stepIds.every((stepId) => {
      const step = this.productionSteps.get(stepId)
      return step?.status === 'DONE' || step?.status === 'SKIPPED'
    })
  }

  private logActivity(input: ActivityInput): ActivityLog {
    const activity = new ActivityLog({
      ...input,
      occurredAt: nowIso(),
    })

    this.activityLogs.push(activity)
    return activity
  }

  private getRequired<T>(map: Map<string, T>, id: string, entityName: string): T {
    const entity = map.get(id)
    if (!entity) {
      throw new Error(`${entityName} not found for id ${id}`)
    }

    return entity
  }
}
