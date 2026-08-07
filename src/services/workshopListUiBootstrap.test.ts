import { describe, expect, it } from 'vitest'
import { workshopProductionSheetJobs } from '../data/workshopProductionSheetJobs'
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
  it('projects every workbook seed row once into hierarchy, operations, and tags', () => {
    const environment = createWorkshopListUiEnvironment()
    const workItems = environment.workItemService.listWorkItems()
    const operations = workItems.flatMap((workItem) =>
      environment.productionPipelineService.getOperations(workItem),
    )

    expect(workItems).toHaveLength(46)
    expect(new Set(workItems.map((workItem) => workItem.orderId))).toHaveLength(46)
    expect(workItems.every((workItem) => {
      const canonicalImport = workItem.customFields.canonicalOrderImport as {
        shippingOrPickupMethod?: { status?: string }
      }
      return canonicalImport.shippingOrPickupMethod?.status === 'NEEDS_REVIEW'
        && !('packagingMethod' in workItem.customFields)
    })).toBe(true)
    expect(new Set(operations.map((operation) => operation.id))).toHaveLength(operations.length)
    expect(workshopProductionSheetJobs.filter((job) => job.steps.PRINTED === 'COMPLETE')).toHaveLength(4)
    expect(operations.filter((operation) => operation.name === 'PRINT' && operation.status === 'COMPLETE')).toHaveLength(0)
    expect(environment.productionPipelineService.buildWorkshopHierarchy(workItems)).toHaveLength(46)
    expect(workItems.flatMap((workItem) => environment.productionPipelineService.buildTags(workItem))).toHaveLength(operations.length)
  })

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

  it('preserves operation lifecycle history when a source record is rebuilt', () => {
    const environment = createWorkshopListUiEnvironment()
    const first = environment.ingestProductionJob(importedJob)
    const operation = first.operations[0]
    operation.status = 'COMPLETE'
    operation.completedAt = '2026-08-06T12:00:00.000Z'
    operation.completedBy = 'EMP-001'
    operation.completionHistory.push({
      completedAt: operation.completedAt,
      completedBy: operation.completedBy,
    })
    operation.history.push({
      id: `${operation.id}:history:complete`,
      action: 'COMPLETED',
      actorEmployeeId: operation.completedBy,
      occurredAt: operation.completedAt,
      detail: 'Completed before workbook refresh.',
    })

    const rebuilt = environment.ingestProductionJob({
      ...importedJob,
      dueDate: '2026-08-15',
      requestedDeliveryOrPickupDate: '2026-08-15',
    })
    const rebuiltOperation = rebuilt.operations.find((candidate) => candidate.name === operation.name)

    expect(rebuiltOperation).toMatchObject({
      id: operation.id,
      status: 'COMPLETE',
      completedAt: operation.completedAt,
      completedBy: operation.completedBy,
      dueDate: '2026-08-15',
    })
    expect(rebuiltOperation?.completionHistory).toEqual(operation.completionHistory)
    expect(rebuiltOperation?.history).toEqual(operation.history)
  })

  it('initializes source completion without overwriting a later Palette lifecycle state', () => {
    const environment = createWorkshopListUiEnvironment()
    const sourceCompletedJob: ProductionJob = {
      ...importedJob,
      id: 'JOB-SOURCE-COMPLETION',
      orderNumber: 'SOURCE-COMPLETION-1',
      artworkTitle: 'Source Completion Piece',
      steps: {
        ...importedJob.steps,
        FILES: 'WAITING',
        PRINTED: 'COMPLETE',
      },
    }
    const first = environment.ingestProductionJob(sourceCompletedJob)
    const printed = first.operations.find((operation) => operation.name === 'PRINT')

    expect(printed?.status).toBe('COMPLETE')
    if (!printed) throw new Error('Expected PRINT operation.')
    printed.status = 'READY'
    printed.history.push({
      id: `${printed.id}:history:reopened`,
      action: 'REOPENED',
      actorEmployeeId: 'EMP-001',
      occurredAt: '2026-08-07T12:00:00.000Z',
      detail: 'Reopened after source import.',
    })

    const rebuilt = environment.ingestProductionJob(sourceCompletedJob)
    expect(rebuilt.operations.find((operation) => operation.name === 'PRINT')).toMatchObject({
      id: printed.id,
      status: 'READY',
      history: printed.history,
    })
  })
})