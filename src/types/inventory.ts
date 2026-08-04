export type InventoryRecordStatus = 'ACTIVE' | 'INACTIVE' | 'NEEDS_REVIEW'
export type InventoryCountSessionStatus = 'DRAFT' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
export type InventoryCountEntryStatus = 'DRAFT' | 'COUNTED' | 'NEEDS_REVIEW' | 'DISCREPANCY'
export type InventoryRecommendationStatus = 'READY' | 'NEEDS_REVIEW'

export interface InventorySourceTrace {
  workbookName: string
  worksheetName: string
  rowNumber: number
  sourceRef: string
  sourceValues: Record<string, string>
  sourceFormulas: Record<string, string>
  styleRefs: Record<string, {
    cell: string
    styleIndex: number | null
    styleObject: unknown
    numberFormat: string | null
    cellType: string | null
  }>
}

export interface InventoryCategory {
  id: string
  name: string
  sourceWorksheetNames: string[]
  sourceRows: number[]
  status: InventoryRecordStatus
}

export interface InventoryLocation {
  id: string
  name: string
  sourceWorksheetName: string
  status: InventoryRecordStatus
}

export interface InventoryUnitOfMeasure {
  id: string
  rawLabel: string
  quantityPerPackage: number | null
  unitLabel: string | null
  status: InventoryRecordStatus
}

export interface InventorySupplier {
  id: string
  name: string
  status: InventoryRecordStatus
}

export interface InventoryRuleTrace {
  id: string
  itemId: string
  worksheetName: string
  rowNumber: number
  fieldName: string
  formula: string
  sourceRef: string
}

export interface InventoryItem {
  id: string
  workbookSourceId: string
  name: string
  categoryId: string
  categoryName: string
  subcategory: string | null
  description: string | null
  sku: string | null
  unitOfMeasureId: string | null
  unitOfMeasureLabel: string | null
  packageSizeRaw: string | null
  locationId: string
  locationName: string
  preferredSupplierId: string | null
  preferredSupplierName: string | null
  unitCost: number | null
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  reorderLevel: number | null
  desiredStock: number | null
  quantityToPurchaseObserved: number | null
  active: boolean
  countingInstructions: string | null
  notes: string | null
  status: InventoryRecordStatus
  lastCountedAt: string | null
  sourceTrace: InventorySourceTrace
}

export interface InventoryCountEntry {
  id: string
  sessionId: string
  itemId: string
  worksheetName: string
  locationName: string
  categoryName: string
  previousOnHand: number
  countedQuantity: number | null
  status: InventoryCountEntryStatus
  discrepancyNotes: string | null
  countNotes: string | null
}

export interface InventoryCountSession {
  id: string
  startedAt: string
  inventoryDate: string
  status: InventoryCountSessionStatus
  worksheetNames: string[]
  locationNames: string[]
  categoryNames: string[]
  entryIds: string[]
  submittedAt: string | null
  approvedAt: string | null
}

export interface InventoryAdjustment {
  id: string
  itemId: string
  quantityDelta: number
  reason: string
  occurredAt: string
  sourceSessionId: string | null
}

export interface InventoryReceipt {
  id: string
  itemId: string
  supplierId: string | null
  quantityReceived: number
  receivedAt: string
  notes: string | null
}

export interface InventoryPurchaseRecommendation {
  id: string
  itemId: string
  worksheetName: string
  rowNumber: number
  availableQuantity: number
  observedShortage: number
  desiredStock: number | null
  reorderLevel: number | null
  suggestedPurchaseQuantity: number | null
  status: InventoryRecommendationStatus
  rationale: string
}

export interface WarehouseInventorySeedRow {
  idHint: string
  worksheet: string
  rowNumber: number
  sourceRef: string
  category: string
  orderIndex: number | null
  sku: string | null
  description: string | null
  size: string | null
  supplier: string | null
  account: string | null
  stock: number | null
  reorderQuantity: number | null
  orderQuantity: number | null
  desiredStock: number | null
  priceEach: number | null
  subtotal: number | null
  notes: string | null
  formulas: Record<string, string>
  styleRefs: Record<string, {
    cell: string
    styleIndex: number | null
    styleObject: unknown
    numberFormat: string | null
    cellType: string | null
  }>
  status: 'READY' | 'NEEDS_REVIEW'
  sourceValues: Record<string, string>
}

export interface InventoryFoundationState {
  importedAt: string
  workbookName: string
  items: InventoryItem[]
  categories: InventoryCategory[]
  locations: InventoryLocation[]
  units: InventoryUnitOfMeasure[]
  suppliers: InventorySupplier[]
  sessions: InventoryCountSession[]
  entries: InventoryCountEntry[]
  recommendations: InventoryPurchaseRecommendation[]
  adjustments: InventoryAdjustment[]
  receipts: InventoryReceipt[]
  ruleTraces: InventoryRuleTrace[]
}
