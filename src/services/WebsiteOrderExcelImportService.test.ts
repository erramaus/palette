import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { createWorkshopListUiEnvironment } from './workshopListUiBootstrap'
import { WebsiteOrderExcelImportService } from './WebsiteOrderExcelImportService'

const workbookPath = 'docs/source/2026-07-28-OrdersList.xlsx'
const service = new WebsiteOrderExcelImportService()

const toArrayBuffer = (bytes: ArrayBuffer | Uint8Array): ArrayBuffer => {
  if (bytes instanceof ArrayBuffer) {
    return bytes
  }
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength))
  return copy.buffer
}

const loadWorkbook = (): XLSX.WorkBook => XLSX.readFile(workbookPath, { cellDates: false })

const workbookToBuffer = (workbook: XLSX.WorkBook): ArrayBuffer =>
  toArrayBuffer(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer | Uint8Array)

const buildExistingLookup = (preview = service.parseBuffer(workbookToBuffer(loadWorkbook()), '2026-07-28-OrdersList.xlsx')) =>
  service.getExistingLookup(preview.rows.filter((row) => row.normalized).map((row) => {
    if (!row.normalized) {
      throw new Error('Expected normalized row.')
    }
    return {
      sourceRecordId: row.sourceRecordId,
      sourceFileName: row.sourceFileName,
      worksheetName: row.worksheetName,
      rowNumber: row.rowNumber,
      normalized: row.normalized,
      safeSourceFields: row.safeSourceFields,
    }
  }))

const mutateWorkbook = (mutator: (rows: string[][]) => void): ArrayBuffer => {
  const workbook = loadWorkbook()
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' }) as string[][]
  mutator(rows)
  workbook.Sheets[workbook.SheetNames[0]] = XLSX.utils.aoa_to_sheet(rows)
  return workbookToBuffer(workbook)
}

describe('WebsiteOrderExcelImportService', () => {
  it('parses the real workbook and normalizes the dated order rows', () => {
    const preview = service.parseBuffer(workbookToBuffer(loadWorkbook()), '2026-07-28-OrdersList.xlsx')

    expect(preview.rows).toHaveLength(3)
    expect(preview.rows[0].bucket).toBe('NEW_ORDERS')
    expect(preview.rows[0].normalized?.productType.normalized).toBe('PAPER')
    expect(preview.rows[0].normalized?.shippingOrPickupMethod.normalized).toBe('PICKUP')
    expect(preview.rows[0].warnings).toContain('Fulfillment method inferred from ship amount.')
    expect(preview.rows[0].validationTrace.sourceFileName).toBe('2026-07-28-OrdersList.xlsx')
    expect(preview.rows[0].safeSourceFields.SIZE).toBe('16 x 20')
  })

  it('detects changed rows against the current approved snapshot', () => {
    const baseline = service.parseBuffer(workbookToBuffer(loadWorkbook()), '2026-07-28-OrdersList.xlsx')
    const existingLookup = buildExistingLookup(baseline)
    const mutated = service.parseBuffer(
      mutateWorkbook((rows) => {
        rows[2][7] = 'Framed'
      }),
      '2026-07-28-OrdersList.xlsx',
    )

    const preview = service.buildPreview(mutated, existingLookup)
    const changedRow = preview.rows.find((row) => row.rowNumber === 3)

    expect(changedRow?.bucket).toBe('CHANGED_ORDERS')
    expect(changedRow?.fieldDiffs.some((diff) => diff.field === 'frame')).toBe(true)
  })

  it('marks duplicate uploads as existing without creating new identities', () => {
    const first = service.parseBuffer(workbookToBuffer(loadWorkbook()), '2026-07-28-OrdersList.xlsx')
    const existingLookup = buildExistingLookup(first)
    const second = service.buildPreview(first, existingLookup)

    expect(second.summaries.EXISTING_ORDERS).toBe(3)
    expect(new Set(second.rows.map((row) => row.sourceRecordId)).size).toBe(3)
  })

  it('flags unknown products, malformed sizes, and malformed dates as needs review', () => {
    const preview = service.parseBuffer(
      mutateWorkbook((rows) => {
        rows[1][2] = 'broken-size'
        rows[2][0] = '2026-02-30'
        rows[3][6] = 'Mystery Product'
      }),
      '2026-07-28-OrdersList.xlsx',
    )

    expect(preview.rows[0].validationErrors.some((error) => error.field === 'size')).toBe(true)
    expect(preview.rows[1].validationErrors.some((error) => error.field === 'dueDate')).toBe(true)
    expect(preview.rows[2].validationErrors.some((error) => error.field === 'productType')).toBe(true)
    expect(preview.summaries.NEEDS_REVIEW).toBe(3)
  })

  it('preserves optional red note columns and explicit shipment modes', () => {
    const buffer = mutateWorkbook((rows) => {
      rows[0].push('RED NOTE')
      rows[1].push('Handle gently')
    })
    const preview = service.parseBuffer(buffer, '2026-07-28-OrdersList.xlsx')

    expect(preview.rows[0].normalized?.redNotes.normalized).toBe('Handle gently')
  })

  it('infers pickup and shipping from the ship amount column', () => {
    const pickupPreview = service.parseBuffer(workbookToBuffer(loadWorkbook()), '2026-07-28-OrdersList.xlsx')
    expect(pickupPreview.rows[0].normalized?.shippingOrPickupMethod.normalized).toBe('PICKUP')

    const shippingPreview = service.parseBuffer(
      mutateWorkbook((rows) => {
        rows[1][9] = '12.50'
      }),
      '2026-07-28-OrdersList.xlsx',
    )

    expect(shippingPreview.rows[0].normalized?.shippingOrPickupMethod.normalized).toBe('DELIVERY')
  })

  it('keeps stable WorkItem and operation IDs when the same workbook is imported twice', () => {
    const preview = service.parseBuffer(workbookToBuffer(loadWorkbook()), '2026-07-28-OrdersList.xlsx')
    const row = preview.rows[0]
    if (!row.normalized) {
      throw new Error('Expected normalized row.')
    }

    const environment = createWorkshopListUiEnvironment()
    const baselineCount = environment.workItemService.listWorkItems().length
    const input = service.toProductionInput(row, 'employee-director')
    const first = environment.ingestProductionJob({
      id: row.sourceRecordId,
      orderNumber: input.orderNumber,
      customerName: input.customerName,
      artworkTitle: input.artworkName,
      productType: input.productType,
      width: input.width,
      height: input.height,
      frameInfo: row.normalized.frameSelection.normalized ?? row.normalized.frameSelection.original,
      dueDate: input.dueDate,
      dueStatus: 'ON_TRACK',
      priority: input.priority,
      assignedWorkerId: 'employee-director',
      notes: input.notes.join('\n'),
      steps: {
        FILES: 'COMPLETE',
        PRINTED: 'WAITING',
        DIBOND: 'NOT_APPLICABLE',
        STRETCHER_BASE: 'WAITING',
        MOUNTED: 'WAITING',
        FRAME_MADE: 'WAITING',
        FRAMED: 'WAITING',
        SHIPPED: 'WAITING',
      },
      estimatedMinutes: {
        FILES: 15,
        PRINTED: 50,
        DIBOND: 0,
        STRETCHER_BASE: 80,
        MOUNTED: 90,
        FRAME_MADE: 105,
        FRAMED: 85,
        SHIPPED: 40,
      },
      orderSource: 'WAREHOUSE_EXCEL_EXPORT',
      originalImport: input.originalImport,
    })
    const second = environment.ingestProductionJob({
      id: row.sourceRecordId,
      orderNumber: input.orderNumber,
      customerName: input.customerName,
      artworkTitle: input.artworkName,
      productType: input.productType,
      width: input.width,
      height: input.height,
      frameInfo: row.normalized.frameSelection.normalized ?? row.normalized.frameSelection.original,
      dueDate: input.dueDate,
      dueStatus: 'ON_TRACK',
      priority: input.priority,
      assignedWorkerId: 'employee-director',
      notes: input.notes.join('\n'),
      steps: {
        FILES: 'COMPLETE',
        PRINTED: 'WAITING',
        DIBOND: 'NOT_APPLICABLE',
        STRETCHER_BASE: 'WAITING',
        MOUNTED: 'WAITING',
        FRAME_MADE: 'WAITING',
        FRAMED: 'WAITING',
        SHIPPED: 'WAITING',
      },
      estimatedMinutes: {
        FILES: 15,
        PRINTED: 50,
        DIBOND: 0,
        STRETCHER_BASE: 80,
        MOUNTED: 90,
        FRAME_MADE: 105,
        FRAMED: 85,
        SHIPPED: 40,
      },
      orderSource: 'WAREHOUSE_EXCEL_EXPORT',
      originalImport: input.originalImport,
    })

    expect(second.workItem.id).toBe(first.workItem.id)
    expect(second.operations.map((operation) => operation.id)).toEqual(first.operations.map((operation) => operation.id))
    expect(environment.workItemService.listWorkItems()).toHaveLength(baselineCount + 1)
  })
})
