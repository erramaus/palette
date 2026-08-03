import { describe, expect, it } from 'vitest'
import { WorkItem } from '../models'
import type { ProductionTag as ProductionTagShape } from '../types/entities'
import { ProductionTagService, type ProductionTagLookupProvider } from './ProductionTagService'
import { WorkItemService } from './WorkItemService'

const workItem = new WorkItem({
  id: 'workitem-review',
  workItemNumber: 'WI-REVIEW',
  type: 'THREE_D_PRINT',
  customerId: 'customer-1',
  orderId: 'order-1',
  artworkId: 'artwork-1',
  productId: 'product-1',
  workflowId: 'workflow-1',
  currentStageId: 'stage-1',
  quantity: 1,
  status: 'READY',
  priority: 100,
  notes: [],
  attachments: [],
  tags: [],
  customFields: {},
  activityHistory: [],
  productionStepIds: [],
  tagLabels: [],
})

describe('ProductionTagService confirmed calculation integration', () => {
  const buildService = (input: {
    id: string
    productType: 'CANVAS' | 'THREE_D_PRINT'
    code: string
    frame: string
    base?: string
  }) => {
    const item = new WorkItem({
      ...workItem,
      id: input.id,
      type: input.productType,
      dueDate: '2026-08-08',
      assignedDepartmentId: 'frames',
      customFields: { frameStyle: input.frame, baseStyle: input.base, orientation: 'VERT' },
    })
    const workItemService = new WorkItemService()
    workItemService.replaceAllWorkItems([item])
    const lookups: ProductionTagLookupProvider = {
      getCustomerName: () => 'Customer',
      getArtworkData: () => ({ name: 'Artwork', width: 20, height: 30 }),
      getProductData: () => ({ name: input.productType, code: input.code, classification: input.productType }),
      getFrameStyleName: () => input.frame,
      getBaseStyleName: () => input.base,
      getPackagingData: () => undefined,
    }
    return {
      item: workItemService.getWorkItemById(input.id)!,
      service: new ProductionTagService(workItemService, lookups, {
        nowProvider: () => '2026-08-02T13:00:00.000Z',
      }),
    }
  }

  it('generates primary, base, and frame tags for confirmed framed 3D work', () => {
    const { item, service } = buildService({
      id: '3d-confirmed', productType: 'THREE_D_PRINT', code: '2 3D',
      frame: 'B&G Plein Faux', base: 'B&G Plein Faux',
    })

    const tags = service.generateProductionTags({ workItemIds: [item.id] })

    expect(tags.map((tag) => tag.tagType)).toEqual(['THREE_D_PRINT', 'FRAME', 'THREE_D_BASE'])
    expect(tags.every((tag) => tag.status === 'READY_TO_PRINT')).toBe(true)
    expect(tags.find((tag) => tag.tagType === 'FRAME')).toMatchObject({
      orientation: 'VERT', originalImportedFrameName: 'B&G Plein Faux',
      normalizedFrameName: 'B&G Plein Faux', dueDate: '2026-08-08', assignedWorkstation: 'frames',
    })
  })

  it('generates primary, stretcher, and frame tags for confirmed framed canvas', () => {
    const { item, service } = buildService({
      id: 'canvas-confirmed', productType: 'CANVAS', code: '3 Canv', frame: 'Silver EH',
    })
    expect(service.generateProductionTags({ workItemIds: [item.id] }).map((tag) => tag.tagType)).toEqual([
      'CANVAS', 'FRAME', 'STRETCHER',
    ])
  })

  it('does not generate a frame tag for unframed canvas', () => {
    const { item, service } = buildService({
      id: 'canvas-none', productType: 'CANVAS', code: '3 Canv', frame: 'None',
    })
    const tags = service.generateProductionTags({ workItemIds: [item.id] })

    expect(tags.map((tag) => tag.tagType)).toEqual(['CANVAS', 'STRETCHER'])
    expect(tags[0].status).toBe('READY_TO_PRINT')
  })

  it('does not generate frame or base saw tags from NEEDS_REVIEW calculations', () => {
    const workItemService = new WorkItemService()
    workItemService.replaceAllWorkItems([workItem])
    const lookups: ProductionTagLookupProvider = {
      getCustomerName: () => 'Customer',
      getArtworkData: () => ({ name: 'Artwork', width: 20, height: 30 }),
      getProductData: () => ({ name: '3D Print', code: '2 3D', classification: 'THREE_D_PRINT' }),
      getFrameStyleName: () => 'Gold',
      getBaseStyleName: () => 'Gold',
      getPackagingData: () => undefined,
    }
    const service = new ProductionTagService(workItemService, lookups, {
      nowProvider: () => '2026-08-02T12:00:00.000Z',
    })

    const tags = service.generateProductionTags({ workItemIds: [workItem.id] })

    expect(tags.map((tag) => tag.tagType)).toEqual(['THREE_D_PRINT'])
    expect(tags[0].frameStyleName).toBe('Gold')
    expect(tags[0].cutCalculation?.status).toBe('NEEDS_REVIEW')
    expect(tags[0].cutCalculation?.trace.originalInputs.importedFrameName).toBe('Gold')
    expect(tags[0].status).toBe('NEEDS_REVIEW')
  })

  it('prints only ready tags and freezes the exact calculation snapshot', () => {
    const workItemService = new WorkItemService()
    const confirmed = new WorkItem({ ...workItem, id: 'workitem-confirmed', customFields: { frameStyle: 'Silver EH' } })
    workItemService.replaceAllWorkItems([confirmed])
    const lookups: ProductionTagLookupProvider = {
      getCustomerName: () => 'Customer',
      getArtworkData: () => ({ name: 'Artwork', width: 20, height: 30 }),
      getProductData: () => ({ name: 'Canvas', code: '3 Canv', classification: 'CANVAS' }),
      getFrameStyleName: () => 'Silver EH',
      getBaseStyleName: () => undefined,
      getPackagingData: () => undefined,
    }
    const service = new ProductionTagService(workItemService, lookups, {
      nowProvider: () => '2026-08-02T13:00:00.000Z',
    })
    const tags = service.generateProductionTags({ workItemIds: [confirmed.id] })
    const frameTag = tags.find((tag) => tag.tagType === 'FRAME')!

    expect(frameTag.status).toBe('READY_TO_PRINT')
    service.printTags([frameTag], 'employee-1')

    expect(frameTag.status).toBe('PRINTED')
    expect(frameTag.printedAt).toBe('2026-08-02T13:00:00.000Z')
    const stored = workItemService.getWorkItemById(confirmed.id)!
    const snapshots = stored.customFields.productionTagSnapshots as Array<{ tags: ProductionTagShape[] }>
    expect(snapshots[0].tags[0].cutCalculation?.members.map((member) => member.cutLengthInches)).toEqual([
      31.5625, 31.5625, 21.5625, 21.5625,
    ])
  })

  it('preserves prior printed snapshots across regeneration', () => {
    const { item, service } = buildService({
      id: 'canvas-history', productType: 'CANVAS', code: '3 Canv', frame: 'Silver EH',
    })
    const first = service.generateProductionTags({ workItemIds: [item.id] })
    service.printTags([first.find((tag) => tag.tagType === 'FRAME')!])
    const second = service.generateProductionTags({ workItemIds: [item.id] })
    service.printTags([second.find((tag) => tag.tagType === 'FRAME')!])

    const snapshots = item.customFields.productionTagSnapshots as unknown[]
    expect(snapshots).toHaveLength(2)
  })
})