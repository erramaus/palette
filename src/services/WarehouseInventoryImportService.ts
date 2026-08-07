import {
  WAREHOUSE_INVENTORY_SEED_ROWS,
  WAREHOUSE_INVENTORY_WORKBOOK_NAME,
} from '../data/warehouseInventoryWorkbookSeed'
import type {
  InventoryAdjustment,
  InventoryCategory,
  InventoryCountEntry,
  InventoryCountSession,
  InventoryActivityLogEntry,
  InventoryReceipt,
  InventoryFoundationState,
  InventoryItem,
  InventoryLocation,
  InventoryPurchaseRecommendation,
  InventoryCswDocument,
  InventoryRuleTrace,
  PurchaseOrderDraft,
  InventorySupplier,
  InventoryUnitOfMeasure,
  PurchaseApprovalStatus,
  WarehouseInventorySeedRow,
} from '../types/inventory'

const STORAGE_KEY = 'palette.inventory.foundation.v1'

const makeId = (prefix: string, value: string): string => {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${prefix}-${cleaned || 'na'}`
}

const toNumberOrZero = (value: number | null): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

const parseUnit = (value: string | null): { quantityPerPackage: number | null; unitLabel: string | null } => {
  if (!value) {
    return { quantityPerPackage: null, unitLabel: null }
  }
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s+(.+)$/)
  if (!match) {
    return { quantityPerPackage: null, unitLabel: value.trim() || null }
  }
  return {
    quantityPerPackage: Number(match[1]),
    unitLabel: match[2].trim() || null,
  }
}

const nowIso = (): string => new Date().toISOString()

const todayDate = (): string => new Date().toISOString().slice(0, 10)

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? value as T[] : [])

const mergeRecommendationLists = (
  computed: InventoryPurchaseRecommendation[],
  previous: InventoryPurchaseRecommendation[] | undefined,
): InventoryPurchaseRecommendation[] => {
  const previousById = new Map(previous?.map((recommendation) => [recommendation.id, recommendation]))

  return computed.map((recommendation) => {
    const prior = previousById.get(recommendation.id)
    if (!prior) return recommendation

    return {
      ...recommendation,
      approvalStatus: prior.approvalStatus,
      reviewedQuantity: prior.reviewedQuantity,
      reviewedReason: prior.reviewedReason,
      approvalHistory: prior.approvalHistory,
      status: prior.approvalStatus === 'PENDING' ? recommendation.status : prior.status,
    }
  })
}

const getRecommendationOrderQuantity = (recommendation: InventoryPurchaseRecommendation): number => {
  return recommendation.reviewedQuantity ?? recommendation.suggestedPurchaseQuantity ?? 0
}

const summarizeAccountAllocation = (recommendations: InventoryPurchaseRecommendation[]): Record<string, number> => {
  return recommendations.reduce<Record<string, number>>((allocation, recommendation) => {
    const account = recommendation.account ?? 'Unassigned'
    allocation[account] = (allocation[account] ?? 0) + (recommendation.subtotal ?? 0)
    return allocation
  }, {})
}

const summarizeSupplierRecommendations = (recommendations: InventoryPurchaseRecommendation[]): Array<{
  supplier: string
  lineItemCount: number
  total: number
  majorItems: string[]
  notes: string[]
}> => {
  const grouped = new Map<string, InventoryPurchaseRecommendation[]>()
  for (const recommendation of recommendations) {
    const supplier = recommendation.supplier ?? 'Unassigned'
    const current = grouped.get(supplier) ?? []
    current.push(recommendation)
    grouped.set(supplier, current)
  }

  return [...grouped.entries()].map(([supplier, groupedRecommendations]) => ({
    supplier,
    lineItemCount: groupedRecommendations.length,
    total: groupedRecommendations.reduce((sum, recommendation) => sum + (recommendation.subtotal ?? 0), 0),
    majorItems: groupedRecommendations.slice(0, 5).map((recommendation) => recommendation.item),
    notes: groupedRecommendations
      .filter((recommendation) => recommendation.status === 'NEEDS_REVIEW' || recommendation.status === 'COUNT_REQUIRED')
      .map((recommendation) => recommendation.calculationExplanation),
  }))
}

const buildRecommendationList = (
  items: InventoryItem[],
  previousRecommendations: InventoryPurchaseRecommendation[] | undefined,
): InventoryPurchaseRecommendation[] => mergeRecommendationLists(
  items.filter((item) => item.active).map(computeRecommendation),
  previousRecommendations,
)

const computeRecommendation = (item: InventoryItem): InventoryPurchaseRecommendation => {
  const currentStock = item.quantityOnHand
  const maximumQuantity = item.desiredStock
  const reorderThreshold = item.reorderLevel
  const weeksOnHand = currentStock !== null && maximumQuantity && maximumQuantity > 0 ? (12 / maximumQuantity) * currentStock : null
  const currentStockValue = currentStock ?? 0
  const suggestedOrderQuantity =
    currentStock === null || maximumQuantity === null
      ? null
      : reorderThreshold !== null && currentStock > reorderThreshold
        ? 0
        : Math.max(0, maximumQuantity - currentStock)
  const subtotal = suggestedOrderQuantity !== null && item.unitCost !== null ? suggestedOrderQuantity * item.unitCost : null
  const sourceWorksheet = item.sourceTrace.worksheetName
  const sourceRow = item.sourceTrace.rowNumber
  const isCountRequired = item.sourceStock === null
  const isNeedsReview = !isCountRequired && (maximumQuantity === null || reorderThreshold === null)
  const status = isCountRequired
    ? 'COUNT_REQUIRED'
    : suggestedOrderQuantity === null
      ? 'NEEDS_REVIEW'
      : suggestedOrderQuantity > 0
        ? 'RECOMMENDED'
        : 'NOT_REQUIRED'

  return {
    id: makeId('inv-reco', item.id),
    inventoryItemId: item.id,
    itemId: item.id,
    item: item.name,
    sizePackage: item.packageSizeRaw,
    sku: item.sku,
    description: item.description,
    supplier: item.preferredSupplierName,
    account: item.subcategory,
    currentStock,
    reorderThreshold,
    maximumQuantity,
    suggestedOrderQuantity,
    priceEach: item.unitCost,
    subtotal,
    weeksOnHand,
    requiredByDate: null,
    notes: item.notes,
    sourceWorksheet,
    sourceRow,
    calculationExplanation: isCountRequired
      ? 'Inventory count is required before a purchase recommendation can be finalized.'
      : isNeedsReview
        ? 'Workbook row does not include enough information to finalize purchase quantity.'
        : suggestedOrderQuantity && suggestedOrderQuantity > 0
          ? 'Purchase quantity follows workbook max qty minus current stock.'
          : 'Current stock is above the reorder threshold so no purchase is required.',
    approvalStatus: 'PENDING',
    reviewedQuantity: suggestedOrderQuantity,
    reviewedReason: null,
    approvalHistory: [],
    sourceTrace: item.sourceTrace,
    worksheetName: sourceWorksheet,
    rowNumber: sourceRow,
    availableQuantity: item.quantityAvailable,
    observedShortage: maximumQuantity !== null ? Math.max(0, maximumQuantity - currentStockValue) : 0,
    desiredStock: maximumQuantity,
    reorderLevel: reorderThreshold,
    suggestedPurchaseQuantity: suggestedOrderQuantity,
    status,
    rationale: isCountRequired
      ? 'Stock count required before purchase recommendation can be approved.'
      : suggestedOrderQuantity && suggestedOrderQuantity > 0
        ? 'Recommended order quantity matches workbook calculation.'
        : 'No purchase order recommended from current workbook values.',
  }
}

const buildStateFromSeed = (
  previous: InventoryFoundationState | null,
  seedRows: WarehouseInventorySeedRow[],
): InventoryFoundationState => {
  const importedAt = nowIso()
  const workbookName = WAREHOUSE_INVENTORY_WORKBOOK_NAME

  const previousItems = asArray<InventoryItem>(previous?.items)
  const previousRecommendations = asArray<InventoryPurchaseRecommendation>(previous?.recommendations)
  const previousSessions = asArray<InventoryCountSession>(previous?.sessions)
  const previousEntries = asArray<InventoryCountEntry>(previous?.entries)
  const previousPurchaseOrders = asArray<PurchaseOrderDraft>(previous?.purchaseOrders)
  const previousCswDocuments = asArray<InventoryCswDocument>(previous?.cswDocuments)
  const previousAdjustments = asArray<InventoryAdjustment>(previous?.adjustments)
  const previousReceipts = asArray<InventoryReceipt>(previous?.receipts)
  const previousActivityLog = asArray<InventoryActivityLogEntry>(previous?.activityLog)

  const previousItemByWorkbookSourceId = new Map(previousItems.map((item) => [item.workbookSourceId, item]))
  const previousReservedByItemId = new Map(previousItems.map((item) => [item.id, item.quantityReserved]))

  const categoryMap = new Map<string, InventoryCategory>()
  const locationMap = new Map<string, InventoryLocation>()
  const supplierMap = new Map<string, InventorySupplier>()
  const unitMap = new Map<string, InventoryUnitOfMeasure>()
  const ruleTraces: InventoryRuleTrace[] = []

  const importedItems: InventoryItem[] = seedRows.map((row) => {
    const workbookSourceId = `${workbookName}|${row.worksheet}|${row.rowNumber}`
    const stableId = makeId('inv-item', workbookSourceId)
    const previousItem = previousItemByWorkbookSourceId.get(workbookSourceId)

    const categoryId = makeId('inv-cat', row.category)
    const existingCategory = categoryMap.get(categoryId)
    if (existingCategory) {
      if (!existingCategory.sourceWorksheetNames.includes(row.worksheet)) {
        existingCategory.sourceWorksheetNames.push(row.worksheet)
      }
      existingCategory.sourceRows.push(row.rowNumber)
    } else {
      categoryMap.set(categoryId, {
        id: categoryId,
        name: row.category,
        sourceWorksheetNames: [row.worksheet],
        sourceRows: [row.rowNumber],
        status: 'ACTIVE',
      })
    }

    const locationId = makeId('inv-loc', row.worksheet)
    if (!locationMap.has(locationId)) {
      locationMap.set(locationId, {
        id: locationId,
        name: row.worksheet,
        sourceWorksheetName: row.worksheet,
        status: 'ACTIVE',
      })
    }

    let supplierId: string | null = null
    if (row.supplier) {
      supplierId = makeId('inv-supplier', row.supplier)
      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, {
          id: supplierId,
          name: row.supplier,
          status: 'ACTIVE',
        })
      }
    }

    let unitId: string | null = null
    const parsedUnit = parseUnit(row.size)
    if (row.size) {
      unitId = makeId('inv-uom', row.size)
      if (!unitMap.has(unitId)) {
        unitMap.set(unitId, {
          id: unitId,
          rawLabel: row.size,
          quantityPerPackage: parsedUnit.quantityPerPackage,
          unitLabel: parsedUnit.unitLabel,
          status: 'ACTIVE',
        })
      }
    }

    const onHand = toNumberOrZero(row.stock)
    const reserved = previousItem ? previousItem.quantityReserved : (previousReservedByItemId.get(stableId) ?? 0)
    const available = Math.max(0, onHand - reserved)

    for (const [fieldName, formula] of Object.entries(row.formulas)) {
      ruleTraces.push({
        id: makeId('inv-rule', `${stableId}-${fieldName}`),
        itemId: stableId,
        worksheetName: row.worksheet,
        rowNumber: row.rowNumber,
        fieldName,
        formula,
        sourceRef: `${row.worksheet}!${row.styleRefs[fieldName]?.cell ?? row.sourceRef}`,
      })
    }

    return {
      id: stableId,
      workbookSourceId,
      sourceStock: row.stock,
      sourceMaximumQuantity: row.desiredStock,
      sourceReorderQuantity: row.reorderQuantity,
      name: row.description ?? row.sku ?? `Row ${row.rowNumber}`,
      categoryId,
      categoryName: row.category,
      subcategory: row.account ?? null,
      description: row.description,
      sku: row.sku,
      unitOfMeasureId: unitId,
      unitOfMeasureLabel: row.size,
      packageSizeRaw: row.size,
      locationId,
      locationName: row.worksheet,
      preferredSupplierId: supplierId,
      preferredSupplierName: row.supplier,
      unitCost: row.priceEach,
      quantityOnHand: onHand,
      quantityReserved: reserved,
      quantityAvailable: available,
      reorderLevel: row.reorderQuantity,
      desiredStock: row.desiredStock,
      quantityToPurchaseObserved: row.orderQuantity,
      active: true,
      countingInstructions: null,
      notes: row.notes,
      status: row.status === 'NEEDS_REVIEW' ? 'NEEDS_REVIEW' : 'ACTIVE',
      lastCountedAt: previousItem?.lastCountedAt ?? null,
      sourceTrace: {
        workbookName,
        worksheetName: row.worksheet,
        rowNumber: row.rowNumber,
        sourceRef: row.sourceRef,
        sourceValues: row.sourceValues,
        sourceFormulas: row.formulas,
        styleRefs: row.styleRefs,
      },
    }
  })

  const importedSourceIds = new Set(importedItems.map((item) => item.workbookSourceId))
  const removedItems = (previous?.items ?? [])
    .filter((item) => !importedSourceIds.has(item.workbookSourceId))
    .map((item) => ({
      ...item,
      active: false,
      status: 'INACTIVE' as const,
      quantityAvailable: Math.max(0, item.quantityOnHand - item.quantityReserved),
    }))

  const items = [...importedItems, ...removedItems]
  const recommendations = buildRecommendationList(items, previousRecommendations)

  return {
    importedAt,
    workbookName,
    items,
    categories: [...categoryMap.values()],
    locations: [...locationMap.values()],
    units: [...unitMap.values()],
    suppliers: [...supplierMap.values()],
    sessions: previousSessions,
    entries: previousEntries,
    recommendations,
    purchaseOrders: previousPurchaseOrders,
    cswDocuments: previousCswDocuments,
    adjustments: previousAdjustments,
    receipts: previousReceipts,
    activityLog: previousActivityLog,
    ruleTraces,
  }
}

const buildCountEntries = (state: InventoryFoundationState, sessionId: string): InventoryCountEntry[] => {
  return state.items
    .filter((item) => item.active)
    .sort((left, right) => {
      if (left.locationName !== right.locationName) {
        return left.locationName.localeCompare(right.locationName)
      }
      if (left.categoryName !== right.categoryName) {
        return left.categoryName.localeCompare(right.categoryName)
      }
      return left.name.localeCompare(right.name)
    })
    .map((item) => ({
      id: makeId('inv-entry', `${sessionId}-${item.id}`),
      sessionId,
      itemId: item.id,
      worksheetName: item.sourceTrace.worksheetName,
      locationName: item.locationName,
      categoryName: item.categoryName,
      previousOnHand: item.quantityOnHand,
      countedQuantity: null,
      status: 'DRAFT',
      discrepancyNotes: null,
      countNotes: null,
    }))
}

const applyApprovedSession = (state: InventoryFoundationState, session: InventoryCountSession): InventoryFoundationState => {
  const entryById = new Map(state.entries.map((entry) => [entry.id, entry]))
  const itemById = new Map(state.items.map((item) => [item.id, { ...item }]))
  const adjustments = [...state.adjustments]

  for (const entryId of session.entryIds) {
    const entry = entryById.get(entryId)
    if (!entry || entry.countedQuantity === null || entry.status !== 'COUNTED') continue
    const item = itemById.get(entry.itemId)
    if (!item) continue

    const delta = entry.countedQuantity - item.quantityOnHand
    item.quantityOnHand = entry.countedQuantity
    item.quantityAvailable = Math.max(0, item.quantityOnHand - item.quantityReserved)
    item.lastCountedAt = nowIso()

    if (delta !== 0) {
      adjustments.push({
        id: makeId('inv-adjust', `${session.id}-${entry.id}`),
        itemId: item.id,
        quantityDelta: delta,
        reason: entry.discrepancyNotes ?? 'Approved warehouse count adjustment.',
        occurredAt: nowIso(),
        sourceSessionId: session.id,
      })
    }
  }

  const updatedItems = [...itemById.values()]
  const recommendations = buildRecommendationList(updatedItems, state.recommendations)

  return {
    ...state,
    items: updatedItems,
    adjustments,
    recommendations,
  }
}

const appendActivityLogEntry = (
  state: InventoryFoundationState,
  input: {
    action: InventoryActivityLogEntry['action']
    sessionId: string
    message: string
  },
): InventoryActivityLogEntry[] => [
  {
    id: makeId('inv-activity', `${input.action}-${input.sessionId}-${nowIso()}`),
    occurredAt: nowIso(),
    action: input.action,
    sessionId: input.sessionId,
    message: input.message,
  },
  ...state.activityLog,
]

const buildPurchaseOrderDrafts = (state: InventoryFoundationState, requestedBy: string): PurchaseOrderDraft[] => {
  const eligibleRecommendations = state.recommendations.filter((recommendation) => {
    const orderQuantity = getRecommendationOrderQuantity(recommendation)
    return orderQuantity > 0 && (recommendation.status === 'RECOMMENDED' || recommendation.status === 'DIRECTOR_APPROVED' || recommendation.status === 'APPROVED_FOR_PURCHASE')
  })

  const groupedBySupplier = new Map<string, InventoryPurchaseRecommendation[]>()
  for (const recommendation of eligibleRecommendations) {
    const supplier = recommendation.supplier ?? 'Unassigned'
    const group = groupedBySupplier.get(supplier) ?? []
    group.push(recommendation)
    groupedBySupplier.set(supplier, group)
  }

  const existingDrafts = new Map(state.purchaseOrders.map((draft) => [draft.id, draft]))

  return [...groupedBySupplier.entries()].map(([supplier, recommendations], index) => {
    const draftId = makeId('po-draft', `${supplier}-${recommendations.map((recommendation) => recommendation.id).join('|')}`)
    const existingDraft = existingDrafts.get(draftId)
    const existingLineByRecommendationId = new Map(existingDraft?.lines.map((line) => [line.recommendationId ?? line.id, line]))

    const lines = recommendations.map((recommendation) => {
      const quantityOrdered = getRecommendationOrderQuantity(recommendation)
      const existingLine = existingLineByRecommendationId.get(recommendation.id)
      const quantityReceived = existingLine?.quantityReceived ?? 0
      const quantityRemaining = Math.max(0, quantityOrdered - quantityReceived)
      const unitPrice = recommendation.priceEach
      const subtotal = unitPrice !== null ? quantityOrdered * unitPrice : null

      return {
        id: makeId('po-line', `${draftId}-${recommendation.id}`),
        recommendationId: recommendation.id,
        inventoryItemId: recommendation.inventoryItemId,
        supplier: recommendation.supplier,
        account: recommendation.account,
        sku: recommendation.sku,
        description: recommendation.description,
        sizePackage: recommendation.sizePackage,
        quantityOrdered,
        quantityReceived,
        quantityRemaining,
        unitPrice,
        subtotal,
        sourceWorksheet: recommendation.sourceWorksheet,
        sourceRow: recommendation.sourceRow,
        sourceItemSnapshot: recommendation.item,
        notes: recommendation.notes,
        accountAllocation: {
          [recommendation.account ?? 'Unassigned']: subtotal ?? 0,
        },
        receipts: existingLine?.receipts ?? [],
      }
    })

    const total = lines.reduce((sum, line) => sum + (line.subtotal ?? 0), 0)
    const accountAllocation = lines.reduce<Record<string, number>>((allocation, line) => {
      const account = Object.keys(line.accountAllocation)[0] ?? 'Unassigned'
      allocation[account] = (allocation[account] ?? 0) + (line.subtotal ?? 0)
      return allocation
    }, {})

    return {
      id: draftId,
      poDraftNumber: existingDraft?.poDraftNumber ?? `PO-${todayDate()}-${String(index + 1).padStart(3, '0')}`,
      supplier,
      dateCreated: existingDraft?.dateCreated ?? nowIso(),
      requestedBy: existingDraft?.requestedBy ?? requestedBy,
      accountLabel: existingDraft?.accountLabel ?? supplier,
      accountAllocation,
      lines,
      total,
      notes: existingDraft?.notes ?? null,
      approvalStatus: existingDraft?.approvalStatus ?? 'DRAFT',
      approvalHistory: existingDraft?.approvalHistory ?? [{
        status: 'DRAFT',
        changedAt: nowIso(),
        changedBy: requestedBy,
        reason: 'Purchase order draft generated from inventory recommendations.',
      }],
      orderNotes: existingDraft?.orderNotes ?? [],
      receipts: existingDraft?.receipts ?? [],
      sourceInventoryCount: lines.length,
    }
  })
}

const buildCswDocument = (state: InventoryFoundationState, requestedBy: string): InventoryCswDocument => {
  const activeRecommendations = state.recommendations.filter((recommendation) => recommendation.status !== 'NOT_REQUIRED' && recommendation.status !== 'CANCELLED')
  const actionableRecommendations = activeRecommendations.filter((recommendation) => getRecommendationOrderQuantity(recommendation) > 0)
  const sourcePurchaseOrderIds = state.purchaseOrders.map((purchaseOrder) => purchaseOrder.id)
  const documentId = makeId('inv-csw', `${state.workbookName}-${activeRecommendations.map((recommendation) => recommendation.id).join('|')}-${sourcePurchaseOrderIds.join('|')}`)
  const existingDocument = state.cswDocuments.find((document) => document.id === documentId)

  const supplierSummaries = summarizeSupplierRecommendations(actionableRecommendations)
  const accountTotals = summarizeAccountAllocation(actionableRecommendations)
  const totalRecommendedPurchaseValue = actionableRecommendations.reduce((sum, recommendation) => sum + (recommendation.subtotal ?? 0), 0)
  const urgentOrZeroStockItems = activeRecommendations
    .filter((recommendation) => (recommendation.currentStock ?? 0) <= 0)
    .map((recommendation) => recommendation.item)
  const itemsWithInsufficientCountsOrMissingPricing = activeRecommendations
    .filter((recommendation) => recommendation.status === 'COUNT_REQUIRED' || recommendation.status === 'NEEDS_REVIEW' || recommendation.priceEach === null)
    .map((recommendation) => recommendation.item)

  return {
    id: documentId,
    title: 'Completed Staff Work: Inventory Purchase Recommendations',
    to: existingDocument?.to ?? 'Director of Operations',
    from: existingDocument?.from ?? requestedBy,
    date: existingDocument?.date ?? nowIso(),
    subject: 'Warehouse inventory purchase recommendations and PO drafts',
    inventoryDate: state.sessions[0]?.inventoryDate ?? state.importedAt.slice(0, 10),
    totalItemsCounted: state.items.filter((item) => item.active).length,
    recommendedItemCount: actionableRecommendations.length,
    needsReviewCount: activeRecommendations.filter((recommendation) => recommendation.status === 'COUNT_REQUIRED' || recommendation.status === 'NEEDS_REVIEW').length,
    suppliers: supplierSummaries,
    totalRecommendedPurchaseValue,
    accountAllocationTotals: accountTotals,
    urgentOrZeroStockItems,
    itemsWithInsufficientCountsOrMissingPricing,
    situation: `Workbook-backed inventory review for ${state.workbookName} includes ${actionableRecommendations.length} purchase recommendation line(s).`,
    dataSummary: `There are ${state.items.filter((item) => item.active).length} active inventory items and ${activeRecommendations.filter((recommendation) => recommendation.status === 'COUNT_REQUIRED' || recommendation.status === 'NEEDS_REVIEW').length} items needing review.`,
    evaluation: `Estimated purchase value is ${totalRecommendedPurchaseValue.toFixed(2)} across ${supplierSummaries.length} supplier group(s).`,
    purchaseSummary: supplierSummaries.length > 0 ? supplierSummaries.map((summary) => `${summary.supplier}: ${summary.lineItemCount} line(s) / ${summary.total.toFixed(2)}`).join('; ') : 'No purchase lines are ready for ordering.',
    accountSummary: Object.entries(accountTotals).length > 0 ? Object.entries(accountTotals).map(([account, total]) => `${account}: ${total.toFixed(2)}`).join('; ') : 'No account allocations calculated.',
    risksAndExceptions: itemsWithInsufficientCountsOrMissingPricing.length > 0 ? `${itemsWithInsufficientCountsOrMissingPricing.length} item(s) still need count confirmation, review, or pricing.` : 'No outstanding exceptions detected in the current recommendation set.',
    recommendation: actionableRecommendations.length > 0 ? 'Approve the CSW and release approved purchase orders for ordering.' : 'No purchase action is required from the current workbook state.',
    approvalStatus: existingDocument?.approvalStatus ?? 'PENDING',
    approvalSignatureName: existingDocument?.approvalSignatureName ?? null,
    approvalDate: existingDocument?.approvalDate ?? null,
    sourceRecommendationIds: activeRecommendations.map((recommendation) => recommendation.id),
    sourcePurchaseOrderIds,
  }
}

export class WarehouseInventoryImportService {
  load(): InventoryFoundationState | null {
    try {
      const serialized = window.localStorage.getItem(STORAGE_KEY)
      if (!serialized) return null
      return JSON.parse(serialized) as InventoryFoundationState
    } catch {
      return null
    }
  }

  save(state: InventoryFoundationState): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  importFromSeed(previous: InventoryFoundationState | null): InventoryFoundationState {
    return buildStateFromSeed(previous, WAREHOUSE_INVENTORY_SEED_ROWS)
  }

  recalculateRecommendations(state: InventoryFoundationState): InventoryFoundationState {
    return {
      ...state,
      recommendations: state.items.filter((item) => item.active).map(computeRecommendation),
    }
  }

  reserveItem(state: InventoryFoundationState, itemId: string, quantity: number): InventoryFoundationState {
    if (quantity <= 0) {
      throw new Error('Reserve quantity must be greater than zero.')
    }

    const nextItems = state.items.map((item) => {
      if (item.id !== itemId) return item
      if (item.quantityAvailable < quantity) {
        throw new Error(`Insufficient available inventory for ${item.name}.`)
      }
      const reserved = item.quantityReserved + quantity
      return {
        ...item,
        quantityReserved: reserved,
        quantityAvailable: Math.max(0, item.quantityOnHand - reserved),
      }
    })

    return {
      ...state,
      items: nextItems,
      recommendations: buildRecommendationList(nextItems, state.recommendations),
    }
  }

  releaseItem(state: InventoryFoundationState, itemId: string, quantity: number): InventoryFoundationState {
    if (quantity <= 0) {
      throw new Error('Release quantity must be greater than zero.')
    }

    const nextItems = state.items.map((item) => {
      if (item.id !== itemId) return item
      if (item.quantityReserved < quantity) {
        throw new Error(`Cannot release more than reserved quantity for ${item.name}.`)
      }
      const reserved = item.quantityReserved - quantity
      return {
        ...item,
        quantityReserved: reserved,
        quantityAvailable: Math.max(0, item.quantityOnHand - reserved),
      }
    })

    return {
      ...state,
      items: nextItems,
      recommendations: buildRecommendationList(nextItems, state.recommendations),
    }
  }

  startWarehouseCount(state: InventoryFoundationState, inventoryDate = todayDate()): InventoryFoundationState {
    const existingOpenSession = state.sessions.find((session) => session.status === 'IN_PROGRESS' || session.status === 'PAUSED')
    if (existingOpenSession) {
      throw new Error('A count session is already active. Pause, complete, cancel, or reset it before starting a new session.')
    }

    const sessionId = makeId('inv-session', `${inventoryDate}-${state.sessions.length + 1}`)
    const sessionEntries = buildCountEntries(state, sessionId)

    const session: InventoryCountSession = {
      id: sessionId,
      startedAt: nowIso(),
      inventoryDate,
      status: 'IN_PROGRESS',
      worksheetNames: [...new Set(sessionEntries.map((entry) => entry.worksheetName))],
      locationNames: [...new Set(sessionEntries.map((entry) => entry.locationName))],
      categoryNames: [...new Set(sessionEntries.map((entry) => entry.categoryName))],
      entryIds: sessionEntries.map((entry) => entry.id),
      submittedAt: null,
      approvedAt: null,
      pausedAt: null,
      resumedAt: null,
      completedAt: null,
      cancelledAt: null,
    }

    return {
      ...state,
      sessions: [session, ...state.sessions],
      entries: [...sessionEntries, ...state.entries],
      activityLog: appendActivityLogEntry(state, {
        action: 'COUNT_SESSION_STARTED',
        sessionId,
        message: `Count session started for ${inventoryDate}.`,
      }),
    }
  }

  pauseCountSession(state: InventoryFoundationState, sessionId: string): InventoryFoundationState {
    const session = state.sessions.find((candidate) => candidate.id === sessionId)
    if (!session) throw new Error('Count session not found.')
    if (session.status !== 'IN_PROGRESS') throw new Error('Only in-progress sessions can be paused.')

    const pausedAt = nowIso()
    return {
      ...state,
      sessions: state.sessions.map((candidate) => candidate.id === sessionId
        ? { ...candidate, status: 'PAUSED', pausedAt }
        : candidate),
      activityLog: appendActivityLogEntry(state, {
        action: 'COUNT_SESSION_PAUSED',
        sessionId,
        message: `Count session paused on ${pausedAt}.`,
      }),
    }
  }

  resumeCountSession(state: InventoryFoundationState, sessionId: string): InventoryFoundationState {
    const session = state.sessions.find((candidate) => candidate.id === sessionId)
    if (!session) throw new Error('Count session not found.')
    if (session.status !== 'PAUSED') throw new Error('Only paused sessions can be resumed.')

    const resumedAt = nowIso()
    return {
      ...state,
      sessions: state.sessions.map((candidate) => candidate.id === sessionId
        ? { ...candidate, status: 'IN_PROGRESS', resumedAt }
        : candidate),
      activityLog: appendActivityLogEntry(state, {
        action: 'COUNT_SESSION_RESUMED',
        sessionId,
        message: `Count session resumed on ${resumedAt}.`,
      }),
    }
  }

  completeCountSession(state: InventoryFoundationState, sessionId: string): InventoryFoundationState {
    const session = state.sessions.find((candidate) => candidate.id === sessionId)
    if (!session) throw new Error('Count session not found.')
    if (session.status !== 'IN_PROGRESS' && session.status !== 'PAUSED') {
      throw new Error('Only in-progress or paused sessions can be completed.')
    }

    const completedSession: InventoryCountSession = {
      ...session,
      status: 'COMPLETED',
      completedAt: nowIso(),
    }

    const withCompletedSession: InventoryFoundationState = {
      ...state,
      sessions: state.sessions.map((candidate) => candidate.id === sessionId ? completedSession : candidate),
    }
    const withAppliedCounts = applyApprovedSession(withCompletedSession, completedSession)

    return {
      ...withAppliedCounts,
      activityLog: appendActivityLogEntry(withAppliedCounts, {
        action: 'COUNT_SESSION_COMPLETED',
        sessionId,
        message: `Count session completed and approved counts were applied for ${completedSession.inventoryDate}.`,
      }),
    }
  }

  cancelCountSession(state: InventoryFoundationState, sessionId: string): InventoryFoundationState {
    const session = state.sessions.find((candidate) => candidate.id === sessionId)
    if (!session) throw new Error('Count session not found.')
    if (session.status !== 'IN_PROGRESS' && session.status !== 'PAUSED') {
      throw new Error('Only in-progress or paused sessions can be cancelled.')
    }

    const cancelledAt = nowIso()
    return {
      ...state,
      sessions: state.sessions.map((candidate) => candidate.id === sessionId
        ? { ...candidate, status: 'CANCELLED', cancelledAt }
        : candidate),
      activityLog: appendActivityLogEntry(state, {
        action: 'COUNT_SESSION_CANCELLED',
        sessionId,
        message: `Count session cancelled on ${cancelledAt}. Entered counts were retained for audit.`,
      }),
    }
  }

  resetCountSession(state: InventoryFoundationState, sessionId: string): InventoryFoundationState {
    const session = state.sessions.find((candidate) => candidate.id === sessionId)
    if (!session) throw new Error('Count session not found.')
    if (session.status === 'COMPLETED' || session.status === 'APPROVED') {
      throw new Error('Completed sessions cannot be reset.')
    }

    const entryIds = new Set(session.entryIds)
    return {
      ...state,
      entries: state.entries.map((entry) => {
        if (!entryIds.has(entry.id)) return entry
        return {
          ...entry,
          countedQuantity: null,
          status: 'DRAFT',
          countNotes: null,
          discrepancyNotes: null,
        }
      }),
      activityLog: appendActivityLogEntry(state, {
        action: 'COUNT_SESSION_RESET',
        sessionId,
        message: `Count session reset. Draft counts were cleared for ${session.inventoryDate}.`,
      }),
    }
  }

  updateCountEntry(
    state: InventoryFoundationState,
    entryId: string,
    input: {
      countedQuantity: number | null
      status: InventoryCountEntry['status']
      countNotes?: string
      discrepancyNotes?: string
    },
  ): InventoryFoundationState {
    return {
      ...state,
      entries: state.entries.map((entry) => {
        if (entry.id !== entryId) return entry
        return {
          ...entry,
          countedQuantity: input.countedQuantity,
          status: input.status,
          countNotes: input.countNotes ?? entry.countNotes,
          discrepancyNotes: input.discrepancyNotes ?? entry.discrepancyNotes,
        }
      }),
    }
  }

  submitCountSession(state: InventoryFoundationState, sessionId: string): InventoryFoundationState {
    return {
      ...state,
      sessions: state.sessions.map((session) => {
        if (session.id !== sessionId) return session
        return {
          ...session,
          status: 'SUBMITTED',
          submittedAt: nowIso(),
        }
      }),
    }
  }

  approveCountSession(state: InventoryFoundationState, sessionId: string): InventoryFoundationState {
    const session = state.sessions.find((candidate) => candidate.id === sessionId)
    if (!session) {
      throw new Error('Count session not found.')
    }

    const approvedSession: InventoryCountSession = {
      ...session,
      status: 'APPROVED',
      approvedAt: nowIso(),
    }

    const nextState = {
      ...state,
      sessions: state.sessions.map((candidate) => candidate.id === sessionId ? approvedSession : candidate),
    }

    return applyApprovedSession(nextState, approvedSession)
  }

  approveRecommendation(
    state: InventoryFoundationState,
    recommendationId: string,
    input: { approvedBy: string; quantity?: number | null; reason?: string | null },
  ): InventoryFoundationState {
    const approvalHistoryEntry = {
      status: 'APPROVED' as PurchaseApprovalStatus,
      approvedAt: nowIso(),
      approvedBy: input.approvedBy,
      reason: input.reason ?? null,
      quantity: input.quantity ?? null,
    }

    return {
      ...state,
      recommendations: state.recommendations.map((recommendation) => {
        if (recommendation.id !== recommendationId) return recommendation
        return {
          ...recommendation,
          reviewedQuantity: input.quantity ?? recommendation.reviewedQuantity ?? recommendation.suggestedPurchaseQuantity,
          reviewedReason: input.reason ?? recommendation.reviewedReason,
          approvalStatus: 'APPROVED',
          status: 'DIRECTOR_APPROVED',
          approvalHistory: [approvalHistoryEntry, ...recommendation.approvalHistory],
        }
      }),
    }
  }

  rejectRecommendation(
    state: InventoryFoundationState,
    recommendationId: string,
    input: { rejectedBy: string; reason?: string | null },
  ): InventoryFoundationState {
    const rejectionHistoryEntry = {
      status: 'REJECTED' as PurchaseApprovalStatus,
      approvedAt: nowIso(),
      approvedBy: input.rejectedBy,
      reason: input.reason ?? null,
      quantity: null,
    }

    return {
      ...state,
      recommendations: state.recommendations.map((recommendation) => {
        if (recommendation.id !== recommendationId) return recommendation
        return {
          ...recommendation,
          reviewedReason: input.reason ?? recommendation.reviewedReason,
          approvalStatus: 'REJECTED',
          status: 'REJECTED',
          approvalHistory: [rejectionHistoryEntry, ...recommendation.approvalHistory],
        }
      }),
    }
  }

  createPurchaseOrderDrafts(state: InventoryFoundationState, requestedBy = 'Inventory Control'): InventoryFoundationState {
    const nextDrafts = buildPurchaseOrderDrafts(state, requestedBy)
    const nextDraftIds = new Set(nextDrafts.map((draft) => draft.id))
    return {
      ...state,
      purchaseOrders: [
        ...nextDrafts,
        ...state.purchaseOrders.filter((purchaseOrder) => !nextDraftIds.has(purchaseOrder.id)),
      ],
    }
  }

  generateCswDocument(state: InventoryFoundationState, requestedBy = 'Inventory Control'): InventoryFoundationState {
    const nextDocument = buildCswDocument(state, requestedBy)
    const existingIndex = state.cswDocuments.findIndex((document) => document.id === nextDocument.id)
    const cswDocuments = existingIndex >= 0
      ? state.cswDocuments.map((document, index) => index === existingIndex ? nextDocument : document)
      : [nextDocument, ...state.cswDocuments]

    return {
      ...state,
      cswDocuments,
    }
  }

  approveCswDocument(
    state: InventoryFoundationState,
    documentId: string,
    input: { approvedBy: string; reason?: string | null },
  ): InventoryFoundationState {
    const approvedAt = nowIso()
    const document = state.cswDocuments.find((candidate) => candidate.id === documentId)
    const sourceRecommendationIds = new Set(document?.sourceRecommendationIds ?? [])
    const sourcePurchaseOrderIds = new Set(document?.sourcePurchaseOrderIds ?? [])
    return {
      ...state,
      cswDocuments: state.cswDocuments.map((document) => {
        if (document.id !== documentId) return document
        return {
          ...document,
          approvalStatus: 'APPROVED',
          approvalSignatureName: input.approvedBy,
          approvalDate: approvedAt,
        }
      }),
      recommendations: state.recommendations.map((recommendation) => {
        if (!sourceRecommendationIds.has(recommendation.id)) return recommendation
        return {
          ...recommendation,
          approvalStatus: 'APPROVED',
          status: 'APPROVED_FOR_PURCHASE',
          approvalHistory: [{
            status: 'APPROVED' as PurchaseApprovalStatus,
            approvedAt,
            approvedBy: input.approvedBy,
            reason: input.reason ?? null,
            quantity: recommendation.reviewedQuantity ?? recommendation.suggestedPurchaseQuantity ?? null,
          }, ...recommendation.approvalHistory],
        }
      }),
      purchaseOrders: state.purchaseOrders.map((purchaseOrder) => {
        if (!sourcePurchaseOrderIds.has(purchaseOrder.id)) return purchaseOrder
        return {
          ...purchaseOrder,
          approvalStatus: purchaseOrder.approvalStatus === 'DRAFT' ? 'APPROVED' : purchaseOrder.approvalStatus,
          approvalHistory: [{
            status: 'APPROVED',
            changedAt: approvedAt,
            changedBy: input.approvedBy,
            reason: input.reason ?? null,
          }, ...purchaseOrder.approvalHistory],
        }
      }),
    }
  }

  rejectCswDocument(
    state: InventoryFoundationState,
    documentId: string,
    input: { rejectedBy: string; reason?: string | null },
  ): InventoryFoundationState {
    const rejectedAt = nowIso()
    return {
      ...state,
      cswDocuments: state.cswDocuments.map((document) => {
        if (document.id !== documentId) return document
        return {
          ...document,
          approvalStatus: 'DISAPPROVED',
          approvalSignatureName: input.rejectedBy,
          approvalDate: rejectedAt,
        }
      }),
    }
  }

  markPurchaseOrderOrdered(
    state: InventoryFoundationState,
    purchaseOrderId: string,
    input: { orderedBy: string; notes?: string | null },
  ): InventoryFoundationState {
    const orderedAt = nowIso()
    return {
      ...state,
      purchaseOrders: state.purchaseOrders.map((purchaseOrder) => {
        if (purchaseOrder.id !== purchaseOrderId) return purchaseOrder
        return {
          ...purchaseOrder,
          approvalStatus: 'ORDERED',
          approvalHistory: [{
            status: 'ORDERED',
            changedAt: orderedAt,
            changedBy: input.orderedBy,
            reason: input.notes ?? null,
          }, ...purchaseOrder.approvalHistory],
        }
      }),
      recommendations: state.recommendations.map((recommendation) => {
        if (!state.purchaseOrders.some((purchaseOrder) => purchaseOrder.id === purchaseOrderId && purchaseOrder.lines.some((line) => line.recommendationId === recommendation.id))) {
          return recommendation
        }
        return {
          ...recommendation,
          status: 'ORDERED',
        }
      }),
    }
  }

  recordReceipt(
    state: InventoryFoundationState,
    input: { purchaseOrderId: string; lineId: string; quantityReceived: number; receivedBy: string; notes?: string | null },
  ): InventoryFoundationState {
    if (input.quantityReceived <= 0) {
      throw new Error('Receipt quantity must be greater than zero.')
    }

    const receivedAt = nowIso()
    const receiptId = makeId('inv-receipt', `${input.purchaseOrderId}-${input.lineId}-${receivedAt}`)
    const itemById = new Map(state.items.map((item) => [item.id, { ...item }]))
    const recommendationById = new Map(state.recommendations.map((recommendation) => [recommendation.id, { ...recommendation }]))
    const receiptStatusByRecommendationId = new Map<string, InventoryPurchaseRecommendation['status']>()

    const purchaseOrders = state.purchaseOrders.map((purchaseOrder) => {
      if (purchaseOrder.id !== input.purchaseOrderId) return purchaseOrder

      const lines = purchaseOrder.lines.map((line) => {
        if (line.id !== input.lineId) return line

        const receivedQuantity = line.quantityReceived + input.quantityReceived
        const quantityRemaining = Math.max(0, line.quantityOrdered - receivedQuantity)
        const receipts = [...line.receipts, {
          id: receiptId,
          receivedAt,
          quantityReceived: input.quantityReceived,
          notes: input.notes ?? null,
        }]

        const item = itemById.get(line.inventoryItemId)
        if (item) {
          item.quantityOnHand += input.quantityReceived
          item.quantityAvailable = Math.max(0, item.quantityOnHand - item.quantityReserved)
        }

        const recommendation = line.recommendationId ? recommendationById.get(line.recommendationId) : null
        if (recommendation) {
          const nextStatus = quantityRemaining > 0 ? 'PARTIALLY_RECEIVED' : 'RECEIVED'
          recommendation.status = nextStatus
          receiptStatusByRecommendationId.set(recommendation.id, nextStatus)
        }

        return {
          ...line,
          quantityReceived: receivedQuantity,
          quantityRemaining,
          receipts,
        }
      })

      const receipt = {
        id: receiptId,
        purchaseOrderId: purchaseOrder.id,
        purchaseOrderLineId: input.lineId,
        itemId: lines.find((line) => line.id === input.lineId)?.inventoryItemId ?? null,
        supplierId: null,
        quantityReceived: input.quantityReceived,
        quantityRemaining: lines.find((line) => line.id === input.lineId)?.quantityRemaining ?? null,
        receivedAt,
        notes: input.notes ?? null,
      }

      const allReceived = lines.every((line) => line.quantityRemaining === 0)

      return {
        ...purchaseOrder,
        lines,
        receipts: [...purchaseOrder.receipts, receipt],
        approvalStatus: allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED',
      } as PurchaseOrderDraft
    })

    const nextItems = [...itemById.values()]
    const nextRecommendations = buildRecommendationList(nextItems, [...recommendationById.values()]).map((recommendation) => {
      const nextStatus = receiptStatusByRecommendationId.get(recommendation.id)
      return nextStatus ? { ...recommendation, status: nextStatus } : recommendation
    })

    return {
      ...state,
      items: nextItems,
      purchaseOrders,
      receipts: [
        {
          id: receiptId,
          purchaseOrderId: input.purchaseOrderId,
          purchaseOrderLineId: input.lineId,
          itemId: purchaseOrders.find((purchaseOrder) => purchaseOrder.id === input.purchaseOrderId)?.lines.find((line) => line.id === input.lineId)?.inventoryItemId ?? '',
          supplierId: null,
          quantityReceived: input.quantityReceived,
          quantityRemaining: purchaseOrders.find((purchaseOrder) => purchaseOrder.id === input.purchaseOrderId)?.lines.find((line) => line.id === input.lineId)?.quantityRemaining ?? null,
          receivedAt,
          notes: input.notes ?? null,
        },
        ...state.receipts,
      ],
      recommendations: nextRecommendations,
    }
  }
}
