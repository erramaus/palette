import { describe, expect, it } from 'vitest'
import type { WebsiteOrderImportRowPreview } from '../services/WebsiteOrderExcelImportService'
import {
  acceptedOrderWorkbookExtensions,
  canSelectPreviewRow,
  inferWorkbookExportDate,
  isAcceptedOrderWorkbookFile,
  isBlockingPreviewRow,
} from './ordersImportWorkspace'

const baseRow = (overrides: Partial<WebsiteOrderImportRowPreview>): WebsiteOrderImportRowPreview => ({
  sourceRecordId: 'source-record-1',
  sourceFileName: '2026-08-03-OrdersList.xlsx',
  worksheetName: '8 3 2026',
  rowNumber: 2,
  sourceEndpointType: 'WAREHOUSE_EXCEL_EXPORT',
  uploadedAt: new Date().toISOString(),
  importedAt: null,
  bucket: 'NEW_ORDERS',
  validationStatus: 'NORMALIZED',
  normalized: null,
  sourceReferenceId: null,
  sourceOrderIdentifier: 'ORD-1001',
  sourceRecordLabel: '8 3 2026!2',
  safeSourceFields: {},
  fieldDiffs: [],
  validationErrors: [],
  validationTrace: {
    sourceFileName: '2026-08-03-OrdersList.xlsx',
    worksheetName: '8 3 2026',
    rowNumber: 2,
    sourceEndpointType: 'WAREHOUSE_EXCEL_EXPORT',
    ruleTrace: {
      sourceWorkbook: '2026-08-03-OrdersList.xlsx',
      worksheet: '8 3 2026',
      ruleId: 'warehouse-excel-import',
      confidence: 'HIGH',
    },
  },
  warnings: [],
  ...overrides,
})

describe('orders import workspace helpers', () => {
  it('accepts only .xlsx order workbooks', () => {
    expect(acceptedOrderWorkbookExtensions).toEqual(['.xlsx'])
    expect(isAcceptedOrderWorkbookFile('orders.xlsx')).toBe(true)
    expect(isAcceptedOrderWorkbookFile('orders.xls')).toBe(false)
    expect(isAcceptedOrderWorkbookFile('orders.csv')).toBe(false)
  })

  it('infers export date from file names and worksheet names when possible', () => {
    expect(inferWorkbookExportDate('2026-08-03-orders.xlsx', [])).toBe(new Date(2026, 7, 3).toLocaleDateString())
    expect(inferWorkbookExportDate('orders.xlsx', ['8 3 2026'])).toBe(new Date(2026, 7, 3).toLocaleDateString())
    expect(inferWorkbookExportDate('orders.xlsx', ['Current'])).toBeNull()
  })

  it('treats skipped and error rows as blocking and unselectable', () => {
    const skipped = baseRow({ bucket: 'SKIPPED_ROWS', validationStatus: 'ERROR' })
    const errorRow = baseRow({ bucket: 'ERRORS', validationStatus: 'ERROR' })

    expect(isBlockingPreviewRow(skipped)).toBe(true)
    expect(isBlockingPreviewRow(errorRow)).toBe(true)
    expect(canSelectPreviewRow(skipped, true)).toBe(false)
    expect(canSelectPreviewRow(errorRow, true)).toBe(false)
  })

  it('requires explicit approval option for needs-review rows', () => {
    const needsReview = baseRow({ bucket: 'NEEDS_REVIEW', validationStatus: 'NEEDS_REVIEW', normalized: { status: 'NEEDS_REVIEW' } as WebsiteOrderImportRowPreview['normalized'] })

    expect(canSelectPreviewRow(needsReview, false)).toBe(false)
    expect(canSelectPreviewRow(needsReview, true)).toBe(true)
  })
})
