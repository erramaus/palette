import { describe, expect, it } from 'vitest'
import { WarehouseInventoryImportService } from './WarehouseInventoryImportService'

const createLocalStorageMock = () => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  }
}

describe('WarehouseInventoryImportService', () => {
  it('preserves stable IDs across repeated imports', () => {
    const service = new WarehouseInventoryImportService()
    const first = service.importFromSeed(null)
    const second = service.importFromSeed(first)

    const firstIds = new Set(first.items.map((item) => item.id))
    const secondIds = new Set(second.items.map((item) => item.id))
    expect(secondIds).toEqual(firstIds)
  })

  it('imports all worksheet line items and flags ambiguous rows as NEEDS_REVIEW', () => {
    const service = new WarehouseInventoryImportService()
    const state = service.importFromSeed(null)

    expect(state.items.length).toBe(442)
    expect(state.items.filter((item) => item.status === 'NEEDS_REVIEW').length).toBe(11)
  })

  it('marks removed source items inactive instead of deleting them', () => {
    const service = new WarehouseInventoryImportService()
    const initial = service.importFromSeed(null)

    const syntheticRemoved = {
      ...initial.items[0],
      id: 'inv-item-removed-test',
      workbookSourceId: 'Warehouse Inventory 2026-07-08.xlsx|Unit Z|999',
      active: true,
      status: 'ACTIVE' as const,
    }

    const withSynthetic = {
      ...initial,
      items: [syntheticRemoved, ...initial.items],
    }

    const imported = service.importFromSeed(withSynthetic)
    const removed = imported.items.find((item) => item.id === 'inv-item-removed-test')

    expect(removed).toBeDefined()
    expect(removed?.active).toBe(false)
    expect(removed?.status).toBe('INACTIVE')
  })

  it('does not update stock while count session is draft/in-progress', () => {
    const service = new WarehouseInventoryImportService()
    const imported = service.importFromSeed(null)
    const beforeItem = imported.items[0]

    const withSession = service.startWarehouseCount(imported, '2026-08-03')
    const firstEntry = withSession.entries.find((entry) => entry.itemId === beforeItem.id)
    expect(firstEntry).toBeDefined()

    const updated = service.updateCountEntry(withSession, firstEntry!.id, {
      countedQuantity: beforeItem.quantityOnHand + 10,
      status: 'COUNTED',
      countNotes: 'Cycle count test',
    })

    const sameItem = updated.items.find((item) => item.id === beforeItem.id)
    expect(sameItem?.quantityOnHand).toBe(beforeItem.quantityOnHand)
  })

  it('updates stock only after completed count session', () => {
    const service = new WarehouseInventoryImportService()
    const imported = service.importFromSeed(null)
    const beforeItem = imported.items[0]

    const withSession = service.startWarehouseCount(imported, '2026-08-03')
    const firstEntry = withSession.entries.find((entry) => entry.itemId === beforeItem.id)
    expect(firstEntry).toBeDefined()

    const counted = service.updateCountEntry(withSession, firstEntry!.id, {
      countedQuantity: beforeItem.quantityOnHand + 5,
      status: 'COUNTED',
    })
    const completed = service.completeCountSession(counted, withSession.sessions[0].id)

    const afterItem = completed.items.find((item) => item.id === beforeItem.id)
    expect(afterItem?.quantityOnHand).toBe(beforeItem.quantityOnHand + 5)
  })

  it('pauses and resumes a count session without changing inventory quantities', () => {
    const service = new WarehouseInventoryImportService()
    const imported = service.importFromSeed(null)
    const beforeItem = imported.items[0]

    const started = service.startWarehouseCount(imported, '2026-08-03')
    const paused = service.pauseCountSession(started, started.sessions[0].id)
    const resumed = service.resumeCountSession(paused, paused.sessions[0].id)

    expect(paused.sessions[0].status).toBe('PAUSED')
    expect(resumed.sessions[0].status).toBe('IN_PROGRESS')
    expect(resumed.items[0].quantityOnHand).toBe(beforeItem.quantityOnHand)
  })

  it('cancels a count session and keeps entered counts for audit without updating inventory', () => {
    const service = new WarehouseInventoryImportService()
    const imported = service.importFromSeed(null)
    const beforeItem = imported.items[0]

    const started = service.startWarehouseCount(imported, '2026-08-03')
    const firstEntry = started.entries.find((entry) => entry.itemId === beforeItem.id)
    expect(firstEntry).toBeDefined()

    const updated = service.updateCountEntry(started, firstEntry!.id, {
      countedQuantity: beforeItem.quantityOnHand + 8,
      status: 'COUNTED',
      countNotes: 'Audit retained on cancel',
    })
    const cancelled = service.cancelCountSession(updated, started.sessions[0].id)

    const cancelledEntry = cancelled.entries.find((entry) => entry.id === firstEntry!.id)
    const afterItem = cancelled.items.find((item) => item.id === beforeItem.id)

    expect(cancelled.sessions[0].status).toBe('CANCELLED')
    expect(cancelledEntry?.countedQuantity).toBe(beforeItem.quantityOnHand + 8)
    expect(afterItem?.quantityOnHand).toBe(beforeItem.quantityOnHand)
  })

  it('resets a non-completed session by clearing draft counts only', () => {
    const service = new WarehouseInventoryImportService()
    const imported = service.importFromSeed(null)

    const started = service.startWarehouseCount(imported, '2026-08-03')
    const firstEntry = started.entries[0]
    const updated = service.updateCountEntry(started, firstEntry.id, {
      countedQuantity: firstEntry.previousOnHand + 3,
      status: 'COUNTED',
      countNotes: 'Temporary draft',
    })

    const reset = service.resetCountSession(updated, started.sessions[0].id)
    const resetEntry = reset.entries.find((entry) => entry.id === firstEntry.id)

    expect(resetEntry?.countedQuantity).toBeNull()
    expect(resetEntry?.status).toBe('DRAFT')
    expect(resetEntry?.countNotes).toBeNull()
  })

  it('reduces available quantity when reserving stock', () => {
    const service = new WarehouseInventoryImportService()
    const imported = service.importFromSeed(null)
    const candidate = imported.items.find((item) => item.quantityAvailable >= 1)
    expect(candidate).toBeDefined()

    const reserved = service.reserveItem(imported, candidate!.id, 1)
    const after = reserved.items.find((item) => item.id === candidate!.id)

    expect(after?.quantityReserved).toBe(candidate!.quantityReserved + 1)
    expect(after?.quantityAvailable).toBe(candidate!.quantityAvailable - 1)
  })

  it('calculates suggested purchase from desired stock minus available and clamps at zero', () => {
    const service = new WarehouseInventoryImportService()
    const imported = service.importFromSeed(null)
    const candidate = imported.items.find((item) => item.desiredStock !== null)
    expect(candidate).toBeDefined()

    const baseRecommendation = imported.recommendations.find((recommendation) => recommendation.itemId === candidate!.id)
    expect(baseRecommendation).toBeDefined()
    expect(baseRecommendation?.suggestedPurchaseQuantity).toBe(
      Math.max(0, (candidate?.desiredStock ?? 0) - candidate!.quantityAvailable),
    )

    const enoughStock = {
      ...imported,
      items: imported.items.map((item) => item.id === candidate!.id ? {
        ...item,
        quantityOnHand: (item.desiredStock ?? 0) + 10,
        quantityAvailable: (item.desiredStock ?? 0) + 10 - item.quantityReserved,
      } : item),
    }
    const reimported = service.importFromSeed(enoughStock)
    const reloadedCandidate = reimported.items.find((item) => item.id === candidate!.id)
    const reloadedRecommendation = reimported.recommendations.find((recommendation) => recommendation.itemId === candidate!.id)

    expect(reloadedCandidate).toBeDefined()
    expect(reloadedRecommendation).toBeDefined()
    expect(reloadedRecommendation?.suggestedPurchaseQuantity).toBe(
      Math.max(0, (reloadedCandidate?.desiredStock ?? 0) - (reloadedCandidate?.quantityAvailable ?? 0)),
    )
  })

  it('does not guess reorder quantities when desired stock is missing', () => {
    const service = new WarehouseInventoryImportService()
    const imported = service.importFromSeed(null)

    const item = imported.items.find((candidate) => candidate.desiredStock !== null)
    expect(item).toBeDefined()

    const mutated = {
      ...imported,
      items: imported.items.map((candidate) => candidate.id === item!.id ? {
        ...candidate,
        desiredStock: null,
        reorderLevel: Math.max(1, candidate.quantityAvailable + 5),
      } : candidate),
    }

    const recomputed = service.recalculateRecommendations(mutated)
    const recommendation = recomputed.recommendations.find((candidate) => candidate.itemId === item!.id)

    expect(recommendation).toBeDefined()
    expect(recommendation?.status).toBe('NEEDS_REVIEW')
    expect(recommendation?.suggestedPurchaseQuantity).toBeNull()
  })

  it('creates PO drafts and a CSW from approved recommendations', () => {
    const service = new WarehouseInventoryImportService()
    const imported = service.importFromSeed(null)
    const recommendation = imported.recommendations.find((candidate) => (candidate.suggestedPurchaseQuantity ?? 0) > 0)

    expect(recommendation).toBeDefined()

    const approved = service.approveRecommendation(imported, recommendation!.id, {
      approvedBy: 'Test Director',
      quantity: recommendation?.suggestedPurchaseQuantity ?? null,
      reason: 'Approved for test coverage.',
    })
    const withDrafts = service.createPurchaseOrderDrafts(approved, 'Test Director')
    const withCsw = service.generateCswDocument(withDrafts, 'Test Director')

    expect(withDrafts.purchaseOrders.length).toBeGreaterThan(0)
    expect(withDrafts.purchaseOrders[0].lines.length).toBeGreaterThan(0)
    expect(withCsw.cswDocuments.length).toBeGreaterThan(0)
    expect(withCsw.cswDocuments[0].sourceRecommendationIds.length).toBeGreaterThan(0)
  })

  it('records receipts and updates purchase order and inventory quantities', () => {
    const service = new WarehouseInventoryImportService()
    const imported = service.importFromSeed(null)
    const recommendation = imported.recommendations.find((candidate) => (candidate.suggestedPurchaseQuantity ?? 0) > 0)

    expect(recommendation).toBeDefined()

    const approved = service.approveRecommendation(imported, recommendation!.id, {
      approvedBy: 'Test Director',
      quantity: recommendation?.suggestedPurchaseQuantity ?? null,
    })
    const withDrafts = service.createPurchaseOrderDrafts(approved, 'Test Director')
    const purchaseOrder = withDrafts.purchaseOrders[0]
    const line = purchaseOrder.lines[0]
    const beforeQuantity = withDrafts.items.find((candidate) => candidate.id === line.inventoryItemId)?.quantityOnHand ?? 0

    const received = service.recordReceipt(withDrafts, {
      purchaseOrderId: purchaseOrder.id,
      lineId: line.id,
      quantityReceived: 1,
      receivedBy: 'Test Receiver',
      notes: 'Partial receipt for test coverage.',
    })

    const updatedOrder = received.purchaseOrders.find((candidate) => candidate.id === purchaseOrder.id)
    const updatedItem = received.items.find((candidate) => candidate.id === line.inventoryItemId)

    expect(updatedOrder?.approvalStatus).toBe('PARTIALLY_RECEIVED')
    expect(updatedOrder?.lines[0].quantityReceived).toBe(1)
    expect(updatedItem?.quantityOnHand).toBe(beforeQuantity + 1)
    expect(received.receipts[0].quantityReceived).toBe(1)
  })

  it('persists and reloads without duplicate records', () => {
    const localStorage = createLocalStorageMock()
    ;(globalThis as unknown as { window: { localStorage: ReturnType<typeof createLocalStorageMock> } }).window = {
      localStorage,
    }

    const service = new WarehouseInventoryImportService()
    const imported = service.importFromSeed(null)
    const withSession = service.startWarehouseCount(imported, '2026-08-03')

    service.save(withSession)
    const loaded = service.load()
    expect(loaded).not.toBeNull()

    const reimported = service.importFromSeed(loaded)
    const uniqueIds = new Set(reimported.items.map((item) => item.id))

    expect(uniqueIds.size).toBe(reimported.items.length)
    expect(reimported.sessions.length).toBe(withSession.sessions.length)
    expect(reimported.entries.length).toBe(withSession.entries.length)
  })

  it('recovers from legacy persisted inventory state with missing list fields', () => {
    const service = new WarehouseInventoryImportService()

    const legacyState = {
      importedAt: '2026-01-01T00:00:00.000Z',
      workbookName: 'legacy-snapshot',
    } as unknown as import('../types/inventory').InventoryFoundationState

    expect(() => service.importFromSeed(legacyState)).not.toThrow()

    const imported = service.importFromSeed(legacyState)
    expect(imported.items.length).toBeGreaterThan(0)
    expect(imported.purchaseOrders).toEqual([])
    expect(imported.cswDocuments).toEqual([])
    expect(imported.sessions).toEqual([])
    expect(imported.entries).toEqual([])
  })
})
