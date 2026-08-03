import type { ProductionTag as ProductionTagShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { nowIso } from '../utils/time'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class ProductionTag extends BaseEntity implements ProductionTagShape {
  workItemId: string
  workItemNumber: string
  tagType: ProductionTagShape['tagType']
  status: ProductionTagShape['status']
  customerDisplayName: string
  artworkName: string
  productName: string
  productType?: string
  finishedDimensions?: ProductionTagShape['finishedDimensions']
  orientation?: string
  originalImportedFrameName?: string
  normalizedFrameName?: string
  dueDate?: string
  priority?: number
  assignedWorkstation?: string
  runOrEditionLabel?: 'Run' | 'Edition'
  runOrEditionValue?: string
  frameStyleName?: string
  baseStyleName?: string
  packagingMethod: ProductionTagShape['packagingMethod']
  shippingBoxCode?: string
  frameDimensions?: ProductionTagShape['frameDimensions']
  baseDimensions?: ProductionTagShape['baseDimensions']
  stretcherDimensions?: ProductionTagShape['stretcherDimensions']
  cutCalculation?: ProductionTagShape['cutCalculation']
  packageDimensionsDisplay?: string
  checkpoints: ProductionTagShape['checkpoints']
  notes: string[]
  pairKey?: string
  generatedAt: string
  generatedByEmployeeId?: string
  printedAt?: string
  printedByEmployeeId?: string
  previousTagId?: string

  constructor(init: EntityInit<ProductionTagShape>) {
    super(init)
    this.id = init.id ?? createEntityId('production_tag')
    this.workItemId = init.workItemId
    this.workItemNumber = init.workItemNumber
    this.tagType = init.tagType
    this.status = init.status ?? 'DRAFT'
    this.customerDisplayName = init.customerDisplayName
    this.artworkName = init.artworkName
    this.productName = init.productName
    this.productType = init.productType
    this.finishedDimensions = init.finishedDimensions
    this.orientation = init.orientation
    this.originalImportedFrameName = init.originalImportedFrameName
    this.normalizedFrameName = init.normalizedFrameName
    this.dueDate = init.dueDate
    this.priority = init.priority
    this.assignedWorkstation = init.assignedWorkstation
    this.runOrEditionLabel = init.runOrEditionLabel
    this.runOrEditionValue = init.runOrEditionValue
    this.frameStyleName = init.frameStyleName
    this.baseStyleName = init.baseStyleName
    this.packagingMethod = init.packagingMethod
    this.shippingBoxCode = init.shippingBoxCode
    this.frameDimensions = init.frameDimensions
    this.baseDimensions = init.baseDimensions
    this.stretcherDimensions = init.stretcherDimensions
    this.cutCalculation = init.cutCalculation
    this.packageDimensionsDisplay = init.packageDimensionsDisplay
    this.checkpoints = init.checkpoints ?? []
    this.notes = init.notes ?? []
    this.pairKey = init.pairKey
    this.generatedAt = init.generatedAt ?? nowIso()
    this.generatedByEmployeeId = init.generatedByEmployeeId
    this.printedAt = init.printedAt
    this.printedByEmployeeId = init.printedByEmployeeId
    this.previousTagId = init.previousTagId
  }
}
