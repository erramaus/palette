import type { ShippingBox as ShippingBoxShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class ShippingBox extends BaseEntity implements ShippingBoxShape {
  code: string
  description: string
  dimensionsDisplay: string
  faceCutDisplay?: string
  variableLengthRange?: string

  constructor(init: EntityInit<ShippingBoxShape>) {
    super(init)
    this.id = init.id ?? createEntityId('shipping_box')
    this.code = init.code
    this.description = init.description
    this.dimensionsDisplay = init.dimensionsDisplay
    this.faceCutDisplay = init.faceCutDisplay
    this.variableLengthRange = init.variableLengthRange
  }
}
