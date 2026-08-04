import {
  WAREHOUSE_INVENTORY_SEED_ROWS,
  WAREHOUSE_INVENTORY_WORKBOOK_NAME,
} from '../data/warehouseInventoryWorkbookSeed'
import type {
  InventoryCategory,
  InventoryCountEntry,
  InventoryCountSession,
  InventoryFoundationState,
  InventoryItem,
  InventoryLocation,
  InventoryPurchaseRecommendation,
  InventoryRuleTrace,
  InventorySupplier,
  InventoryUnitOfMeasure,
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

const computeRecommendation = (item: InventoryItem): InventoryPurchaseRecommendation => {
  const available = item.quantityAvailable
  const shortageFromDesired = item.desiredStock !== null ? Math.max(0, item.desiredStock - available) : 0

  if (item.desiredStock !== null) {
    return {
      id: makeId('inv-reco', item.id),
      itemId: item.id,
      worksheetName: item.sourceTrace.worksheetName,
      rowNumber: item.sourceTrace.rowNumber,
      availableQuantity: available,
      observedShortage: shortageFromDesired,
      desiredStock: item.desiredStock,
      reorderLevel: item.reorderLevel,
      suggestedPurchaseQuantity: shortageFromDesired,
      status: shortageFromDesired > 0 ? 'READY' : 'READY',
      rationale: 'Suggested purchase derived from confirmed desired/max stock minus available quantity.',
    }
  }

  if (item.reorderLevel !== null && available < item.reorderLevel) {
    return {
      id: makeId('inv-reco', item.id),
      itemId: item.id,
      worksheetName: item.sourceTrace.worksheetName,
      rowNumber: item.sourceTrace.rowNumber,
      availableQuantity: available,
      observedShortage: Math.max(0, item.reorderLevel - available),
      desiredStock: null,
      reorderLevel: item.reorderLevel,
      suggestedPurchaseQuantity: null,
      status: 'NEEDS_REVIEW',
      rationale: 'Reorder threshold exists but no confirmed desired stock quantity. No guessed purchase quantity created.',
    }
  }

  return {
    id: makeId('inv-reco', item.id),
    itemId: item.id,
    worksheetName: item.sourceTrace.worksheetName,
    rowNumber: item.sourceTrace.rowNumber,
    availableQuantity: available,
    observedShortage: 0,
    desiredStock: item.desiredStock,
    reorderLevel: item.reorderLevel,
    suggestedPurchaseQuantity: null,
    status: 'NEEDS_REVIEW',
    rationale: 'No confirmed reorder trigger detected for this row. Recommendation is deferred for review.',
  }
}

const buildStateFromSeed = (
  previous: InventoryFoundationState | null,
  seedRows: WarehouseInventorySeedRow[],
): InventoryFoundationState => {
  const importedAt = nowIso()
  const workbookName = WAREHOUSE_INVENTORY_WORKBOOK_NAME

  const previousItemByWorkbookSourceId = new Map(previous?.items.map((item) => [item.workbookSourceId, item]))
  const previousReservedByItemId = new Map(previous?.items.map((item) => [item.id, item.quantityReserved]))

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
  const recommendations = items
    .filter((item) => item.active)
    .map(computeRecommendation)

  return {
    importedAt,
    workbookName,
    items,
    categories: [...categoryMap.values()],
    locations: [...locationMap.values()],
    units: [...unitMap.values()],
    suppliers: [...supplierMap.values()],
    sessions: previous?.sessions ?? [],
    entries: previous?.entries ?? [],
    recommendations,
    adjustments: previous?.adjustments ?? [],
    receipts: previous?.receipts ?? [],
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
    if (!entry || entry.countedQuantity === null) continue
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
  const recommendations = updatedItems.filter((item) => item.active).map(computeRecommendation)

  return {
    ...state,
    items: updatedItems,
    adjustments,
    recommendations,
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
      recommendations: nextItems.filter((item) => item.active).map(computeRecommendation),
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
      recommendations: nextItems.filter((item) => item.active).map(computeRecommendation),
    }
  }

  startWarehouseCount(state: InventoryFoundationState, inventoryDate = todayDate()): InventoryFoundationState {
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
    }

    return {
      ...state,
      sessions: [session, ...state.sessions],
      entries: [...sessionEntries, ...state.entries],
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
}
