import type { ProductionStep } from '../models'
import type { WorkItemStatus } from '../types/entities'
import { PrintShopDomainService } from './PrintShopDomainService'

export interface WorkshopListRow {
  workItemId: string
  orderNumber: string
  customerName: string
  productName: string
  nextStep: string
  dueAt?: string
  status: WorkItemStatus
  priority: number
}

export interface RoutingForm {
  workItemId: string
  orderNumber: string
  steps: Array<{
    stepId: string
    name: string
    sequence: number
    status: ProductionStep['status']
    estimatedMinutes: number
  }>
}

export interface TagRecord {
  workItemId: string
  orderNumber: string
  tags: string[]
  status: WorkItemStatus
}

export interface DashboardSnapshot {
  totalWorkItems: number
  queued: number
  inProgress: number
  blocked: number
  complete: number
  readyToShipOrders: number
  lowStockItems: number
}

export interface ReportSnapshot {
  orderStatusCounts: Record<string, number>
  shipmentStatusCounts: Record<string, number>
  workflowLoadByDepartment: Record<string, number>
}

export class WorkItemProjectionService {
  private readonly domain: PrintShopDomainService

  constructor(domain: PrintShopDomainService) {
    this.domain = domain
  }

  // All operations intentionally project from WorkItems so future modules share one source of truth.
  buildWorkshopList(): WorkshopListRow[] {
    const orders = new Map(this.domain.listOrders().map((order) => [order.id, order]))
    const customers = new Map(this.domain.listCustomers().map((customer) => [customer.id, customer]))
    const products = new Map(this.domain.listProducts().map((product) => [product.id, product]))
    const steps = new Map(this.domain.listProductionSteps().map((step) => [step.id, step]))

    return this.domain.listWorkItems().map((workItem) => {
      const order = orders.get(workItem.orderId)
      const customer = order ? customers.get(order.customerId) : undefined
      const product = products.get(workItem.productId)
      const nextStep = workItem.currentStepId ? steps.get(workItem.currentStepId) : undefined

      return {
        workItemId: workItem.id,
        orderNumber: order?.orderNumber ?? 'UNKNOWN',
        customerName: customer?.name ?? 'UNKNOWN',
        productName: product?.name ?? 'UNKNOWN',
        nextStep: nextStep?.name ?? 'N/A',
        dueAt: workItem.dueDate ?? workItem.dueAt,
        status: workItem.status,
        priority: workItem.priority,
      }
    })
  }

  buildRoutingForms(): RoutingForm[] {
    const orders = new Map(this.domain.listOrders().map((order) => [order.id, order]))
    const steps = new Map(this.domain.listProductionSteps().map((step) => [step.id, step]))

    return this.domain.listWorkItems().map((workItem) => {
      const order = orders.get(workItem.orderId)
      const orderedSteps = workItem.productionStepIds
        .map((stepId) => steps.get(stepId))
        .filter((step): step is ProductionStep => step !== undefined)
        .sort((a, b) => a.sequence - b.sequence)

      return {
        workItemId: workItem.id,
        orderNumber: order?.orderNumber ?? 'UNKNOWN',
        steps: orderedSteps.map((step) => ({
          stepId: step.id,
          name: step.name,
          sequence: step.sequence,
          status: step.status,
          estimatedMinutes: step.estimatedMinutes,
        })),
      }
    })
  }

  buildTagDataset(): TagRecord[] {
    const orders = new Map(this.domain.listOrders().map((order) => [order.id, order]))

    return this.domain.listWorkItems().map((workItem) => ({
      workItemId: workItem.id,
      orderNumber: orders.get(workItem.orderId)?.orderNumber ?? 'UNKNOWN',
      tags: workItem.tags.length > 0 ? workItem.tags : workItem.tagLabels,
      status: workItem.status,
    }))
  }

  buildDashboardSnapshot(): DashboardSnapshot {
    const workItems = this.domain.listWorkItems()
    const orders = this.domain.listOrders()
    const inventoryItems = this.domain.listInventoryItems()

    return {
      totalWorkItems: workItems.length,
      queued: workItems.filter((workItem) => workItem.status === 'QUEUED').length,
      inProgress: workItems.filter((workItem) => workItem.status === 'IN_PROGRESS').length,
      blocked: workItems.filter((workItem) => workItem.status === 'BLOCKED').length,
      complete: workItems.filter((workItem) => workItem.status === 'COMPLETE').length,
      readyToShipOrders: orders.filter((order) => order.status === 'READY_TO_SHIP').length,
      lowStockItems: inventoryItems.filter(
        (item) => item.onHandQuantity - item.reservedQuantity <= item.reorderPoint,
      ).length,
    }
  }

  buildReportSnapshot(): ReportSnapshot {
    const orderStatusCounts: Record<string, number> = {}
    const shipmentStatusCounts: Record<string, number> = {}
    const workflowLoadByDepartment: Record<string, number> = {}
    const steps = new Map(this.domain.listProductionSteps().map((step) => [step.id, step]))

    for (const order of this.domain.listOrders()) {
      orderStatusCounts[order.status] = (orderStatusCounts[order.status] ?? 0) + 1
    }

    for (const shipment of this.domain.listShipments()) {
      shipmentStatusCounts[shipment.status] = (shipmentStatusCounts[shipment.status] ?? 0) + 1
    }

    for (const workItem of this.domain.listWorkItems()) {
      const currentStep = workItem.currentStepId ? steps.get(workItem.currentStepId) : undefined
      const bucket = currentStep?.departmentId ?? 'UNASSIGNED'
      workflowLoadByDepartment[bucket] = (workflowLoadByDepartment[bucket] ?? 0) + 1
    }

    return {
      orderStatusCounts,
      shipmentStatusCounts,
      workflowLoadByDepartment,
    }
  }

}
