import { describe, expect, it } from 'vitest'
import { WorkItem } from '../models'
import type { ActivityAction } from '../types/entities'
import { ProductionOperationService } from './ProductionOperationService'
import { ProductionPipelineService } from './ProductionPipelineService'

const createFixture = () => {
  const workItems: WorkItem[] = []
  const activities: Array<{ action: ActivityAction; entityId: string }> = []
  let clock = 0
  const nowProvider = () => `2026-08-02T08:${String(clock++).padStart(2, '0')}:00.000Z`
  const pipeline = new ProductionPipelineService({
    nowProvider: () => new Date(nowProvider()),
    createWorkItem: (input) => {
      const workItem = new WorkItem({
        id: 'workitem-lifecycle', workItemNumber: 'WI-WEB-9001-1', type: input.productType,
        customerId: 'customer-1', orderId: input.orderNumber, artworkId: 'artwork-1', productId: 'product-1',
        workflowId: 'workflow-1', currentStageId: 'FILES', quantity: 1, status: 'READY', priority: input.priority,
        dueDate: input.dueDate, notes: input.notes, attachments: [], tags: [], customFields: {},
        activityHistory: [], productionStepIds: [], tagLabels: [],
      })
      workItems.push(workItem)
      return workItem
    },
  })
  const result = pipeline.importOrder({
    orderNumber: 'WEB-9001', customerName: 'Customer', artworkName: 'Artwork', productType: 'PAPER',
    width: 16, height: 20, orientation: 'VERT', priority: 80, dueDate: '2026-08-05', notes: [],
  })
  const service = new ProductionOperationService({
    listWorkItems: () => workItems,
    nowProvider,
    recordActivity: (activity) => activities.push({ action: activity.action, entityId: activity.entityId }),
  })
  return { service, pipeline, result, workItems, activities }
}

describe('ProductionOperationService', () => {
  it('enforces dependencies and records a director completion override without duplicating operations', () => {
    const { service, pipeline, result, workItems, activities } = createFixture()
    const [files, printed] = result.operations
    const originalCount = result.operations.length

    expect(() => service.startOperation(printed.id, 'worker-1')).toThrow(/prior operations/i)
    expect(() => service.completeOperation({ operationId: printed.id, completedBy: 'worker-1' })).toThrow(/prior operations/i)

    const completed = service.completeOperation({
      operationId: printed.id,
      completedBy: 'director-1',
      directorOverride: { approvedBy: 'director-1', reason: 'Approved controlled reprint sequence.' },
    })

    expect(completed.status).toBe('COMPLETE')
    expect(completed.completionHistory[0].overriddenDependencyIds).toEqual([files.id])
    expect(activities.map((activity) => activity.action)).toContain('OPERATION_DEPENDENCY_OVERRIDDEN')
    expect(pipeline.getOperations(workItems[0])).toHaveLength(originalCount)
    expect(new Set(pipeline.getOperations(workItems[0]).map((operation) => operation.id)).size).toBe(originalCount)
  })

  it('supports assignment, execution, blocking, reopening, carry-forward, metadata changes, notes, and history', () => {
    const { service, result, activities } = createFixture()
    const operation = result.operations[0]

    service.assignOperation(operation.id, 'worker-1', 'director-1')
    service.unassignOperation(operation.id, 'director-1')
    service.assignOperation(operation.id, 'worker-2', 'director-1')
    service.startOperation(operation.id, 'worker-2')
    service.blockOperation({
      operationId: operation.id,
      reason: 'Ink unavailable',
      blockedBy: 'worker-2',
      dependencyOrMaterialReference: 'INK-CYAN',
    })
    expect(() => service.completeOperation({ operationId: operation.id, completedBy: 'worker-2' })).toThrow(/blocked/i)
    const unblocked = service.unblockOperation(operation.id, 'director-1')
    expect(unblocked.blockHistory[0]).toMatchObject({ reason: 'Ink unavailable', unblockedBy: 'director-1' })

    service.addOperationNote(operation.id, 'Material arrived.', 'worker-2')
    service.changeOperationDueDate(operation.id, '2026-08-06', 'director-1')
    service.changeOperationPriority(operation.id, 95, 'director-1')
    const completed = service.completeOperation({ operationId: operation.id, completedBy: 'worker-2' })
    expect(completed.startedBy).toBe('worker-2')
    expect(completed.completedBy).toBe('worker-2')

    const reopened = service.reopenOperation(operation.id, 'director-1', 'QC correction required')
    expect(reopened.status).toBe('READY')
    expect(reopened.completionHistory).toHaveLength(1)
    const carried = service.carryForwardOperation({
      operationId: operation.id,
      originalBattlePlanDate: '2026-08-02',
      newBattlePlanDate: '2026-08-03',
      reason: 'Shift ended',
      carriedForwardBy: 'director-1',
    })

    expect(carried.carryForwardHistory).toHaveLength(1)
    expect(carried.notes).toEqual(['Material arrived.'])
    expect(carried.dueDate).toBe('2026-08-06')
    expect(carried.priority).toBe(95)
    expect(service.getOperationHistory(operation.id).map((entry) => entry.action)).toEqual([
      'OPERATION_ASSIGNED', 'OPERATION_UNASSIGNED', 'OPERATION_ASSIGNED', 'OPERATION_STARTED',
      'OPERATION_BLOCKED', 'OPERATION_UNBLOCKED', 'NOTE_ADDED', 'DUE_DATE_CHANGED',
      'PRIORITY_CHANGED', 'OPERATION_COMPLETED', 'OPERATION_REOPENED', 'OPERATION_CARRIED_FORWARD',
    ])
    expect(activities).toHaveLength(12)
  })
})