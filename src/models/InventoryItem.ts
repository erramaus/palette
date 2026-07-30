import type { InventoryItem as InventoryItemShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class InventoryItem extends BaseEntity implements InventoryItemShape {
  sku: string
  name: string
  category: InventoryItemShape['category']
  unitOfMeasure: string
  onHandQuantity: number
  reservedQuantity: number
  reorderPoint: number
  locationCode?: string
  lastCountedAt?: string

  constructor(init: EntityInit<InventoryItemShape>) {
    super(init)
    this.id = init.id ?? createEntityId('inventory')
    this.sku = init.sku
    this.name = init.name
    this.category = init.category
    this.unitOfMeasure = init.unitOfMeasure
    this.onHandQuantity = init.onHandQuantity
    this.reservedQuantity = init.reservedQuantity
    this.reorderPoint = init.reorderPoint
    this.locationCode = init.locationCode
    this.lastCountedAt = init.lastCountedAt
  }
}
