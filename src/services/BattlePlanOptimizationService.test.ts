import { describe, expect, it } from 'vitest'
import type { Employee } from '../types/employees'
import type { ProductionJob } from '../types/production'
import { BattlePlanOptimizationService } from './BattlePlanOptimizationService'
import { buildMaterialInventoryBalancesFromWorkbookItems, MaterialForecastService } from './MaterialForecastService'
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

const employee = (id: string, skills: Employee['skills']): Employee => ({
  id,
  name: id,
  role: 'WORKER',
  skills,
  defaultAvailableMinutes: 600,
  active: true,
})

const job = (
  id: string,
  input: {
    productType: ProductionJob['productType']
    width: number
    height: number
    frameInfo: string
    operation: 'FRAME_MADE' | 'STRETCHER_BASE'
  },
): ProductionJob => ({
  id,
  orderNumber: `ORDER-${id}`,
  customerName: 'Customer',
  artworkTitle: `Artwork ${id}`,
  productType: input.productType,
  width: input.width,
  height: input.height,
  frameInfo: input.frameInfo,
  dueDate: '2026-08-03',
  dueStatus: 'ON_TRACK',
  priority: 'CUSTOMER_PURCHASED',
  assignedWorkerId: 'worker-1',
  notes: '',
  steps: {
    FILES: 'COMPLETE',
    PRINTED: 'NOT_APPLICABLE',
    DIBOND: 'NOT_APPLICABLE',
    STRETCHER_BASE: input.operation === 'STRETCHER_BASE' ? 'WAITING' : 'NOT_APPLICABLE',
    MOUNTED: 'NOT_APPLICABLE',
    FRAME_MADE: input.operation === 'FRAME_MADE' ? 'WAITING' : 'NOT_APPLICABLE',
    FRAMED: 'WAITING',
    SHIPPED: 'WAITING',
  },
  estimatedMinutes: {
    FILES: 15,
    PRINTED: 0,
    DIBOND: 0,
    STRETCHER_BASE: 45,
    MOUNTED: 0,
    FRAME_MADE: 90,
    FRAMED: 20,
    SHIPPED: 15,
  },
})

describe('BattlePlanOptimizationService inventory integration', () => {
  it('uses persisted workbook balances during proposal generation without mutating stock', () => {
    const localStorage = createLocalStorageMock()
    ;(globalThis as unknown as { window: { localStorage: ReturnType<typeof createLocalStorageMock> } }).window = {
      localStorage,
    }

    const inventoryService = new WarehouseInventoryImportService()
    const imported = inventoryService.importFromSeed(null)

    const readyJob = job('ready', {
      productType: 'CANVAS',
      width: 24,
      height: 30,
      frameInfo: '',
      operation: 'STRETCHER_BASE',
    })
    const shortageJob = job('shortage', {
      productType: 'CANVAS',
      width: 48,
      height: 60,
      frameInfo: '',
      operation: 'STRETCHER_BASE',
    })
    const reviewJob = job('review', {
      productType: 'GALLERY_INVENTORY',
      width: 24,
      height: 30,
      frameInfo: 'Silver EH',
      operation: 'FRAME_MADE',
    })

    const demandService = new MaterialForecastService({
      productionJobs: [readyJob, shortageJob, reviewJob],
      battlePlans: [],
    })
    const readyDemand = demandService.getMaterialDemand(readyJob.id).find((item) => item.kind === 'STRETCHER')
    const shortageDemand = demandService.getMaterialDemand(shortageJob.id).find((item) => item.kind === 'STRETCHER')

    expect(readyDemand?.totalLinearInches).not.toBeNull()
    expect(shortageDemand?.totalLinearInches).not.toBeNull()
    expect(shortageDemand!.totalLinearInches!).toBeGreaterThan(readyDemand!.totalLinearInches!)

    const targetStretcherAvailable = Math.ceil(readyDemand!.totalLinearInches! + 5)
    expect(targetStretcherAvailable).toBeLessThan(shortageDemand!.totalLinearInches!)

    let assignedStretcherBalance = false
    const prepared = {
      ...imported,
      items: imported.items.map((item) => {
        const searchText = `${item.categoryName} ${item.name} ${item.description ?? ''}`.toLowerCase()
        if (!searchText.includes('stretcher') && !searchText.includes('strainer')) {
          return item
        }

        const nextAvailable = !assignedStretcherBalance ? targetStretcherAvailable : 0
        assignedStretcherBalance = true

        return {
          ...item,
          quantityReserved: 0,
          quantityOnHand: nextAvailable,
          quantityAvailable: nextAvailable,
        }
      }),
    }

    inventoryService.save(prepared)
    const loaded = inventoryService.load()
    expect(loaded).not.toBeNull()

    const uniqueIds = new Set(loaded!.items.map((item) => item.id))
    expect(uniqueIds.size).toBe(loaded!.items.length)

    const inventorySnapshot = loaded!.items.map((item) => ({
      id: item.id,
      quantityOnHand: item.quantityOnHand,
      quantityReserved: item.quantityReserved,
      quantityAvailable: item.quantityAvailable,
    }))

    const balances = buildMaterialInventoryBalancesFromWorkbookItems(loaded!.items)
    expect(balances.STRETCHER?.availableLinearInches).toBe(targetStretcherAvailable)

    const proposal = new BattlePlanOptimizationService({
      planDate: '2026-08-03',
      productionJobs: [readyJob, shortageJob, reviewJob],
      battlePlans: [],
      employees: [employee('worker-1', ['FRAME_MADE', 'STRETCHER_BASE'])],
      activityLogs: [],
      inventoryBalances: balances,
    }).generateProposal('director-1')

    const scheduledIds = new Set(
      proposal.employeePlans.flatMap((plan) => plan.operationGroups.flatMap((group) => group.workItemIds)),
    )

    expect(scheduledIds.has(readyJob.id)).toBe(true)
    expect(scheduledIds.has(shortageJob.id)).toBe(true)
    expect(scheduledIds.has(reviewJob.id)).toBe(true)
    expect(proposal.unscheduledWork).toHaveLength(0)

    const shortageWarning = proposal.warnings.find((warning) => warning.code === 'MATERIAL_SHORTAGE')
    expect(shortageWarning?.affectedWorkItemIds).toContain(shortageJob.id)

    const reviewWarning = proposal.warnings.find((warning) => warning.code === 'MATERIAL_NEEDS_REVIEW')
    expect(reviewWarning?.affectedWorkItemIds).toContain(reviewJob.id)

    const reviewGroup = proposal.employeePlans
      .flatMap((plan) => plan.operationGroups)
      .find((group) => group.workItemIds.includes(reviewJob.id))
    expect(reviewGroup?.materialStatus).toBe('NEEDS_REVIEW')

    expect(loaded!.items.map((item) => ({
      id: item.id,
      quantityOnHand: item.quantityOnHand,
      quantityReserved: item.quantityReserved,
      quantityAvailable: item.quantityAvailable,
    }))).toEqual(inventorySnapshot)
  })
})