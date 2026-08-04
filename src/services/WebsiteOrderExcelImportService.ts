import * as XLSX from 'xlsx'
import { OrderImportService } from './OrderImportService'
import type {
  CanonicalOrderImport,
  CanonicalOrderImportInput,
  RuleTraceability,
} from '../types/orderImport'
import type { ProductType } from '../types/production'

export type WebsiteOrderImportSourceEndpoint = 'WAREHOUSE_EXCEL_EXPORT'

export type WebsiteOrderImportBucket =
  | 'NEW_ORDERS'
  | 'CHANGED_ORDERS'
  | 'EXISTING_ORDERS'
  | 'SKIPPED_ROWS'
  | 'NEEDS_REVIEW'
  | 'ERRORS'

export interface WebsiteOrderImportSafeSourceFields {
  [key: string]: string | number | boolean | null
}

export interface WebsiteOrderImportFieldDiff {
  field: string
  before: string | number | boolean | null
  after: string | number | boolean | null
}

export interface WebsiteOrderImportValidationTrace {
  sourceFileName: string
  worksheetName: string
  rowNumber: number
  sourceEndpointType: WebsiteOrderImportSourceEndpoint
  ruleTrace: RuleTraceability
}

export interface WebsiteOrderImportExistingRecord {
  sourceRecordId: string
  sourceFileName: string
  worksheetName: string
  rowNumber: number
  normalized: CanonicalOrderImport
  safeSourceFields: WebsiteOrderImportSafeSourceFields
}

export interface WebsiteOrderImportRowPreview {
  sourceRecordId: string
  sourceFileName: string
  worksheetName: string
  rowNumber: number
  sourceEndpointType: WebsiteOrderImportSourceEndpoint
  uploadedAt: string
  importedAt: string | null
  bucket: WebsiteOrderImportBucket
  validationStatus: CanonicalOrderImport['status'] | 'ERROR'
  normalized: CanonicalOrderImport | null
  sourceReferenceId: string | null
  sourceOrderIdentifier: string
  sourceRecordLabel: string
  safeSourceFields: WebsiteOrderImportSafeSourceFields
  fieldDiffs: WebsiteOrderImportFieldDiff[]
  validationErrors: Array<{ code: string; message: string; field?: string }>
  validationTrace: WebsiteOrderImportValidationTrace
  warnings: string[]
}

export interface WebsiteOrderImportPreview {
  fileName: string
  uploadedAt: string
  sourceEndpointType: WebsiteOrderImportSourceEndpoint
  rows: WebsiteOrderImportRowPreview[]
  summaries: Record<WebsiteOrderImportBucket, number>
  warnings: string[]
  errors: string[]
}

export interface WebsiteOrderImportApprovalResult {
  importedCount: number
  skippedCount: number
  reusedCount: number
  errors: string[]
}

export interface WebsiteOrderImportExistingLookup {
  bySourceRecordId: Map<string, WebsiteOrderImportExistingRecord>
}

const workbookTrace: RuleTraceability = {
  sourceWorkbook: '2026-07-28-OrdersList.xlsx',
  worksheet: '7 28 2026',
  ruleId: 'warehouse-excel-import',
  confidence: 'HIGH',
}

const orderImportService = new OrderImportService()

const normalizeHeader = (header: string): string => header.trim().toUpperCase().replace(/\s+/g, ' ')

const trimText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value).trim()
  return ''
}

const toSafeValue = (value: unknown): string | number | boolean | null => {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'boolean') return value
  return null
}

const parseSize = (value: string): { width: number; height: number } | null => {
  const match = /^([0-9]+(?:\.[0-9]+)?)\s*[x×]\s*([0-9]+(?:\.[0-9]+)?)$/i.exec(value.trim())
  if (!match) return null
  const width = Number(match[1])
  const height = Number(match[2])
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null
  return { width, height }
}

const inferOrientation = (size: { width: number; height: number } | null): string | undefined => {
  if (!size) return undefined
  if (size.width === size.height) return 'SQUARE'
  return size.width > size.height ? 'HORIZONTAL' : 'VERTICAL'
}

const parseShipAmount = (value: string): number | null => {
  if (!value.trim()) return null
  const parsed = Number(value.replace(/[$,]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

const parseWorkbook = (buffer: ArrayBuffer): XLSX.WorkBook => {
  return XLSX.read(buffer, { type: 'array', cellDates: false })
}

const buildSourceRecordId = (fileName: string, worksheetName: string, rowNumber: number): string =>
  `${fileName}|${worksheetName}|row-${rowNumber}`

const buildCanonicalInput = (row: Record<string, string>, sourceRecordId: string): CanonicalOrderImportInput => {
  const size = parseSize(row.SIZE ?? '')
  const shipAmount = parseShipAmount(row.SHIP ?? '')
  const productType = trimText(row.TYPE)
  const redNotes = trimText(row['RED NOTE'] ?? row['RED NOTES'] ?? row.NOTES)
  const inferredShipMethod = shipAmount === null
    ? undefined
    : shipAmount > 0
      ? 'DELIVERY'
      : 'PICKUP'

  return {
    source: 'WAREHOUSE_REPORT',
    orderIdentifier: trimText(row['3D#']) || sourceRecordId,
    customerIdentifier: trimText(row.CUSTOMER),
    artwork: trimText(row.ITEM),
    productType,
    width: size?.width ?? Number.NaN,
    height: size?.height ?? Number.NaN,
    orientation: inferOrientation(size),
    frameSelection: trimText(row.FRAME),
    dueDate: trimText(row['DUE BY']),
    redNotes: redNotes || undefined,
    priority: productType.toUpperCase().includes('ORIG') ? 'ORIGINALS' : productType.toUpperCase().includes('GALLERY') ? 'GALLERY_INVENTORY' : 'CUSTOMER_PURCHASED',
    shippingOrPickupMethod: inferredShipMethod,
    originalImport: {
      sourceRecordId,
      sourceReferenceId: trimText(row['3D#']) || null,
      dueBy: toSafeValue(row['DUE BY']),
      days: toSafeValue(row.DAYS),
      size: toSafeValue(row.SIZE),
      item: toSafeValue(row.ITEM),
      productReference: toSafeValue(row['3D#']),
      customer: toSafeValue(row.CUSTOMER),
      type: toSafeValue(row.TYPE),
      frame: toSafeValue(row.FRAME),
      value: toSafeValue(row.VALUE),
      ship: toSafeValue(row.SHIP),
      batch: toSafeValue(row.BATCH),
      box: toSafeValue(row.BOX),
      tm: toSafeValue(row.TM),
      cumul: toSafeValue(row['CUMUL.']),
    },
  }
}

const buildSafeSourceFields = (row: Record<string, string>): WebsiteOrderImportSafeSourceFields => {
  const fields: WebsiteOrderImportSafeSourceFields = {}
  for (const [key, value] of Object.entries(row)) {
    fields[key] = value
  }
  return fields
}

const buildDiffs = (
  current: CanonicalOrderImport,
  existing: CanonicalOrderImport,
): WebsiteOrderImportFieldDiff[] => {
  const currentValues = {
    orderIdentifier: current.orderIdentifier.normalized ?? current.orderIdentifier.original,
    customer: current.customerIdentifier.normalized ?? current.customerIdentifier.original,
    artwork: current.artwork.normalized ?? current.artwork.original,
    productType: current.productType.normalized ?? current.productType.original,
    size: current.size.normalized ? `${current.size.normalized.width} x ${current.size.normalized.height}` : JSON.stringify(current.size.original),
    orientation: current.orientation.normalized ?? current.orientation.original ?? '',
    frame: current.frameSelection.normalized ?? current.frameSelection.original,
    dueDate: current.dueDate.normalized ?? current.dueDate.original,
    fulfillment: current.shippingOrPickupMethod.normalized ?? current.shippingOrPickupMethod.original ?? '',
  }
  const existingValues = {
    orderIdentifier: existing.orderIdentifier.normalized ?? existing.orderIdentifier.original,
    customer: existing.customerIdentifier.normalized ?? existing.customerIdentifier.original,
    artwork: existing.artwork.normalized ?? existing.artwork.original,
    productType: existing.productType.normalized ?? existing.productType.original,
    size: existing.size.normalized ? `${existing.size.normalized.width} x ${existing.size.normalized.height}` : JSON.stringify(existing.size.original),
    orientation: existing.orientation.normalized ?? existing.orientation.original ?? '',
    frame: existing.frameSelection.normalized ?? existing.frameSelection.original,
    dueDate: existing.dueDate.normalized ?? existing.dueDate.original,
    fulfillment: existing.shippingOrPickupMethod.normalized ?? existing.shippingOrPickupMethod.original ?? '',
  }

  return Object.keys(currentValues).flatMap((field) => {
    const key = field as keyof typeof currentValues
    return currentValues[key] === existingValues[key]
      ? []
      : [{ field, before: existingValues[key], after: currentValues[key] }]
  })
}

const collectValidationErrors = (result: CanonicalOrderImport): Array<{ code: string; message: string; field?: string }> => {
  const errors: Array<{ code: string; message: string; field?: string }> = []
  const fields = [
    ['source', result.source],
    ['orderIdentifier', result.orderIdentifier],
    ['customerIdentifier', result.customerIdentifier],
    ['artwork', result.artwork],
    ['productType', result.productType],
    ['productionPiece', result.productionPiece],
    ['size', result.size],
    ['orientation', result.orientation],
    ['frameSelection', result.frameSelection],
    ['dueDate', result.dueDate],
    ['priority', result.priority],
    ['shippingOrPickupMethod', result.shippingOrPickupMethod],
  ] as const

  for (const [field, value] of fields) {
    if (value.status === 'NEEDS_REVIEW') {
      errors.push({
        code: `WAREHOUSE_EXCEL_${field.toUpperCase()}_NEEDS_REVIEW`,
        message: value.reviewReason ?? `${field} requires review.`,
        field,
      })
    }
  }

  return errors
}

export class WebsiteOrderExcelImportService {
  async parseFile(file: File, uploadedAt = new Date().toISOString()): Promise<WebsiteOrderImportPreview> {
    const buffer = await file.arrayBuffer()
    return this.parseBuffer(buffer, file.name, uploadedAt)
  }

  parseBuffer(buffer: ArrayBuffer, fileName: string, uploadedAt = new Date().toISOString()): WebsiteOrderImportPreview {
    const workbook = parseWorkbook(buffer)

    if (workbook.SheetNames.length === 0) {
      return {
        fileName,
        uploadedAt,
        sourceEndpointType: 'WAREHOUSE_EXCEL_EXPORT',
        rows: [],
        summaries: { NEW_ORDERS: 0, CHANGED_ORDERS: 0, EXISTING_ORDERS: 0, SKIPPED_ROWS: 0, NEEDS_REVIEW: 0, ERRORS: 1 },
        warnings: [],
        errors: ['Workbook does not contain any worksheets.'],
      }
    }

    const rows: WebsiteOrderImportRowPreview[] = []
    const warnings: string[] = []
    const errors: string[] = []

    for (const worksheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[worksheetName]
      const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' }) as string[][]
      const headerRow = matrix[0] ?? []
      const headers = headerRow.map((header) => normalizeHeader(String(header)))
      const headerIndex = new Map(headers.map((header, index) => [header, index]))
      const requiredHeaders = ['DUE BY', 'SIZE', 'ITEM', 'CUSTOMER', 'TYPE', 'FRAME', 'SHIP']
      const missingHeaders = requiredHeaders.filter((header) => !headerIndex.has(header))
      if (missingHeaders.length > 0) {
        errors.push(`Worksheet ${worksheetName} is missing required headers: ${missingHeaders.join(', ')}`)
        continue
      }

      for (let index = 1; index < matrix.length; index += 1) {
        const rowNumber = index + 1
        const rowValues = matrix[index] ?? []
        const safeRow: Record<string, string> = {}
        headers.forEach((header, headerIndexValue) => {
          safeRow[header] = trimText(rowValues[headerIndexValue])
        })

        const hasAnyValue = Object.values(safeRow).some((value) => value.length > 0)
        if (!hasAnyValue) {
          continue
        }

        const sourceRecordId = buildSourceRecordId(fileName, worksheetName, rowNumber)
        const canonicalInput = buildCanonicalInput(safeRow, sourceRecordId)
        const normalized = orderImportService.normalize(canonicalInput)
        const validationErrors = collectValidationErrors(normalized)
        const duplicate = rows.find((row) => row.sourceRecordId === sourceRecordId)
        const sourceReferenceId = trimText(safeRow['3D#']) || null
        const sourceOrderIdentifier = sourceReferenceId ?? sourceRecordId
        const validationTrace: WebsiteOrderImportValidationTrace = {
          sourceFileName: fileName,
          worksheetName,
          rowNumber,
          sourceEndpointType: 'WAREHOUSE_EXCEL_EXPORT',
          ruleTrace: workbookTrace,
        }

        if (duplicate) {
          rows.push({
            sourceRecordId,
            sourceFileName: fileName,
            worksheetName,
            rowNumber,
            sourceEndpointType: 'WAREHOUSE_EXCEL_EXPORT',
            uploadedAt,
            importedAt: null,
            bucket: 'SKIPPED_ROWS',
            validationStatus: 'ERROR',
            normalized: null,
            sourceReferenceId,
            sourceOrderIdentifier,
            sourceRecordLabel: `${worksheetName}!${rowNumber}`,
            safeSourceFields: buildSafeSourceFields(safeRow),
            fieldDiffs: [],
            validationErrors: [{ code: 'DUPLICATE_SOURCE_RECORD_ID', message: 'Duplicate source record ID within workbook.' }],
            validationTrace,
            warnings: [],
          })
          continue
        }

        const warningsForRow: string[] = []
        if (trimText(safeRow.SHIP)) {
          const shipAmount = parseShipAmount(safeRow.SHIP)
          if (shipAmount === null) {
            validationErrors.push({
              code: 'SHIP_AMOUNT_INVALID',
              message: 'Ship amount must be numeric when present.',
              field: 'SHIP',
            })
          } else {
            warningsForRow.push('Fulfillment method inferred from ship amount.')
          }
        }

        rows.push({
          sourceRecordId,
          sourceFileName: fileName,
          worksheetName,
          rowNumber,
          sourceEndpointType: 'WAREHOUSE_EXCEL_EXPORT',
          uploadedAt,
          importedAt: null,
          bucket: validationErrors.length > 0 ? 'NEEDS_REVIEW' : 'NEW_ORDERS',
          validationStatus: validationErrors.length > 0 ? 'NEEDS_REVIEW' : normalized.status,
          normalized,
          sourceReferenceId,
          sourceOrderIdentifier,
          sourceRecordLabel: `${worksheetName}!${rowNumber}`,
          safeSourceFields: buildSafeSourceFields(safeRow),
          fieldDiffs: [],
          validationErrors,
          validationTrace,
          warnings: warningsForRow,
        })
      }
    }

    const summaries: Record<WebsiteOrderImportBucket, number> = {
      NEW_ORDERS: 0,
      CHANGED_ORDERS: 0,
      EXISTING_ORDERS: 0,
      SKIPPED_ROWS: 0,
      NEEDS_REVIEW: 0,
      ERRORS: 0,
    }

    for (const row of rows) {
      summaries[row.bucket] += 1
    }

    warnings.push(...rows.flatMap((row) => row.warnings))
    if (warnings.length > 0) {
      warnings.splice(0, warnings.length, ...new Set(warnings))
    }

    return {
      fileName,
      uploadedAt,
      sourceEndpointType: 'WAREHOUSE_EXCEL_EXPORT',
      rows,
      summaries,
      warnings,
      errors,
    }
  }

  buildPreview(preview: WebsiteOrderImportPreview, existingLookup: WebsiteOrderImportExistingLookup): WebsiteOrderImportPreview {
    const rows = preview.rows.map((row) => {
      const existing = existingLookup.bySourceRecordId.get(row.sourceRecordId)
      if (!existing || !row.normalized) {
        return row
      }

      const fieldDiffs = buildDiffs(row.normalized, existing.normalized)
      const bucket = fieldDiffs.length === 0 && row.validationErrors.length === 0
        ? 'EXISTING_ORDERS'
        : fieldDiffs.length > 0 && row.validationErrors.length === 0
          ? 'CHANGED_ORDERS'
          : row.validationErrors.length > 0
            ? 'NEEDS_REVIEW'
            : row.bucket

      return {
        ...row,
        bucket,
        fieldDiffs,
      }
    })

    const summaries: Record<WebsiteOrderImportBucket, number> = {
      NEW_ORDERS: 0,
      CHANGED_ORDERS: 0,
      EXISTING_ORDERS: 0,
      SKIPPED_ROWS: 0,
      NEEDS_REVIEW: 0,
      ERRORS: 0,
    }

    rows.forEach((row) => {
      summaries[row.bucket] += 1
    })

    return {
      ...preview,
      rows,
      summaries,
    }
  }

  getExistingLookup(existingRecords: WebsiteOrderImportExistingRecord[]): WebsiteOrderImportExistingLookup {
    return {
      bySourceRecordId: new Map(existingRecords.map((record) => [record.sourceRecordId, record])),
    }
  }

  toProductionInput(row: WebsiteOrderImportRowPreview, importedBy: string): { 
    workItemId: string
    orderNumber: string
    customerName: string
    artworkName: string
    productType: ProductType
    width: number
    height: number
    orientation: 'HORIZ' | 'VERT' | 'SQUARE' | 'PANORAMA'
    priority: 'ORIGINALS' | 'CUSTOMER_PURCHASED' | 'GALLERY_INVENTORY'
    dueDate: string
    notes: string[]
    assignedEmployeeId?: string
    customFields: Record<string, unknown>
    originalImport: Record<string, unknown>
  } {
    if (!row.normalized) {
      throw new Error(`Row ${row.sourceRecordLabel} cannot be imported because it requires review.`)
    }

    const normalized = row.normalized
    const size = normalized.size.normalized
    const productType = normalized.productType.normalized
    const dueDate = normalized.dueDate.normalized
    const customerName = normalized.customerIdentifier.normalized
    const artworkName = normalized.artwork.normalized
    const priority = normalized.priority.normalized

    if (!size || !productType || !dueDate || !customerName || !artworkName || !priority) {
      throw new Error(`Row ${row.sourceRecordLabel} cannot be imported because it requires review.`)
    }

    const originalImport = {
      ...normalized.originalImport,
      canonicalOrderImport: normalized,
      sourceRecordId: row.sourceRecordId,
      sourceFileName: row.sourceFileName,
      sourceWorksheetName: row.worksheetName,
      sourceRowNumber: row.rowNumber,
      sourceEndpointType: row.sourceEndpointType,
      uploadedAt: row.uploadedAt,
      importedAt: new Date().toISOString(),
      importedBy,
      validationTrace: row.validationTrace,
      safeSourceFields: row.safeSourceFields,
      fieldDiffs: row.fieldDiffs,
      bucket: row.bucket,
      warnings: row.warnings,
    }

    return {
      workItemId: row.sourceRecordId,
      orderNumber: normalized.orderIdentifier.normalized ?? row.sourceOrderIdentifier,
      customerName,
      artworkName,
      productType,
      width: size.width,
      height: size.height,
      orientation: (normalized.orientation.normalized ?? 'HORIZONTAL') as 'HORIZ' | 'VERT' | 'SQUARE' | 'PANORAMA',
      priority,
      dueDate,
      notes: [
        `Imported from ${row.sourceFileName} ${row.worksheetName}!${row.rowNumber}`,
        ...row.warnings,
      ],
      customFields: {
        sourceRecordId: row.sourceRecordId,
        sourceFileName: row.sourceFileName,
        sourceWorksheetName: row.worksheetName,
        sourceRowNumber: row.rowNumber,
        sourceEndpointType: row.sourceEndpointType,
        uploadedAt: row.uploadedAt,
        importedAt: new Date().toISOString(),
        importedBy,
        validationTrace: row.validationTrace,
        safeSourceFields: row.safeSourceFields,
        originalImport,
      },
      originalImport,
    }
  }

  getExistingRecordsFromProductionJobs(productionJobs: Array<{ id: string; originalImport?: Record<string, unknown>; orderNumber: string; customerName: string; artworkTitle: string; productType: ProductType; width: number; height: number; frameInfo: string; dueDate: string; priority: string; assignedWorkerId: string; notes: string; }>): WebsiteOrderImportExistingRecord[] {
    return productionJobs.flatMap((job) => {
      const sourceRecordId = typeof job.originalImport?.sourceRecordId === 'string' ? job.originalImport.sourceRecordId : job.id
      const sourceFileName = typeof job.originalImport?.sourceFileName === 'string' ? job.originalImport.sourceFileName : 'unknown.xlsx'
      const worksheetName = typeof job.originalImport?.sourceWorksheetName === 'string' ? job.originalImport.sourceWorksheetName : 'unknown'
      const rowNumber = typeof job.originalImport?.sourceRowNumber === 'number' ? job.originalImport.sourceRowNumber : 0
      const normalized = job.originalImport?.canonicalOrderImport as CanonicalOrderImport | undefined
      const safeSourceFields = (job.originalImport?.safeSourceFields as WebsiteOrderImportSafeSourceFields | undefined) ?? {}
      return normalized
        ? [{ sourceRecordId, sourceFileName, worksheetName, rowNumber, normalized, safeSourceFields }]
        : []
    })
  }
}

export const websiteOrderImportTrace = workbookTrace
