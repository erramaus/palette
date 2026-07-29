import type { DueStatus } from '../types/production'

const DAY_IN_MS = 24 * 60 * 60 * 1000

const parseLocalDate = (value: string): Date => {
  const [yearRaw, monthRaw, dayRaw] = value.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date(value)
  }

  return new Date(year, month - 1, day)
}

const startOfDay = (date: Date): Date => {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

const diffInDays = (fromDate: Date, toDate: Date): number => {
  const from = startOfDay(fromDate).getTime()
  const to = startOfDay(toDate).getTime()
  return Math.round((to - from) / DAY_IN_MS)
}

export const calculateDueStatus = (dueDate: string, onHold = false): DueStatus => {
  if (onHold) {
    return 'ON_HOLD'
  }

  const now = new Date()
  const due = parseLocalDate(dueDate)
  const daysUntilDue = diffInDays(now, due)

  if (daysUntilDue < 0) {
    return 'OVERDUE'
  }
  if (daysUntilDue === 0) {
    return 'DUE_TODAY'
  }
  if (daysUntilDue <= 2) {
    return 'DUE_SOON'
  }
  if (daysUntilDue <= 5) {
    return 'AT_RISK'
  }
  return 'ON_TRACK'
}

export const DUE_STATUS_LABELS: Record<DueStatus, string> = {
  ON_TRACK: 'On Track',
  DUE_SOON: 'Due Soon',
  DUE_TODAY: 'Due Today',
  AT_RISK: 'At Risk',
  OVERDUE: 'Overdue',
  ON_HOLD: 'On Hold',
}
