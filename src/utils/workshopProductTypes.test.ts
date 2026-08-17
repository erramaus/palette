import { describe, expect, it } from 'vitest'
import type { WorkshopListRow } from '../services/WorkshopListService'
import { filterWorkshopRowsBySummary } from './workshopSummaryFilters'
import {
  countWorkshopRowsByProductType,
  filterWorkshopRowsByProductType,
  WORKSHOP_PRODUCT_TYPES,
} from './workshopProductTypes'

const row = (workItemId: string, workItemType: string, input: Partial<WorkshopListRow> = {}): WorkshopListRow => ({
  workItemId,
  workItemNumber: workItemId,
  customerName: 'Customer',
  artworkName: 'Artwork',
  productName: 'Product',
  workItemType,
  priority: 80,
  status: 'READY',
  currentStage: 'Print',
  assignedDepartment: 'Production',
  assignedEmployee: 'Worker',
  isLate: false,
  isBlocked: false,
  workflowProgress: 0,
  notesSummary: '',
  tags: [],
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  ...input,
})

describe('Workshop product types', () => {
  it('uses the requested product group order', () => {
    expect(WORKSHOP_PRODUCT_TYPES).toEqual([
      'PRINTS',
      'CANVAS_PRINTS',
      'THREE_D_PRINTS',
      'ORIGINALS',
    ])
  })

  const rows = [
    row('paper', 'PAPER'),
    row('canvas', 'CANVAS', { isLate: true }),
    row('3d', 'TEXTURED_REPLICA_3D', { isLate: true }),
    row('original', 'ORIGINAL'),
  ]

  it('counts exactly four canonical product groups', () => {
    expect(countWorkshopRowsByProductType(rows)).toEqual({
      ALL: 4,
      PRINTS: 1,
      CANVAS_PRINTS: 1,
      THREE_D_PRINTS: 1,
      ORIGINALS: 1,
    })
  })

  it('combines product type with active, late, blocked, due, and toolbar filters', () => {
    const searchedAndPrioritized = rows.filter((item) => item.priority === 80 && item.customerName.includes('Customer'))
    const threeD = filterWorkshopRowsByProductType(searchedAndPrioritized, 'THREE_D_PRINTS')
    const late = filterWorkshopRowsBySummary(threeD, 'LATE', new Set(), new Date(2026, 7, 6))

    expect(late.map((item) => item.workItemId)).toEqual(['3d'])
    expect(filterWorkshopRowsByProductType(rows, null)).toEqual(rows)
  })
})