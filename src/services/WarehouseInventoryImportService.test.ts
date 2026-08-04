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

    expect(state.items.length).toBe(316)
    expect(state.items.filter((item) => item.status === 'NEEDS_REVIEW').length).toBe(7)
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

  it('updates stock only after approved count session', () => {
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
    const submitted = service.submitCountSession(counted, withSession.sessions[0].id)
    const approved = service.approveCountSession(submitted, withSession.sessions[0].id)

    const afterItem = approved.items.find((item) => item.id === beforeItem.id)
    expect(afterItem?.quantityOnHand).toBe(beforeItem.quantityOnHand + 5)
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
})
