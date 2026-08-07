import { describe, expect, it } from 'vitest'
import type { ProductionOperation } from './ProductionPipelineService'
import { createWorkItemNavigationResolver } from './workItemNavigationResolver'

const workItems = [
  {
    id: 'WI-1001',
    orderId: 'WEB-4821',
    customFields: {},
  },
  {
    id: 'WI-1002',
    orderId: 'WEB-4829',
    customFields: {
      canonicalOrderImport: {
        originalImport: {
          sourceRecordId: 'SRC-2001',
        },
      },
    },
  },
]

const productionJobs = [
  {
    id: 'JOB-1001',
    orderNumber: 'WEB-4821',
  },
  {
    id: 'JOB-1002',
    orderNumber: 'WEB-4829',
  },
]

const productionOperations: ProductionOperation[] = [
  {
    id: 'OP-1001',
    workItemId: 'WI-1001',
    name: 'PRINTED',
    sequence: 1,
    status: 'READY',
    estimatedMinutes: 40,
    dependsOnOperationIds: [],
    priority: 80,
    notes: [],
    blockHistory: [],
    completionHistory: [],
    carryForwardHistory: [],
    history: [],
  },
]

describe('work item navigation resolver', () => {
  it('uses canonical work item id when provided directly', () => {
    const resolver = createWorkItemNavigationResolver({
      workItems,
      productionJobs,
      productionOperations,
      getWorkItemIdForOrderNumber: () => undefined,
    })

    expect(resolver.resolveWorkItemId({ candidateWorkItemId: 'WI-1001' })).toBe('WI-1001')
  })

  it('resolves job ids to canonical work item ids through order number mapping', () => {
    const resolver = createWorkItemNavigationResolver({
      workItems,
      productionJobs,
      productionOperations,
      getWorkItemIdForOrderNumber: (orderNumber) => (orderNumber === 'WEB-4821' ? 'WI-1001' : undefined),
    })

    expect(resolver.resolveWorkItemId({ candidateWorkItemId: 'JOB-1001' })).toBe('WI-1001')
  })

  it('resolves operation ids to their work item ids', () => {
    const resolver = createWorkItemNavigationResolver({
      workItems,
      productionJobs,
      productionOperations,
      getWorkItemIdForOrderNumber: () => undefined,
    })

    expect(resolver.resolveWorkItemId({ operationId: 'OP-1001' })).toBe('WI-1001')
  })

  it('resolves source record ids when canonical import links are available', () => {
    const resolver = createWorkItemNavigationResolver({
      workItems,
      productionJobs,
      productionOperations,
      getWorkItemIdForOrderNumber: () => undefined,
    })

    expect(resolver.resolveWorkItemId({ sourceRecordId: 'SRC-2001' })).toBe('WI-1002')
  })

  it('returns undefined when no canonical work item can be resolved', () => {
    const resolver = createWorkItemNavigationResolver({
      workItems,
      productionJobs,
      productionOperations,
      getWorkItemIdForOrderNumber: () => undefined,
    })

    expect(resolver.resolveWorkItemId({ candidateWorkItemId: 'JOB-404' })).toBeUndefined()
  })
})