import type { PackagingMethod as PackagingMethodShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class PackagingMethod extends BaseEntity implements PackagingMethodShape {
  code: PackagingMethodShape['code']
  label: string
  requiresShippingBoxLookup: boolean
  usesCalculatedDimensions: boolean

  constructor(init: EntityInit<PackagingMethodShape>) {
    super(init)
    this.id = init.id ?? createEntityId('packaging_method')
    this.code = init.code
    this.label = init.label
    this.requiresShippingBoxLookup = init.requiresShippingBoxLookup
    this.usesCalculatedDimensions = init.usesCalculatedDimensions
  }
}
