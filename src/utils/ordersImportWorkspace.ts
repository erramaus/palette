import type { WebsiteOrderImportRowPreview } from '../services/WebsiteOrderExcelImportService'

export const acceptedOrderWorkbookExtensions = ['.xlsx'] as const

export const isAcceptedOrderWorkbookFile = (fileName: string): boolean => {
  const lowerName = fileName.trim().toLowerCase()
  return acceptedOrderWorkbookExtensions.some((extension) => lowerName.endsWith(extension))
}

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '--'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  const kb = bytes / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }

  return `${(kb / 1024).toFixed(2)} MB`
}

const normalizeDateParts = (year: string, month: string, day: string): string => {
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return '--'
  }

  const parsed = new Date(y, m - 1, d)
  if (
    parsed.getFullYear() !== y
    || parsed.getMonth() + 1 !== m
    || parsed.getDate() !== d
  ) {
    return '--'
  }

  return parsed.toLocaleDateString()
}

export const inferWorkbookExportDate = (fileName: string, worksheetNames: string[]): string | null => {
  const patterns = [
    /(?<year>\d{4})[-_\s](?<month>\d{1,2})[-_\s](?<day>\d{1,2})/,
    /(?<month>\d{1,2})[-_\s](?<day>\d{1,2})[-_\s](?<year>\d{4})/,
  ]

  const candidates = [fileName, ...worksheetNames]
  for (const candidate of candidates) {
    for (const pattern of patterns) {
      const match = pattern.exec(candidate)
      if (!match?.groups?.year || !match.groups.month || !match.groups.day) {
        continue
      }

      const normalized = normalizeDateParts(match.groups.year, match.groups.month, match.groups.day)
      if (normalized !== '--') {
        return normalized
      }
    }
  }

  return null
}

export const isBlockingPreviewRow = (row: WebsiteOrderImportRowPreview): boolean => {
  return !row.normalized || row.bucket === 'ERRORS' || row.bucket === 'SKIPPED_ROWS'
}

export const canSelectPreviewRow = (
  row: WebsiteOrderImportRowPreview,
  includeNeedsReviewWithApproval: boolean,
): boolean => {
  if (isBlockingPreviewRow(row)) {
    return false
  }

  if (row.bucket === 'NEEDS_REVIEW') {
    return includeNeedsReviewWithApproval
  }

  return row.bucket === 'NEW_ORDERS' || row.bucket === 'CHANGED_ORDERS'
}

export const buildErrorReportCsv = (rows: WebsiteOrderImportRowPreview[]): string => {
  const header = [
    'sourceRecordId',
    'sourceRecordLabel',
    'bucket',
    'validationStatus',
    'orderNumber',
    'customer',
    'artwork',
    'errors',
  ]

  const body = rows
    .filter((row) => row.validationErrors.length > 0 || row.bucket === 'ERRORS' || row.bucket === 'SKIPPED_ROWS')
    .map((row) => {
      const values = [
        row.sourceRecordId,
        row.sourceRecordLabel,
        row.bucket,
        row.validationStatus,
        row.sourceOrderIdentifier,
        row.normalized?.customerIdentifier.normalized ?? '',
        row.normalized?.artwork.normalized ?? '',
        row.validationErrors.map((error) => error.message).join(' | '),
      ]

      return values
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(',')
    })

  return [header.join(','), ...body].join('\n')
}
