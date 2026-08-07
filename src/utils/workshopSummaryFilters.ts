import type { WorkshopListRow } from '../services/WorkshopListService'

export type WorkshopSummaryFilter = 'ACTIVE' | 'LATE' | 'BLOCKED' | 'DUE_TODAY' | 'DUE_THIS_WEEK'

const parseLocalDate = (value: string): Date => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value)
}

const startOfDay = (value: Date): Date =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate())

const matchesSummaryFilter = (
  row: WorkshopListRow,
  filter: WorkshopSummaryFilter,
  blockedWorkItemIds: ReadonlySet<string>,
  today: Date,
): boolean => {
  if (filter === 'ACTIVE') return row.status !== 'COMPLETE' && row.status !== 'CANCELLED'
  if (filter === 'LATE') return row.isLate
  if (filter === 'BLOCKED') return row.isBlocked || blockedWorkItemIds.has(row.workItemId)
  if (!row.dueDate) return false

  const dueDate = startOfDay(parseLocalDate(row.dueDate))
  const productionDay = startOfDay(today)
  if (filter === 'DUE_TODAY') return dueDate.getTime() === productionDay.getTime()

  const weekEnd = new Date(productionDay)
  weekEnd.setDate(productionDay.getDate() + (6 - productionDay.getDay()))
  return dueDate >= productionDay && dueDate <= weekEnd
}

const compareDueDates = (left: WorkshopListRow, right: WorkshopListRow): number => {
  if (!left.dueDate) return right.dueDate ? 1 : 0
  if (!right.dueDate) return -1
  return parseLocalDate(left.dueDate).getTime() - parseLocalDate(right.dueDate).getTime()
}

export const filterWorkshopRowsBySummary = (
  rows: WorkshopListRow[],
  filter: WorkshopSummaryFilter,
  blockedWorkItemIds: ReadonlySet<string>,
  today = new Date(),
): WorkshopListRow[] => {
  const filtered = rows.filter((row) => matchesSummaryFilter(row, filter, blockedWorkItemIds, today))
  return filter === 'LATE' || filter === 'DUE_THIS_WEEK'
    ? filtered.sort(compareDueDates)
    : filtered
}

export const countWorkshopRowsBySummary = (
  rows: WorkshopListRow[],
  blockedWorkItemIds: ReadonlySet<string>,
  today = new Date(),
): Record<WorkshopSummaryFilter, number> => ({
  ACTIVE: filterWorkshopRowsBySummary(rows, 'ACTIVE', blockedWorkItemIds, today).length,
  LATE: filterWorkshopRowsBySummary(rows, 'LATE', blockedWorkItemIds, today).length,
  BLOCKED: filterWorkshopRowsBySummary(rows, 'BLOCKED', blockedWorkItemIds, today).length,
  DUE_TODAY: filterWorkshopRowsBySummary(rows, 'DUE_TODAY', blockedWorkItemIds, today).length,
  DUE_THIS_WEEK: filterWorkshopRowsBySummary(rows, 'DUE_THIS_WEEK', blockedWorkItemIds, today).length,
})