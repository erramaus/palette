import { describe, expect, it } from 'vitest'
import type { WorkItem as WorkItemShape } from '../../types/entities'
import type { ProductionJob } from '../../types/production'
import { ProductionPipelineService } from '../ProductionPipelineService'
import { WorkItemDetailService } from '../WorkItemDetailService'
import { WorkItemService } from '../WorkItemService'
import { createWorkshopListUiEnvironment } from '../workshopListUiBootstrap'
import type { PersistenceAdapter } from './PersistenceAdapter'
import { PersistenceService } from './PersistenceService'
import { createPersistenceSnapshot, rebuildWorkItemsFromSnapshot } from './PersistenceSnapshot'
import { snapshotV1Fixture } from './fixtures/snapshot-v1'

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
  customers: [{ id: 'customer-1', name: 'Customer' }],
  artworks: [{ id: 'artwork-1', name: 'Artwork' }],
  products: [{ id: 'product-1', name: 'Canvas Product', code: '3 Canv', type: 'CANVAS' }],
  departments: [{ id: 'department-1', name: 'Production' }],
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
    service.save(createFixture())
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
    expect(result.snapshot?.schemaVersion).toBe(3)
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
    const restored = service.importBackup(service.exportBackup(createFixture()))
    expect(restored.data.orders[0].id).toBe('job-1')
    expect(restored.data.intelligenceReviewState.reviewedRecommendationIds['recommendation-1']).toBe(true)
  })

  it('preserves normalized tag lookups, tag values, operations, logs, and timeline across reload', () => {
    const importedJob: ProductionJob = {
      id: 'job-reload-1', orderNumber: 'WEB-RELOAD-1', customerName: 'Reload Gallery',
      artworkTitle: 'Persistent Horizon', productType: 'CANVAS', width: 24, height: 30,
      frameInfo: 'Gallery Black', dueDate: '2026-08-08', dueStatus: 'ON_TRACK',
      priority: 'CUSTOMER_PURCHASED', assignedWorkerId: 'employee-daniel',
      notes: 'Persistence regression scenario',
      steps: { FILES: 'COMPLETE', PRINTED: 'COMPLETE', DIBOND: 'NOT_APPLICABLE', STRETCHER_BASE: 'WAITING', MOUNTED: 'WAITING', FRAME_MADE: 'WAITING', FRAMED: 'WAITING', SHIPPED: 'WAITING' },
      estimatedMinutes: { FILES: 30, PRINTED: 55, DIBOND: 0, STRETCHER_BASE: 45, MOUNTED: 40, FRAME_MADE: 90, FRAMED: 20, SHIPPED: 35 },
    }
    const beforeEnvironment = createWorkshopListUiEnvironment()
    const imported = beforeEnvironment.ingestProductionJob(importedJob)
    const beforeDetail = new WorkItemDetailService(beforeEnvironment)
    beforeDetail.refreshLookupMaps([importedJob])
    const beforeTags = beforeDetail.generateTags(imported.workItem.id, 'employee-daniel')
    const beforeDetailSnapshot = beforeDetail.getSnapshot(imported.workItem.id)
    const beforeOperationIds = imported.operations.map((operation) => operation.id)
    const activityLogs = [{ id: 'activity-reload-1', entityType: 'ProductionOperation' as const, entityId: beforeOperationIds[0], action: 'OPERATION_STARTED' as const, occurredAt: '2026-08-02T08:00:00.000Z' }]
    const timelineEvents = [{
      id: `schedule-${beforeOperationIds[0]}`, operationId: beforeOperationIds[0], workItemId: imported.workItem.id,
      orderNumber: importedJob.orderNumber, pieceLabel: '24x30 CANVAS', operation: imported.operations[0].name,
      status: imported.operations[0].status, plannedStart: '2026-08-03T08:00:00.000Z', plannedFinish: '2026-08-03T08:30:00.000Z',
      assignedEmployee: 'employee-daniel', assignedWorkCenter: 'files', estimatedMinutes: 30,
      confidence: 'HIGH' as const, scheduleReason: 'Priority and dependency order.', dependencyIds: [],
      dueDate: importedJob.dueDate, priority: 80, locked: false,
    }]
    const snapshot = createPersistenceSnapshot({
      applicationVersion: '0.0.0', orders: [importedJob], customers: beforeEnvironment.listCustomers(),
      artworks: beforeEnvironment.listArtworks(), products: beforeEnvironment.listProducts(),
      departments: beforeEnvironment.listDepartments(), productionPieces: [],
      workItems: [beforeEnvironment.workItemService.getWorkItemById(imported.workItem.id)!],
      productionOperations: imported.operations, battlePlans: [], productionTags: beforeTags,
      tagSnapshots: imported.tags, timelineEvents, activityLogs,
      intelligenceReviewState: { dismissedRecommendationIds: {}, reviewedRecommendationIds: {}, acceptedRecommendationIds: {} },
      settings: { workflowContexts: beforeEnvironment.workflowContexts },
    })
    const adapter = new MemoryPersistenceAdapter()
    const persistence = new PersistenceService(adapter)
    persistence.save(snapshot)
    const loaded = persistence.load().snapshot!

    const afterEnvironment = createWorkshopListUiEnvironment()
    afterEnvironment.replaceWorkflowContexts(loaded.data.settings.workflowContexts as typeof afterEnvironment.workflowContexts)
    afterEnvironment.replaceCustomers(loaded.data.customers)
    afterEnvironment.replaceArtworks(loaded.data.artworks)
    afterEnvironment.replaceProducts(loaded.data.products)
    afterEnvironment.replaceDepartments(loaded.data.departments)
    afterEnvironment.workItemService.replaceAllWorkItems(rebuildWorkItemsFromSnapshot(loaded))
    const afterDetail = new WorkItemDetailService(afterEnvironment)
    afterDetail.refreshLookupMaps(loaded.data.orders)
    afterDetail.replaceGeneratedTags(loaded.data.productionTags)

    const afterTags = afterDetail.getGeneratedTagsForWorkItem(imported.workItem.id)
    const comparableTag = (tag: (typeof beforeTags)[number]) => ({
      tagType: tag.tagType, customerDisplayName: tag.customerDisplayName, artworkName: tag.artworkName,
      productName: tag.productName, frameStyleName: tag.frameStyleName,
      packagingMethod: tag.packagingMethod, checkpoints: tag.checkpoints,
    })
    const restoredOperationIds = afterEnvironment.workItemService.listWorkItems().flatMap((item) =>
      afterEnvironment.productionPipelineService.getOperations(item).map((operation) => operation.id),
    )

    expect(beforeTags).toHaveLength(2)
    expect(beforeTags.some((tag) => tag.tagType === 'FRAME')).toBe(false)
    expect(afterTags).toHaveLength(beforeTags.length)
    expect(afterTags.map(comparableTag)).toEqual(beforeTags.map(comparableTag))
    expect(afterDetail.getSnapshot(imported.workItem.id)).toMatchObject({
      customerName: beforeDetailSnapshot.customerName,
      artworkName: beforeDetailSnapshot.artworkName,
      productName: beforeDetailSnapshot.productName,
      assignedDepartmentName: beforeDetailSnapshot.assignedDepartmentName,
    })
    expect(restoredOperationIds).toEqual(beforeOperationIds)
    expect(new Set(restoredOperationIds).size).toBe(restoredOperationIds.length)
    expect(new Set(loaded.data.customers.map((record) => record.id)).size).toBe(loaded.data.customers.length)
    expect(new Set(loaded.data.products.map((record) => record.id)).size).toBe(loaded.data.products.length)
    expect(new Set(loaded.data.departments.map((record) => record.id)).size).toBe(loaded.data.departments.length)
    expect(loaded.data.activityLogs).toEqual(activityLogs)
    expect(loaded.data.timelineEvents).toEqual(timelineEvents)
    expect(afterEnvironment.workItemService.getWorkItemById(imported.workItem.id)?.customFields.productionTagSnapshots).toBeUndefined()
  })

  it('regenerates lifecycle tags and synchronizes saw operation tag IDs and status', () => {
    const job: ProductionJob = {
      id: 'job-tags-1', orderNumber: 'WEB-TAGS-1', customerName: 'Tag Gallery', artworkTitle: 'Tag Study',
      productType: 'CANVAS', width: 20, height: 30, frameInfo: 'Silver EH', dueDate: '2026-08-08',
      dueStatus: 'ON_TRACK', priority: 'CUSTOMER_PURCHASED', assignedWorkerId: 'employee-daniel', notes: '',
      steps: { FILES: 'COMPLETE', PRINTED: 'COMPLETE', DIBOND: 'NOT_APPLICABLE', STRETCHER_BASE: 'WAITING', MOUNTED: 'WAITING', FRAME_MADE: 'WAITING', FRAMED: 'WAITING', SHIPPED: 'WAITING' },
      estimatedMinutes: { FILES: 30, PRINTED: 55, DIBOND: 0, STRETCHER_BASE: 45, MOUNTED: 40, FRAME_MADE: 90, FRAMED: 20, SHIPPED: 35 },
    }
    const environment = createWorkshopListUiEnvironment()
    const imported = environment.ingestProductionJob(job)
    const detail = new WorkItemDetailService(environment)
    detail.refreshLookupMaps([job])
    const first = detail.generateTags(imported.workItem.id)
    const second = detail.generateTags(imported.workItem.id)
    const frameTag = second.find((tag) => tag.tagType === 'FRAME' && tag.status === 'READY_TO_PRINT')!
    const firstFrameTag = first.find((tag) => tag.tagType === 'FRAME')!
    const frameOperations = environment.productionPipelineService.getOperations(imported.workItem)
      .filter((operation) => operation.name === 'FRAME_CUT' || operation.name === 'FRAME_ASSEMBLY')

    expect(first.every((tag) => tag.status === 'REGENERATED')).toBe(true)
    expect(frameTag.previousTagId).toBe(firstFrameTag.id)
    expect(frameOperations).toHaveLength(2)
    expect(frameOperations.every((operation) => operation.tagIds?.includes(frameTag.id))).toBe(true)
    expect(frameOperations.every((operation) => operation.tagStatus === 'READY_TO_PRINT')).toBe(true)

    detail.printTag(imported.workItem.id, frameTag.id, 'employee-daniel')
    expect(frameOperations.every((operation) => operation.tagStatus === 'PRINTED')).toBe(true)
  })
})