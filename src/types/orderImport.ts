import type { PackagingMethodCode } from './entities'
import type { Priority, ProductType } from './production'

export type NormalizationStatus = 'NORMALIZED' | 'NEEDS_REVIEW'
export type NormalizationConfidence = 'HIGH' | 'MEDIUM' | 'LOW'

export interface RuleTraceability {
  sourceWorkbook: string
  worksheet: string
  ruleId: string
  confidence: NormalizationConfidence
}

export interface NormalizationResult<TOriginal, TNormalized> {
  original: TOriginal
  normalized: TNormalized | null
  status: NormalizationStatus
  traceability: RuleTraceability
  reviewReason?: string
}

export type CanonicalOrderSource =
  | 'DATED_ORDER_LIST'
  | 'COLLECTOR_CONTACT'
  | 'WAREHOUSE_REPORT'
  | 'PALETTE_UI'

export type CanonicalOrientation = 'HORIZONTAL' | 'VERTICAL' | 'SQUARE' | 'PANORAMA'

export interface CanonicalSize {
  width: number
  height: number
  display: string
}

export interface CanonicalProductionPiece {
  key: string
  artwork: string
  productType: ProductType
  size: CanonicalSize
}

export interface CanonicalOrderImport {
  source: NormalizationResult<string, CanonicalOrderSource>
  orderIdentifier: NormalizationResult<string, string>
  customerIdentifier: NormalizationResult<string, string>
  artwork: NormalizationResult<string, string>
  productType: NormalizationResult<string, ProductType>
  productionPiece: NormalizationResult<string, CanonicalProductionPiece>
  size: NormalizationResult<{ width: unknown; height: unknown }, CanonicalSize>
  orientation: NormalizationResult<string | undefined, CanonicalOrientation>
  frameSelection: NormalizationResult<string, string>
  dueDate: NormalizationResult<string, string>
  requestedDeliveryOrPickupDate: NormalizationResult<string | undefined, string | undefined>
  redNotes: NormalizationResult<string | undefined, string | undefined>
  priority: NormalizationResult<string, Priority>
  shippingOrPickupMethod: NormalizationResult<string | undefined, PackagingMethodCode>
  originalImport: Record<string, unknown>
  status: NormalizationStatus
}

export interface CanonicalOrderImportInput {
  source: string
  orderIdentifier: string
  customerIdentifier: string
  artwork: string
  productType: string
  width: unknown
  height: unknown
  orientation?: string
  frameSelection: string
  dueDate: string
  requestedDeliveryOrPickupDate?: string
  redNotes?: string
  priority: string
  shippingOrPickupMethod?: string
  originalImport?: Record<string, unknown>
}