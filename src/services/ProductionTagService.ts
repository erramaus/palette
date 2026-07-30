import { ProductionTag, TagCheckpoint } from '../models'
import {
  productionMeasurementRules,
  productionTagBaseStyles,
  productionTagFrameStyles,
  productionTagPackagingMethods,
  productionTagShippingBoxes,
} from '../data/productionTagSeeds'
import type {
  BaseStyle,
  DecimalDimensions,
  FrameStyle,
  PackagingMethod,
  PackagingMethodCode,
  ProductionMeasurementRule,
  ProductionTag as ProductionTagShape,
  ProductionTagType,
  ShippingBox,
  WorkItem,
} from '../types/entities'
import { nowIso } from '../utils/time'
import { type RecordWorkItemActivityInput, WorkItemService } from './WorkItemService'

export interface ArtworkTagData {
  name: string
  width: number
  height: number
  scanState?: 'New' | 'Old'
  ia?: boolean
  printed?: boolean
  resliced?: boolean
}

export interface ProductTagData {
  name: string
  code: string
  classification?: string
  runOrEditionValue?: string
}

export interface WorkItemPackagingData {
  methodCode?: PackagingMethodCode
  shippingBoxCode?: string
  finishedWidth?: number
  finishedHeight?: number
}

export interface ProductionTagLookupProvider {
  getCustomerName: (customerId: string) => string | undefined
  getArtworkData: (workItem: WorkItem) => ArtworkTagData | undefined
  getProductData: (workItem: WorkItem) => ProductTagData | undefined
  getFrameStyleName: (workItem: WorkItem) => string | undefined
  getBaseStyleName: (workItem: WorkItem) => string | undefined
  getPackagingData: (workItem: WorkItem) => WorkItemPackagingData | undefined
}

export interface GenerateProductionTagsInput {
  workItemIds?: string[]
  batchId?: string
  generatedByEmployeeId?: string
  preserveSnapshotAtPrint?: boolean
}

export interface ProductionTagPair {
  pairKey: string
  tags: ProductionTag[]
}

export interface ProductionTagServiceConfig {
  frameStyles?: FrameStyle[]
  baseStyles?: BaseStyle[]
  packagingMethods?: PackagingMethod[]
  shippingBoxes?: ShippingBox[]
  measurementRules?: ProductionMeasurementRule[]
  nowProvider?: () => string
}

export class ProductionTagService {
  private readonly workItemService: WorkItemService
  private readonly lookups: ProductionTagLookupProvider
  private readonly frameStyles: FrameStyle[]
  private readonly baseStyles: BaseStyle[]
  private readonly packagingMethods: PackagingMethod[]
  private readonly shippingBoxes: ShippingBox[]
  private readonly measurementRules: ProductionMeasurementRule[]
  private readonly nowProvider: () => string

  constructor(
    workItemService: WorkItemService,
    lookups: ProductionTagLookupProvider,
    config?: ProductionTagServiceConfig,
  ) {
    this.workItemService = workItemService
    this.lookups = lookups
    this.frameStyles = config?.frameStyles ?? productionTagFrameStyles
    this.baseStyles = config?.baseStyles ?? productionTagBaseStyles
    this.packagingMethods = config?.packagingMethods ?? productionTagPackagingMethods
    this.shippingBoxes = config?.shippingBoxes ?? productionTagShippingBoxes
    this.measurementRules = config?.measurementRules ?? productionMeasurementRules
    this.nowProvider = config?.nowProvider ?? nowIso
  }

  generateProductionTags(input: GenerateProductionTagsInput): ProductionTag[] {
    const workItems = this.getWorkItemsForBatch(input.workItemIds)
    const batchId = input.batchId ?? `TAG-BATCH-${this.nowProvider()}`
    const multiCustomerIds = this.detectMultipleCustomerItems(workItems)

    const tags: ProductionTag[] = []

    for (const workItem of workItems) {
      const primaryTag = this.generatePrimaryTag(workItem, multiCustomerIds, batchId, input.generatedByEmployeeId)
      tags.push(primaryTag)

      const frameTag = this.generateFrameTag(workItem, multiCustomerIds, batchId, input.generatedByEmployeeId)
      if (frameTag) {
        tags.push(frameTag)
      }

      const baseOrStretcherTag = this.generateBaseOrStretcherTag(
        workItem,
        multiCustomerIds,
        batchId,
        input.generatedByEmployeeId,
      )

      if (baseOrStretcherTag) {
        tags.push(baseOrStretcherTag)
      }

      this.recordTagGenerationActivity(workItem.id, tags.filter((tag) => tag.workItemId === workItem.id), input.generatedByEmployeeId)
    }

    if (input.preserveSnapshotAtPrint) {
      this.captureTagSnapshot(tags, batchId, input.generatedByEmployeeId)
    }

    return tags
  }

  generatePrimaryTag(
    workItem: WorkItem,
    multiCustomerIds: Set<string>,
    batchId: string,
    generatedByEmployeeId?: string,
  ): ProductionTag {
    const productData = this.requireProductData(workItem)
    const artworkData = this.requireArtworkData(workItem)
    const packagingData = this.lookups.getPackagingData(workItem)

    const primaryTagType = this.determinePrimaryTagType(productData.code)
    const frameStyleName = this.lookups.getFrameStyleName(workItem)
    const baseStyleName = this.lookups.getBaseStyleName(workItem)

    const runOrEditionLabel = this.determineRunOrEditionLabel(productData.classification)
    const packagingMethod = this.determinePackagingMethod(workItem, packagingData)

    return new ProductionTag({
      workItemId: workItem.id,
      workItemNumber: workItem.workItemNumber,
      tagType: primaryTagType,
      customerDisplayName: this.getDisplayedCustomerName(workItem, multiCustomerIds),
      artworkName: artworkData.name,
      productName: productData.name,
      runOrEditionLabel,
      runOrEditionValue: productData.runOrEditionValue,
      frameStyleName,
      baseStyleName,
      packagingMethod,
      shippingBoxCode: packagingData?.shippingBoxCode,
      frameDimensions:
        frameStyleName !== undefined
          ? this.calculateFrameDimensions(primaryTagType, frameStyleName, artworkData.width, artworkData.height)
          : undefined,
      packageDimensionsDisplay: this.calculatePackageDimensions({
        packagingMethod,
        shippingBoxCode: packagingData?.shippingBoxCode,
        tagType: primaryTagType,
        finishedWidth: packagingData?.finishedWidth ?? artworkData.width,
        finishedHeight: packagingData?.finishedHeight ?? artworkData.height,
      }),
      checkpoints: this.getRequiredCheckpoints(primaryTagType, artworkData),
      notes: [...workItem.notes],
      pairKey: `${batchId}:${workItem.id}:P1`,
      generatedAt: this.nowProvider(),
      generatedByEmployeeId,
    })
  }

  generateFrameTag(
    workItem: WorkItem,
    multiCustomerIds: Set<string>,
    batchId: string,
    generatedByEmployeeId?: string,
  ): ProductionTag | null {
    const productData = this.requireProductData(workItem)
    const artworkData = this.requireArtworkData(workItem)
    const frameStyleName = this.lookups.getFrameStyleName(workItem)

    if (!frameStyleName) {
      return null
    }

    const normalizedFrame = this.normalize(frameStyleName)
    if (normalizedFrame === 'none' || normalizedFrame === 'rolled' || normalizedFrame === 'stretched') {
      return null
    }

    const tagType = this.determinePrimaryTagType(productData.code)

    return new ProductionTag({
      workItemId: workItem.id,
      workItemNumber: workItem.workItemNumber,
      tagType: 'FRAME',
      customerDisplayName: this.getDisplayedCustomerName(workItem, multiCustomerIds),
      artworkName: artworkData.name,
      productName: productData.name,
      runOrEditionLabel: this.determineRunOrEditionLabel(productData.classification),
      runOrEditionValue: productData.runOrEditionValue,
      frameStyleName,
      packagingMethod: 'STANDARD_BOX',
      frameDimensions: this.calculateFrameDimensions(tagType, frameStyleName, artworkData.width, artworkData.height),
      checkpoints: [],
      notes: [],
      pairKey: `${batchId}:${workItem.id}:P2`,
      generatedAt: this.nowProvider(),
      generatedByEmployeeId,
    })
  }

  generateBaseOrStretcherTag(
    workItem: WorkItem,
    multiCustomerIds: Set<string>,
    batchId: string,
    generatedByEmployeeId?: string,
  ): ProductionTag | null {
    const productData = this.requireProductData(workItem)
    const artworkData = this.requireArtworkData(workItem)

    const primaryTagType = this.determinePrimaryTagType(productData.code)

    if (primaryTagType === 'CANVAS') {
      return new ProductionTag({
        workItemId: workItem.id,
        workItemNumber: workItem.workItemNumber,
        tagType: 'STRETCHER',
        customerDisplayName: this.getDisplayedCustomerName(workItem, multiCustomerIds),
        artworkName: artworkData.name,
        productName: productData.name,
        packagingMethod: 'STANDARD_BOX',
        stretcherDimensions: this.calculateStretcherDimensions(artworkData.width, artworkData.height),
        checkpoints: [],
        notes: [],
        pairKey: `${batchId}:${workItem.id}:P2`,
        generatedAt: this.nowProvider(),
        generatedByEmployeeId,
      })
    }

    if (primaryTagType === 'THREE_D_PRINT') {
      const baseStyleName = this.lookups.getBaseStyleName(workItem) ?? this.lookups.getFrameStyleName(workItem) ?? 'None'

      return new ProductionTag({
        workItemId: workItem.id,
        workItemNumber: workItem.workItemNumber,
        tagType: 'THREE_D_BASE',
        customerDisplayName: this.getDisplayedCustomerName(workItem, multiCustomerIds),
        artworkName: artworkData.name,
        productName: productData.name,
        baseStyleName,
        packagingMethod: 'STANDARD_BOX',
        baseDimensions: this.calculateBaseDimensions(baseStyleName, artworkData.width, artworkData.height),
        checkpoints: [],
        notes: [],
        pairKey: `${batchId}:${workItem.id}:P2`,
        generatedAt: this.nowProvider(),
        generatedByEmployeeId,
      })
    }

    return null
  }

  determinePrimaryTagType(productCode: string): ProductionTagType {
    const normalizedCode = this.normalize(productCode)

    if (normalizedCode === '4 paper') {
      return 'PAPER'
    }

    if (normalizedCode === '3 canv') {
      return 'CANVAS'
    }

    return 'THREE_D_PRINT'
  }

  determineRunOrEditionLabel(classification?: string): 'Run' | 'Edition' {
    return this.normalize(classification ?? '') === '2 3d' ? 'Edition' : 'Run'
  }

  calculateFrameDimensions(
    primaryTagType: ProductionTagType,
    frameStyleName: string,
    artworkWidth: number,
    artworkHeight: number,
  ): DecimalDimensions {
    const effectiveStyleName =
      primaryTagType === 'PAPER' ? this.ensurePictureStyle(frameStyleName) : frameStyleName

    const increase = this.getFrameIncrease(effectiveStyleName)

    return {
      width: artworkWidth + increase,
      height: artworkHeight + increase,
    }
  }

  calculateBaseDimensions(
    baseStyleName: string,
    artworkWidth: number,
    artworkHeight: number,
  ): DecimalDimensions {
    const adjustment = this.getBaseAdjustment(baseStyleName)

    return {
      width: artworkWidth + adjustment,
      height: artworkHeight + adjustment,
    }
  }

  calculateStretcherDimensions(artworkWidth: number, artworkHeight: number): DecimalDimensions {
    const offset = 1 / 16

    return {
      width: artworkWidth - offset,
      height: artworkHeight - offset,
    }
  }

  determinePackagingMethod(
    workItem: WorkItem,
    packagingData?: WorkItemPackagingData,
  ): PackagingMethodCode {
    const configured = packagingData?.methodCode
    if (configured) {
      return configured
    }

    const workItemMethod = this.readCustomField(workItem, 'packagingMethod')
    if (typeof workItemMethod === 'string') {
      const normalizedMethod = this.normalize(workItemMethod)
      const match = this.packagingMethods.find(
        (method) => this.normalize(method.code) === normalizedMethod || this.normalize(method.label) === normalizedMethod,
      )

      if (match) {
        return match.code
      }
    }

    return 'STANDARD_BOX'
  }

  calculatePackageDimensions(input: {
    packagingMethod: PackagingMethodCode
    shippingBoxCode?: string
    tagType: ProductionTagType
    finishedWidth: number
    finishedHeight: number
  }): string | undefined {
    if (input.packagingMethod === 'GALLERY') {
      return 'GALLERY'
    }

    if (input.packagingMethod === 'PICKUP') {
      return 'PICKUP'
    }

    if (input.packagingMethod === 'DELIVERY') {
      return 'DELIVERY'
    }

    if (input.packagingMethod === 'CRATE') {
      return undefined
    }

    if (input.packagingMethod === 'CNC') {
      if (input.tagType === 'PAPER') {
        return '26 x 22 x 6'
      }

      const larger = Math.ceil(Math.max(input.finishedWidth, input.finishedHeight) + 5)
      const smaller = Math.ceil(Math.min(input.finishedWidth, input.finishedHeight) + 5)
      return `${larger} x ${smaller} x 6`
    }

    if (input.tagType === 'PAPER') {
      return '25 x 3 x 3'
    }

    if (!input.shippingBoxCode) {
      return undefined
    }

    const shippingBox = this.getShippingBox(input.shippingBoxCode)
    return shippingBox?.dimensionsDisplay
  }

  getShippingBox(shippingBoxCode: string): ShippingBox | undefined {
    const normalizedCode = this.normalize(shippingBoxCode)
    return this.shippingBoxes.find((shippingBox) => this.normalize(shippingBox.code) === normalizedCode)
  }

  detectMultipleCustomerItems(workItems: WorkItem[]): Set<string> {
    const activeItems = workItems.filter(
      (workItem) => workItem.status !== 'COMPLETE' && workItem.status !== 'CANCELLED',
    )

    const counts = new Map<string, number>()

    for (const workItem of activeItems) {
      const nextCount = (counts.get(workItem.customerId) ?? 0) + 1
      counts.set(workItem.customerId, nextCount)
    }

    const multiCustomerIds = new Set<string>()
    counts.forEach((count, customerId) => {
      if (count > 1) {
        multiCustomerIds.add(customerId)
      }
    })

    return multiCustomerIds
  }

  getRequiredCheckpoints(
    primaryTagType: ProductionTagType,
    artworkData?: ArtworkTagData,
  ): TagCheckpoint[] {
    if (primaryTagType !== 'THREE_D_PRINT') {
      return []
    }

    return [
      new TagCheckpoint({
        key: 'SCAN',
        label: 'Scan',
        value: artworkData?.scanState ?? 'New',
      }),
      new TagCheckpoint({
        key: 'IA',
        label: 'IA',
        value: artworkData?.ia ? 'Yes' : 'No',
      }),
      new TagCheckpoint({
        key: 'PRINTED',
        label: 'Printed',
        value: artworkData?.printed ? 'Yes' : 'No',
      }),
      new TagCheckpoint({
        key: 'RESLICED',
        label: 'Resliced',
        value: artworkData?.resliced ? 'Yes' : 'No',
      }),
    ]
  }

  generateTagPairs(tags: ProductionTag[]): ProductionTagPair[] {
    const byWorkItem = new Map<string, ProductionTag[]>()

    for (const tag of tags) {
      const existing = byWorkItem.get(tag.workItemId) ?? []
      existing.push(tag)
      byWorkItem.set(tag.workItemId, existing)
    }

    const pairs: ProductionTagPair[] = []
    byWorkItem.forEach((workItemTags, workItemId) => {
      const sorted = [...workItemTags].sort((left, right) => left.generatedAt.localeCompare(right.generatedAt))

      for (let index = 0; index < sorted.length; index += 2) {
        const chunk = sorted.slice(index, index + 2)
        pairs.push({
          pairKey: `${workItemId}-PAIR-${Math.floor(index / 2) + 1}`,
          tags: chunk,
        })
      }
    })

    return pairs
  }

  private getWorkItemsForBatch(workItemIds?: string[]): WorkItem[] {
    const allItems = this.workItemService.listWorkItems()
    if (!workItemIds || workItemIds.length === 0) {
      return allItems
    }

    const wantedIds = new Set(workItemIds)
    return allItems.filter((workItem) => wantedIds.has(workItem.id))
  }

  private captureTagSnapshot(
    tags: ProductionTag[],
    batchId: string,
    generatedByEmployeeId?: string,
  ): void {
    const byWorkItem = new Map<string, ProductionTag[]>()

    for (const tag of tags) {
      const existing = byWorkItem.get(tag.workItemId) ?? []
      existing.push(tag)
      byWorkItem.set(tag.workItemId, existing)
    }

    byWorkItem.forEach((workItemTags, workItemId) => {
      const workItem = this.workItemService.getWorkItemById(workItemId)
      if (!workItem) {
        return
      }

      const snapshot = {
        batchId,
        capturedAt: this.nowProvider(),
        tags: workItemTags.map((tag) => this.toTagSnapshot(tag)),
      }

      const existingSnapshots = Array.isArray(workItem.customFields.productionTagSnapshots)
        ? workItem.customFields.productionTagSnapshots
        : []

      this.workItemService.updateWorkItem(workItem.id, {
        customFields: {
          productionTagSnapshots: [...existingSnapshots, snapshot],
        },
        actorEmployeeId: generatedByEmployeeId,
      })

      this.workItemService.recordWorkItemActivity({
        workItemId: workItem.id,
        action: 'PRODUCTION_TAG_SNAPSHOT_CAPTURED',
        message: `Production tag snapshot captured for batch ${batchId}`,
        actorEmployeeId: generatedByEmployeeId,
        metadata: {
          batchId,
          tagCount: workItemTags.length,
        },
      })
    })
  }

  private recordTagGenerationActivity(
    workItemId: string,
    tags: ProductionTag[],
    actorEmployeeId?: string,
  ): void {
    const metadata: RecordWorkItemActivityInput['metadata'] = {
      tagCount: tags.length,
      tagTypes: tags.map((tag) => tag.tagType).join(','),
    }

    this.workItemService.recordWorkItemActivity({
      workItemId,
      action: 'PRODUCTION_TAG_GENERATED',
      message: `Generated ${tags.length} production tags`,
      actorEmployeeId,
      metadata,
    })
  }

  private getDisplayedCustomerName(workItem: WorkItem, multiCustomerIds: Set<string>): string {
    const customerName = this.lookups.getCustomerName(workItem.customerId) ?? workItem.customerId

    if (multiCustomerIds.has(workItem.customerId)) {
      return `${customerName} (MULTI)`
    }

    return customerName
  }

  private ensurePictureStyle(frameStyleName: string): string {
    const normalized = this.normalize(frameStyleName)
    if (normalized.startsWith('picture ')) {
      return frameStyleName
    }

    return `Picture ${frameStyleName}`
  }

  private getFrameIncrease(frameStyleName: string): number {
    const normalizedStyle = this.normalize(frameStyleName)

    const styleRule = this.frameStyles.find((frameStyle) => frameStyle.normalizedKey === normalizedStyle)
    if (styleRule) {
      return styleRule.increaseInches
    }

    const measurementRule = this.measurementRules.find(
      (rule) => rule.active && rule.ruleType === 'FRAME_INCREASE' && rule.targetKey === normalizedStyle,
    )

    return measurementRule?.adjustment ?? 0
  }

  private getBaseAdjustment(baseStyleName: string): number {
    const normalizedStyle = this.normalize(baseStyleName)

    const styleRule = this.baseStyles.find((baseStyle) => baseStyle.normalizedKey === normalizedStyle)
    if (styleRule) {
      return styleRule.adjustmentInches
    }

    const measurementRule = this.measurementRules.find(
      (rule) => rule.active && rule.ruleType === 'BASE_ADJUSTMENT' && rule.targetKey === normalizedStyle,
    )

    if (measurementRule) {
      return measurementRule.adjustment
    }

    const defaultRule = this.baseStyles.find((baseStyle) => baseStyle.normalizedKey === 'none')
    return defaultRule?.adjustmentInches ?? 0
  }

  private requireArtworkData(workItem: WorkItem): ArtworkTagData {
    const artworkData = this.lookups.getArtworkData(workItem)
    if (!artworkData) {
      throw new Error(`Artwork data was not found for WorkItem ${workItem.id}`)
    }

    return artworkData
  }

  private requireProductData(workItem: WorkItem): ProductTagData {
    const productData = this.lookups.getProductData(workItem)
    if (!productData) {
      throw new Error(`Product data was not found for WorkItem ${workItem.id}`)
    }

    return productData
  }

  private toTagSnapshot(tag: ProductionTag): Omit<ProductionTagShape, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      workItemId: tag.workItemId,
      workItemNumber: tag.workItemNumber,
      tagType: tag.tagType,
      customerDisplayName: tag.customerDisplayName,
      artworkName: tag.artworkName,
      productName: tag.productName,
      runOrEditionLabel: tag.runOrEditionLabel,
      runOrEditionValue: tag.runOrEditionValue,
      frameStyleName: tag.frameStyleName,
      baseStyleName: tag.baseStyleName,
      packagingMethod: tag.packagingMethod,
      shippingBoxCode: tag.shippingBoxCode,
      frameDimensions: tag.frameDimensions,
      baseDimensions: tag.baseDimensions,
      stretcherDimensions: tag.stretcherDimensions,
      packageDimensionsDisplay: tag.packageDimensionsDisplay,
      checkpoints: tag.checkpoints,
      notes: tag.notes,
      pairKey: tag.pairKey,
      generatedAt: tag.generatedAt,
      generatedByEmployeeId: tag.generatedByEmployeeId,
    }
  }

  private readCustomField(workItem: WorkItem, key: string): unknown {
    return workItem.customFields[key]
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ')
  }
}
