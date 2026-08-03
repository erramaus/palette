import { ProductionTag, TagCheckpoint } from '../models'
import {
  productionTagPackagingMethods,
  productionTagShippingBoxes,
} from '../data/productionTagSeeds'
import type {
  DecimalDimensions,
  PackagingMethod,
  PackagingMethodCode,
  ProductionTag as ProductionTagShape,
  ProductionTagType,
  ShippingBox,
  WorkItem,
} from '../types/entities'
import type { ProductType } from '../types/production'
import type { ProductionCutCalculationResult } from '../types/productionCut'
import { nowIso } from '../utils/time'
import { BaseCalculationService } from './BaseCalculationService'
import { FrameCalculationService } from './FrameCalculationService'
import { StretcherCalculationService } from './StretcherCalculationService'
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
}

export interface ProductionTagPair {
  pairKey: string
  tags: ProductionTag[]
}

export interface ProductionTagServiceConfig {
  packagingMethods?: PackagingMethod[]
  shippingBoxes?: ShippingBox[]
  nowProvider?: () => string
}

export class ProductionTagService {
  private readonly workItemService: WorkItemService
  private readonly lookups: ProductionTagLookupProvider
  private readonly packagingMethods: PackagingMethod[]
  private readonly shippingBoxes: ShippingBox[]
  private readonly frameCalculationService = new FrameCalculationService()
  private readonly baseCalculationService = new BaseCalculationService()
  private readonly stretcherCalculationService = new StretcherCalculationService()
  private readonly nowProvider: () => string

  constructor(
    workItemService: WorkItemService,
    lookups: ProductionTagLookupProvider,
    config?: ProductionTagServiceConfig,
  ) {
    this.workItemService = workItemService
    this.lookups = lookups
    this.packagingMethods = config?.packagingMethods ?? productionTagPackagingMethods
    this.shippingBoxes = config?.shippingBoxes ?? productionTagShippingBoxes
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

    return tags
  }

  printTags(tags: ProductionTagShape[], printedByEmployeeId?: string): ProductionTagShape[] {
    const printable = tags.filter((tag) => tag.status === 'READY_TO_PRINT')
    const printedAt = this.nowProvider()
    printable.forEach((tag) => {
      tag.status = 'PRINTED'
      tag.printedAt = printedAt
      tag.printedByEmployeeId = printedByEmployeeId
      tag.updatedAt = printedAt
    })
    if (printable.length > 0) {
      this.captureTagSnapshot(printable, `PRINT-${printedAt}`, printedByEmployeeId)
    }
    return printable
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
    const frameCalculation = frameStyleName && this.requiresFrame(frameStyleName)
      ? this.frameCalculationService.calculate({
          productType: this.resolveProductType(productData, primaryTagType),
          width: artworkData.width,
          height: artworkData.height,
          importedFrameName: frameStyleName,
          mouldingIdentifier: this.readStringCustomField(workItem, 'mouldingIdentifier'),
        })
      : undefined
    const routeCalculation = this.getRequiredConstructionCalculation(
      workItem,
      productData,
      primaryTagType,
      artworkData,
      baseStyleName ?? frameStyleName,
    )
    const needsReview = frameCalculation?.status === 'NEEDS_REVIEW'
      || routeCalculation?.status === 'NEEDS_REVIEW'

    return new ProductionTag({
      workItemId: workItem.id,
      workItemNumber: workItem.workItemNumber,
      tagType: primaryTagType,
      status: needsReview ? 'NEEDS_REVIEW' : 'READY_TO_PRINT',
      customerDisplayName: this.getDisplayedCustomerName(workItem, multiCustomerIds),
      artworkName: artworkData.name,
      productName: productData.name,
      ...this.tagContext(workItem, productData, artworkData, frameStyleName, frameCalculation),
      runOrEditionLabel,
      runOrEditionValue: productData.runOrEditionValue,
      frameStyleName,
      baseStyleName,
      packagingMethod,
      shippingBoxCode: packagingData?.shippingBoxCode,
      frameDimensions:
        frameCalculation?.status === 'CONFIRMED'
          ? this.dimensionsFromCalculation(frameCalculation)
          : undefined,
      cutCalculation: frameCalculation,
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
    const calculation = this.frameCalculationService.calculate({
      productType: this.resolveProductType(productData, tagType),
      width: artworkData.width,
      height: artworkData.height,
      importedFrameName: frameStyleName,
      mouldingIdentifier: this.readStringCustomField(workItem, 'mouldingIdentifier'),
    })
    if (!calculation.canGenerateFinalSawTag) {
      return null
    }

    return new ProductionTag({
      workItemId: workItem.id,
      workItemNumber: workItem.workItemNumber,
      tagType: 'FRAME',
      status: 'READY_TO_PRINT',
      customerDisplayName: this.getDisplayedCustomerName(workItem, multiCustomerIds),
      artworkName: artworkData.name,
      productName: productData.name,
      ...this.tagContext(workItem, productData, artworkData, frameStyleName, calculation),
      runOrEditionLabel: this.determineRunOrEditionLabel(productData.classification),
      runOrEditionValue: productData.runOrEditionValue,
      frameStyleName,
      packagingMethod: 'STANDARD_BOX',
      frameDimensions: this.dimensionsFromCalculation(calculation),
      cutCalculation: calculation,
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

    const productType = this.resolveProductType(productData, primaryTagType)

    if (productType === 'CANVAS' || productType === 'ORIGINAL') {
      const calculation = this.stretcherCalculationService.calculate({
        productType,
        width: artworkData.width,
        height: artworkData.height,
      })
      if (!calculation.canGenerateFinalSawTag) {
        return null
      }

      return new ProductionTag({
        workItemId: workItem.id,
        workItemNumber: workItem.workItemNumber,
        tagType: 'STRETCHER',
        status: 'READY_TO_PRINT',
        customerDisplayName: this.getDisplayedCustomerName(workItem, multiCustomerIds),
        artworkName: artworkData.name,
        productName: productData.name,
        ...this.tagContext(workItem, productData, artworkData, undefined, calculation),
        packagingMethod: 'STANDARD_BOX',
        stretcherDimensions: this.dimensionsFromCalculation(calculation),
        cutCalculation: calculation,
        checkpoints: [],
        notes: [],
        pairKey: `${batchId}:${workItem.id}:P2`,
        generatedAt: this.nowProvider(),
        generatedByEmployeeId,
      })
    }

    if (primaryTagType === 'THREE_D_PRINT') {
      const baseStyleName = this.lookups.getBaseStyleName(workItem) ?? this.lookups.getFrameStyleName(workItem) ?? 'None'
      const calculation = this.baseCalculationService.calculate({
        productType: this.resolveProductType(productData, primaryTagType),
        width: artworkData.width,
        height: artworkData.height,
        importedFrameName: baseStyleName,
        mouldingIdentifier: this.readStringCustomField(workItem, 'mouldingIdentifier'),
      })
      if (!calculation.canGenerateFinalSawTag) {
        return null
      }

      return new ProductionTag({
        workItemId: workItem.id,
        workItemNumber: workItem.workItemNumber,
        tagType: 'THREE_D_BASE',
        status: 'READY_TO_PRINT',
        customerDisplayName: this.getDisplayedCustomerName(workItem, multiCustomerIds),
        artworkName: artworkData.name,
        productName: productData.name,
        ...this.tagContext(workItem, productData, artworkData, baseStyleName, calculation),
        baseStyleName,
        packagingMethod: 'STANDARD_BOX',
        baseDimensions: this.dimensionsFromCalculation(calculation),
        cutCalculation: calculation,
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
    tags: ProductionTagShape[],
    batchId: string,
    generatedByEmployeeId?: string,
  ): void {
    const byWorkItem = new Map<string, ProductionTagShape[]>()

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

  private dimensionsFromCalculation(calculation: ProductionCutCalculationResult): DecimalDimensions {
    return {
      width: calculation.trace.calculatedOutputs.adjustedWidthInches as number,
      height: calculation.trace.calculatedOutputs.adjustedHeightInches as number,
    }
  }

  private getRequiredConstructionCalculation(
    workItem: WorkItem,
    productData: ProductTagData,
    primaryTagType: ProductionTagType,
    artworkData: ArtworkTagData,
    frameStyleName?: string,
  ): ProductionCutCalculationResult | undefined {
    const productType = this.resolveProductType(productData, primaryTagType)
    if (productType === 'CANVAS' || productType === 'ORIGINAL') {
      return this.stretcherCalculationService.calculate({
        productType,
        width: artworkData.width,
        height: artworkData.height,
      })
    }
    if ((productType === 'THREE_D_PRINT' || productType === 'TEXTURED_REPLICA_3D') && frameStyleName) {
      return this.baseCalculationService.calculate({
        productType,
        width: artworkData.width,
        height: artworkData.height,
        importedFrameName: frameStyleName,
        mouldingIdentifier: this.readStringCustomField(workItem, 'mouldingIdentifier'),
      })
    }
    return undefined
  }

  private tagContext(
    workItem: WorkItem,
    productData: ProductTagData,
    artworkData: ArtworkTagData,
    importedFrameName?: string,
    calculation?: ProductionCutCalculationResult,
  ): Pick<ProductionTagShape,
    'productType' | 'finishedDimensions' | 'orientation' | 'originalImportedFrameName'
    | 'normalizedFrameName' | 'dueDate' | 'priority' | 'assignedWorkstation'> {
    return {
      productType: productData.classification ?? productData.code,
      finishedDimensions: { width: artworkData.width, height: artworkData.height },
      orientation: this.readStringCustomField(workItem, 'orientation'),
      originalImportedFrameName: importedFrameName,
      normalizedFrameName: calculation?.normalizedFrame ?? undefined,
      dueDate: workItem.dueDate,
      priority: workItem.priority,
      assignedWorkstation: this.readStringCustomField(workItem, 'assignedWorkstation')
        ?? workItem.assignedDepartmentId,
    }
  }

  private resolveProductType(productData: ProductTagData, tagType: ProductionTagType): ProductType {
    const supported: ProductType[] = [
      'ORIGINAL', 'TEXTURED_REPLICA_3D', 'THREE_D_PRINT', 'CANVAS', 'PAPER', 'GALLERY_INVENTORY',
    ]
    if (supported.includes(productData.classification as ProductType)) {
      return productData.classification as ProductType
    }
    if (tagType === 'CANVAS') return 'CANVAS'
    if (tagType === 'PAPER') return 'PAPER'
    return 'THREE_D_PRINT'
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

  private toTagSnapshot(tag: ProductionTagShape): Omit<ProductionTagShape, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      workItemId: tag.workItemId,
      workItemNumber: tag.workItemNumber,
      tagType: tag.tagType,
      status: tag.status,
      customerDisplayName: tag.customerDisplayName,
      artworkName: tag.artworkName,
      productName: tag.productName,
      productType: tag.productType,
      finishedDimensions: tag.finishedDimensions,
      orientation: tag.orientation,
      originalImportedFrameName: tag.originalImportedFrameName,
      normalizedFrameName: tag.normalizedFrameName,
      dueDate: tag.dueDate,
      priority: tag.priority,
      assignedWorkstation: tag.assignedWorkstation,
      runOrEditionLabel: tag.runOrEditionLabel,
      runOrEditionValue: tag.runOrEditionValue,
      frameStyleName: tag.frameStyleName,
      baseStyleName: tag.baseStyleName,
      packagingMethod: tag.packagingMethod,
      shippingBoxCode: tag.shippingBoxCode,
      frameDimensions: tag.frameDimensions,
      baseDimensions: tag.baseDimensions,
      stretcherDimensions: tag.stretcherDimensions,
      cutCalculation: tag.cutCalculation,
      packageDimensionsDisplay: tag.packageDimensionsDisplay,
      checkpoints: tag.checkpoints,
      notes: tag.notes,
      pairKey: tag.pairKey,
      generatedAt: tag.generatedAt,
      generatedByEmployeeId: tag.generatedByEmployeeId,
      printedAt: tag.printedAt,
      printedByEmployeeId: tag.printedByEmployeeId,
      previousTagId: tag.previousTagId,
    }
  }

  private readCustomField(workItem: WorkItem, key: string): unknown {
    return workItem.customFields[key]
  }

  private readStringCustomField(workItem: WorkItem, key: string): string | undefined {
    const value = this.readCustomField(workItem, key)
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ')
  }

  private requiresFrame(frameStyleName: string): boolean {
    const normalized = this.normalize(frameStyleName)
    return normalized.length > 0 && normalized !== 'none' && normalized !== 'rolled' && normalized !== 'stretched'
  }
}
