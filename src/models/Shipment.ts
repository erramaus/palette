import type { Shipment as ShipmentShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class Shipment extends BaseEntity implements ShipmentShape {
  orderId: string
  customerId: string
  status: ShipmentShape['status']
  workItemIds: string[]
  carrier?: string
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
  destination: ShipmentShape['destination']

  constructor(init: EntityInit<ShipmentShape>) {
    super(init)
    this.id = init.id ?? createEntityId('shipment')
    this.orderId = init.orderId
    this.customerId = init.customerId
    this.status = init.status
    this.workItemIds = init.workItemIds ?? []
    this.carrier = init.carrier
    this.trackingNumber = init.trackingNumber
    this.shippedAt = init.shippedAt
    this.deliveredAt = init.deliveredAt
    this.destination = init.destination
  }
}
