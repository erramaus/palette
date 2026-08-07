import { describe, expect, it } from 'vitest'
import type { WorkshopListRow } from '../services/WorkshopListService'
import {
  countWorkshopRowsBySummary,
  filterWorkshopRowsBySummary,
} from './workshopSummaryFilters'

const row = (input: Partial<WorkshopListRow> & Pick<WorkshopListRow, 'workItemId'>): WorkshopListRow => ({
  workItemNumber: input.workItemId,
  customerName: 'Customer',
  artworkName: 'Artwork',
  productName: 'Product',
  workItemType: 'CANVAS',
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

describe('Workshop summary filters', () => {
  const today = new Date(2026, 7, 6)
  const rows = [
    row({ workItemId: 'late-most', dueDate: '2026-08-01', isLate: true }),
    row({ workItemId: 'late-recent', dueDate: '2026-08-05', isLate: true }),
    row({ workItemId: 'today', dueDate: '2026-08-06' }),
    row({ workItemId: 'week', dueDate: '2026-08-08' }),
    row({ workItemId: 'next-week', dueDate: '2026-08-09' }),
    row({ workItemId: 'complete', dueDate: '2026-08-06', status: 'COMPLETE' }),
  ]
  const blockedIds = new Set(['week'])

  it('uses the same predicates for card counts and filtered records', () => {
    const counts = countWorkshopRowsBySummary(rows, blockedIds, today)

    expect(counts).toEqual({
      ACTIVE: 5,
      LATE: 2,
      BLOCKED: 1,
      DUE_TODAY: 2,
      DUE_THIS_WEEK: 3,
    })
    expect(Object.entries(counts).every(([filter, count]) =>
      filterWorkshopRowsBySummary(rows, filter as keyof typeof counts, blockedIds, today).length === count,
    )).toBe(true)
  })

  it('sorts late and current-week records by due date', () => {
    expect(filterWorkshopRowsBySummary(rows, 'LATE', blockedIds, today).map((item) => item.workItemId)).toEqual([
      'late-most',
      'late-recent',
    ])
    expect(filterWorkshopRowsBySummary(rows, 'DUE_THIS_WEEK', blockedIds, today).map((item) => item.workItemId)).toEqual([
      'today',
      'complete',
      'week',
    ])
  })
})