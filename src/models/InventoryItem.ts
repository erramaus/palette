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
  workbookSourceId?: string
  subcategory?: string
  description?: string
  packageSize?: string
  supplierName?: string
  unitCost?: number
  desiredStock?: number
  quantityToPurchase?: number
  active: boolean
  countingInstructions?: string
  sourceWorksheet?: string
  sourceRowNumber?: number
  sourceRef?: string
  sourceValues?: Record<string, string>
  sourceFormulas?: Record<string, string>

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
    this.workbookSourceId = init.workbookSourceId
    this.subcategory = init.subcategory
    this.description = init.description
    this.packageSize = init.packageSize
    this.supplierName = init.supplierName
    this.unitCost = init.unitCost
    this.desiredStock = init.desiredStock
    this.quantityToPurchase = init.quantityToPurchase
    this.active = init.active ?? true
    this.countingInstructions = init.countingInstructions
    this.sourceWorksheet = init.sourceWorksheet
    this.sourceRowNumber = init.sourceRowNumber
    this.sourceRef = init.sourceRef
    this.sourceValues = init.sourceValues
    this.sourceFormulas = init.sourceFormulas
  }
}
