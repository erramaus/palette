import type { Order as OrderShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class Order extends BaseEntity implements OrderShape {
  customerId: string
  orderNumber: string
  status: OrderShape['status']
  orderedAt: string
  dueAt?: string
  notes?: string
  workItemIds: string[]
  shipmentIds: string[]

  constructor(init: EntityInit<OrderShape>) {
    super(init)
    this.id = init.id ?? createEntityId('order')
    this.customerId = init.customerId
    this.orderNumber = init.orderNumber
    this.status = init.status
    this.orderedAt = init.orderedAt
    this.dueAt = init.dueAt
    this.notes = init.notes
    this.workItemIds = init.workItemIds ?? []
    this.shipmentIds = init.shipmentIds ?? []
  }
}
