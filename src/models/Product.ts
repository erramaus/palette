import type { Product as ProductShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class Product extends BaseEntity implements ProductShape {
  sku: string
  name: string
  category: string
  description?: string
  defaultWidthInches?: number
  defaultHeightInches?: number
  workflowId?: string
  isActive: boolean

  constructor(init: EntityInit<ProductShape>) {
    super(init)
    this.id = init.id ?? createEntityId('product')
    this.sku = init.sku
    this.name = init.name
    this.category = init.category
    this.description = init.description
    this.defaultWidthInches = init.defaultWidthInches
    this.defaultHeightInches = init.defaultHeightInches
    this.workflowId = init.workflowId
    this.isActive = init.isActive
  }
}
