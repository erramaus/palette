import { describe, expect, it } from 'vitest'
import type { WorkItem as WorkItemShape } from '../../types/entities'
import type { PersistenceAdapter } from './PersistenceAdapter'
import { PersistenceService } from './PersistenceService'
import {
  createPersistenceSnapshot,
  rebuildWorkItemsFromSnapshot,
} from './PersistenceSnapshot'
import { snapshotV1Fixture } from './fixtures/snapshot-v1'
import { WorkItemService } from '../WorkItemService'
import { ProductionPipelineService } from '../ProductionPipelineService'

class MemoryPersistenceAdapter implements PersistenceAdapter {
  value: string | null = null

  load(): string | null { return this.value }
  save(value: string): void { this.value = value }
  remove(): void { this.value = null }
}

const workItem: WorkItemShape = {
  id: 'workitem-1',
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-08-01T09:00:00.000Z',
  workItemNumber: 'WI-WEB-1',
  type: 'CANVAS',
  customerId: 'customer-1',
  orderId: 'WEB-1',
  productId: 'product-1',
  artworkId: 'artwork-1',
  workflowId: 'workflow-1',
  currentStageId: 'stage-1',
  status: 'IN_PROGRESS',
  priority: 80,
  quantity: 1,
  notes: [],
  attachments: [],
  tags: ['FILES'],
  customFields: { pipeline: { orderNumber: 'WEB-1', operations: [{ stale: true }] } },
  activityHistory: [],
  productionStepIds: [],
  tagLabels: ['FILES'],
}

const createFixture = () => createPersistenceSnapshot({
  applicationVersion: '0.0.0',
  savedAt: '2026-08-01T12:00:00.000Z',
  orders: [{
    id: 'job-1', orderNumber: 'WEB-1', customerName: 'Customer', artworkTitle: 'Artwork',
    productType: 'CANVAS', width: 24, height: 30, frameInfo: '', dueDate: '2026-08-08',
    dueStatus: 'ON_TRACK', priority: 'CUSTOMER_PURCHASED', assignedWorkerId: 'employee-1', notes: '',
    steps: { FILES: 'WAITING', PRINTED: 'WAITING', DIBOND: 'NOT_APPLICABLE', STRETCHER_BASE: 'WAITING', MOUNTED: 'WAITING', FRAME_MADE: 'WAITING', FRAMED: 'WAITING', SHIPPED: 'WAITING' },
    estimatedMinutes: { FILES: 30, PRINTED: 55, DIBOND: 0, STRETCHER_BASE: 45, MOUNTED: 40, FRAME_MADE: 90, FRAMED: 20, SHIPPED: 35 },
  }],
  artworks: [{ id: 'artwork-1', name: 'Artwork' }],
  productionPieces: [],
  workItems: [workItem],
  productionOperations: [{
    id: 'operation-1', workItemId: 'workitem-1', name: 'FILES', sequence: 1,
    status: 'IN_PROGRESS', estimatedMinutes: 30, dependsOnOperationIds: [], priority: 80,
    notes: [], startedAt: '2026-08-01T10:00:00.000Z', startedBy: 'employee-1',
    blockHistory: [], completionHistory: [], carryForwardHistory: [],
    history: [{ id: 'history-1', action: 'OPERATION_STARTED', actorEmployeeId: 'employee-1', occurredAt: '2026-08-01T10:00:00.000Z', detail: 'Operation started.' }],
  }],
  battlePlans: [],
  productionTags: [],
  tagSnapshots: [],
  timelineEvents: [],
  activityLogs: [{ id: 'activity-1', entityType: 'ProductionOperation', entityId: 'operation-1', action: 'OPERATION_STARTED', occurredAt: '2026-08-01T10:00:00.000Z' }],
  intelligenceReviewState: { dismissedRecommendationIds: {}, reviewedRecommendationIds: { 'recommendation-1': true }, acceptedRecommendationIds: {} },
  settings: { forecastBufferHours: 4 },
})

describe('PersistenceService', () => {
  it('saves and reloads stable operations, dates, histories, and ActivityLogs', () => {
    const adapter = new MemoryPersistenceAdapter()
    const service = new PersistenceService(adapter)
    const original = createFixture()

    service.save(original)
    const loaded = service.load().snapshot!
    const restoredItems = rebuildWorkItemsFromSnapshot(loaded)
    const restoredOperations = (restoredItems[0].customFields.pipeline as { operations: Array<{ id: string; history: unknown[]; startedAt?: string }> }).operations

    expect(loaded.savedAt).toBe('2026-08-01T12:00:00.000Z')
    expect(restoredOperations).toHaveLength(1)
    expect(restoredOperations[0].id).toBe('operation-1')
    expect(restoredOperations[0].startedAt).toBe('2026-08-01T10:00:00.000Z')
    expect(restoredOperations[0].history).toHaveLength(1)
    expect(loaded.data.activityLogs[0].id).toBe('activity-1')
  })

  it('hydrates WorkItems and rebuilds derived projections without duplicate operations', () => {
    const adapter = new MemoryPersistenceAdapter()
    const persistence = new PersistenceService(adapter)
    persistence.save(createFixture())
    const snapshot = persistence.load().snapshot!
    const workItemService = new WorkItemService()
    workItemService.replaceAllWorkItems(rebuildWorkItemsFromSnapshot(snapshot))
    const pipeline = new ProductionPipelineService({
      createWorkItem: () => { throw new Error('Not used while rebuilding projections.') },
      nowProvider: () => new Date('2026-08-01T12:00:00.000Z'),
    })
    const hydratedItems = workItemService.listWorkItems()
    const operationIds = hydratedItems.flatMap((item) => pipeline.getOperations(item).map((operation) => operation.id))

    expect(operationIds).toEqual(['operation-1'])
    expect(new Set(operationIds).size).toBe(operationIds.length)
    expect(pipeline.buildWorkshopHierarchy(hydratedItems)[0].artworks[0].pieces[0].operations).toHaveLength(1)
    expect(pipeline.buildTags(hydratedItems[0])[0].operationId).toBe('operation-1')
  })

  it('migrates the v1 fixture without changing source records', () => {
    const adapter = new MemoryPersistenceAdapter()
    adapter.value = JSON.stringify(snapshotV1Fixture)
    const result = new PersistenceService(adapter).load()

    expect(result.migrated).toBe(true)
    expect(result.snapshot?.schemaVersion).toBe(2)
    expect(result.snapshot?.data.intelligenceReviewState.reviewedRecommendationIds).toEqual({})
  })

  it('rejects invalid snapshots and duplicate operation IDs', () => {
    const service = new PersistenceService(new MemoryPersistenceAdapter())
    expect(() => service.importBackup('{bad json')).toThrow('not valid JSON')
    const duplicate = createFixture()
    duplicate.data.productionOperations.push({ ...duplicate.data.productionOperations[0] })
    expect(() => service.importBackup(JSON.stringify(duplicate))).toThrow('duplicate production operation IDs')
  })

  it('exports and imports a validated backup', () => {
    const service = new PersistenceService(new MemoryPersistenceAdapter())
    const backup = service.exportBackup(createFixture())
    const restored = service.importBackup(backup)
    expect(restored.data.orders[0].id).toBe('job-1')
    expect(restored.data.intelligenceReviewState.reviewedRecommendationIds['recommendation-1']).toBe(true)
  })

})