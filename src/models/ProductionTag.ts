import type { ProductionTag as ProductionTagShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { nowIso } from '../utils/time'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class ProductionTag extends BaseEntity implements ProductionTagShape {
  workItemId: string
  workItemNumber: string
  tagType: ProductionTagShape['tagType']
  customerDisplayName: string
  artworkName: string
  productName: string
  runOrEditionLabel?: 'Run' | 'Edition'
  runOrEditionValue?: string
  frameStyleName?: string
  baseStyleName?: string
  packagingMethod: ProductionTagShape['packagingMethod']
  shippingBoxCode?: string
  frameDimensions?: ProductionTagShape['frameDimensions']
  baseDimensions?: ProductionTagShape['baseDimensions']
  stretcherDimensions?: ProductionTagShape['stretcherDimensions']
  packageDimensionsDisplay?: string
  checkpoints: ProductionTagShape['checkpoints']
  notes: string[]
  pairKey?: string
  generatedAt: string
  generatedByEmployeeId?: string

  constructor(init: EntityInit<ProductionTagShape>) {
    super(init)
    this.id = init.id ?? createEntityId('production_tag')
    this.workItemId = init.workItemId
    this.workItemNumber = init.workItemNumber
    this.tagType = init.tagType
    this.customerDisplayName = init.customerDisplayName
    this.artworkName = init.artworkName
    this.productName = init.productName
    this.runOrEditionLabel = init.runOrEditionLabel
    this.runOrEditionValue = init.runOrEditionValue
    this.frameStyleName = init.frameStyleName
    this.baseStyleName = init.baseStyleName
    this.packagingMethod = init.packagingMethod
    this.shippingBoxCode = init.shippingBoxCode
    this.frameDimensions = init.frameDimensions
    this.baseDimensions = init.baseDimensions
    this.stretcherDimensions = init.stretcherDimensions
    this.packageDimensionsDisplay = init.packageDimensionsDisplay
    this.checkpoints = init.checkpoints ?? []
    this.notes = init.notes ?? []
    this.pairKey = init.pairKey
    this.generatedAt = init.generatedAt ?? nowIso()
    this.generatedByEmployeeId = init.generatedByEmployeeId
  }
}
