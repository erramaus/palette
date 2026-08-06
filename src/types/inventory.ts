export type InventoryRecordStatus = 'ACTIVE' | 'INACTIVE' | 'NEEDS_REVIEW'
export type InventoryCountSessionStatus = 'DRAFT' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
export type InventoryCountEntryStatus = 'DRAFT' | 'COUNTED' | 'NEEDS_REVIEW' | 'DISCREPANCY'
export type InventoryRecommendationStatus =
  | 'NOT_REQUIRED'
  | 'COUNT_REQUIRED'
  | 'NEEDS_REVIEW'
  | 'RECOMMENDED'
  | 'DIRECTOR_APPROVED'
  | 'CSW_SUBMITTED'
  | 'APPROVED_FOR_PURCHASE'
  | 'REJECTED'
  | 'ORDERED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED'

export type PurchaseApprovalStatus = 'PENDING' | 'APPROVED' | 'APPROVED_WITH_MODIFICATIONS' | 'REJECTED'
export type PurchaseOrderStatus = 'DRAFT' | 'AWAITING_CSW_APPROVAL' | 'APPROVED' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'

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
  sourceStock: number | null
  sourceMaximumQuantity: number | null
  sourceReorderQuantity: number | null
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
  purchaseOrderId: string | null
  purchaseOrderLineId: string | null
  itemId: string
  supplierId: string | null
  quantityReceived: number
  quantityRemaining: number | null
  receivedAt: string
  notes: string | null
}

export interface InventoryPurchaseRecommendation {
  id: string
  inventoryItemId: string
  itemId: string
  item: string
  sizePackage: string | null
  sku: string | null
  description: string | null
  supplier: string | null
  account: string | null
  currentStock: number | null
  reorderThreshold: number | null
  maximumQuantity: number | null
  suggestedOrderQuantity: number | null
  priceEach: number | null
  subtotal: number | null
  weeksOnHand: number | null
  requiredByDate: string | null
  notes: string | null
  sourceWorksheet: string
  sourceRow: number
  calculationExplanation: string
  approvalStatus: PurchaseApprovalStatus
  reviewedQuantity: number | null
  reviewedReason: string | null
  approvalHistory: Array<{
    status: PurchaseApprovalStatus
    approvedAt: string
    approvedBy: string | null
    reason: string | null
    quantity: number | null
  }>
  sourceTrace: InventorySourceTrace
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

export interface PurchaseRecommendationLine {
  id: string
  recommendationId: string
  inventoryItemId: string
  supplier: string | null
  account: string | null
  sku: string | null
  description: string | null
  sizePackage: string | null
  quantity: number
  unitPrice: number | null
  subtotal: number | null
  sourceWorksheet: string
  sourceRow: number
  notes: string | null
}

export interface PurchaseOrderLine {
  id: string
  recommendationId: string | null
  inventoryItemId: string
  supplier: string | null
  account: string | null
  sku: string | null
  description: string | null
  sizePackage: string | null
  quantityOrdered: number
  quantityReceived: number
  quantityRemaining: number
  unitPrice: number | null
  subtotal: number | null
  sourceWorksheet: string
  sourceRow: number
  sourceItemSnapshot: string | null
  notes: string | null
  accountAllocation: Record<string, number>
  receipts: Array<{
    id: string
    receivedAt: string
    quantityReceived: number
    notes: string | null
  }>
}

export interface PurchaseOrderDraft {
  id: string
  poDraftNumber: string
  supplier: string
  dateCreated: string
  requestedBy: string
  accountLabel: string
  accountAllocation: Record<string, number>
  lines: PurchaseOrderLine[]
  total: number
  notes: string | null
  approvalStatus: PurchaseOrderStatus
  approvalHistory: Array<{
    status: PurchaseOrderStatus
    changedAt: string
    changedBy: string | null
    reason: string | null
  }>
  orderNotes: string[]
  receipts: InventoryReceipt[]
  sourceInventoryCount: number
}

export interface InventoryCswDocument {
  id: string
  title: string
  to: string
  from: string
  date: string
  subject: string
  inventoryDate: string
  totalItemsCounted: number
  recommendedItemCount: number
  needsReviewCount: number
  suppliers: Array<{
    supplier: string
    lineItemCount: number
    total: number
    majorItems: string[]
    notes: string[]
  }>
  totalRecommendedPurchaseValue: number
  accountAllocationTotals: Record<string, number>
  urgentOrZeroStockItems: string[]
  itemsWithInsufficientCountsOrMissingPricing: string[]
  situation: string
  dataSummary: string
  evaluation: string
  purchaseSummary: string
  accountSummary: string
  risksAndExceptions: string
  recommendation: string
  approvalStatus: 'PENDING' | 'APPROVED' | 'APPROVED_WITH_MODIFICATIONS' | 'DISAPPROVED'
  approvalSignatureName: string | null
  approvalDate: string | null
  sourceRecommendationIds: string[]
  sourcePurchaseOrderIds: string[]
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
  purchaseOrders: PurchaseOrderDraft[]
  cswDocuments: InventoryCswDocument[]
  adjustments: InventoryAdjustment[]
  receipts: InventoryReceipt[]
  ruleTraces: InventoryRuleTrace[]
}

export type PurchaseRecommendation = InventoryPurchaseRecommendation
