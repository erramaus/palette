import { describe, expect, it } from 'vitest'
import type { ProductionJob } from '../types/production'
import { createWorkshopListUiEnvironment } from './workshopListUiBootstrap'

const importedJob: ProductionJob = {
  id: 'JOB-CANONICAL-IMPORT',
  orderNumber: ' WEB-CANONICAL-1 ',
  customerName: ' Canonical  Customer ',
  artworkTitle: ' Stable  Piece ',
  productType: 'CANVAS',
  width: 24,
  height: 36,
  frameInfo: 'Black Gallery Frame',
  dueDate: '2026-08-14',
  dueStatus: 'ON_TRACK',
  priority: 'CUSTOMER_PURCHASED',
  assignedWorkerId: 'EMP-001',
  notes: 'Standard production note.',
  orderSource: 'DATED_ORDER_LIST',
  requestedDeliveryOrPickupDate: '2026-08-14',
  redNotes: ' Verify   collector address ',
  shippingOrPickupMethod: 'PICKUP',
  steps: {
    FILES: 'COMPLETE',
    PRINTED: 'WAITING',
    DIBOND: 'NOT_APPLICABLE',
    STRETCHER_BASE: 'WAITING',
    MOUNTED: 'WAITING',
    FRAME_MADE: 'WAITING',
    FRAMED: 'WAITING',
    SHIPPED: 'WAITING',
  },
  estimatedMinutes: {
    FILES: 15,
    PRINTED: 50,
    DIBOND: 0,
    STRETCHER_BASE: 80,
    MOUNTED: 90,
    FRAME_MADE: 105,
    FRAMED: 85,
    SHIPPED: 40,
  },
}

describe('workshop list order ingestion', () => {
  it('canonicalizes once without duplicating WorkItems or operation IDs', () => {
    const environment = createWorkshopListUiEnvironment()
    const workItemCountBefore = environment.workItemService.listWorkItems().length

    const first = environment.ingestProductionJob(importedJob)
    const second = environment.ingestProductionJob(importedJob)

    expect(environment.workItemService.listWorkItems()).toHaveLength(workItemCountBefore + 1)
    expect(second.workItem.id).toBe(first.workItem.id)
    expect(second.operations.map((operation) => operation.id)).toEqual(
      first.operations.map((operation) => operation.id),
    )
    expect(new Set(first.operations.map((operation) => operation.id)).size).toBe(first.operations.length)
    expect(first.workItem.orderId).toBe('WEB-CANONICAL-1')
    expect(first.workItem.customFields.packagingMethod).toBe('PICKUP')
    expect(first.workItem.customFields.canonicalOrderImport).toMatchObject({
      status: 'NORMALIZED',
      redNotes: {
        original: ' Verify   collector address ',
        normalized: 'Verify collector address',
      },
      shippingOrPickupMethod: {
        normalized: 'PICKUP',
      },
    })
  })
})