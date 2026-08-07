import * as XLSX_NAMESPACE from 'xlsx'
import type { CellObject, WorkSheet } from 'xlsx'
import type {
  Priority,
  ProductionEstimatedMinutes,
  ProductionJob,
  ProductionStepsRecord,
  ProductType,
} from '../types/production'
import { calculateDueStatus } from '../utils/dueStatus'

const XLSX = (
  'default' in XLSX_NAMESPACE ? XLSX_NAMESPACE.default : XLSX_NAMESPACE
) as typeof import('xlsx')

export type WorkshopProductionSheetBucket =
  | 'NEW'
  | 'CHANGED'
  | 'UNCHANGED'
  | 'SKIPPED'
  | 'NEEDS_REVIEW'
  | 'ERRORS'

export interface WorkshopProductionSheetFieldDiff {
  field: string
  before: string | number | boolean | null
  after: string | number | boolean | null
}

export interface WorkshopProductionSheetRowPreview {
  sourceRecordId: string
  worksheetName: string
  rowNumber: number
  bucket: WorkshopProductionSheetBucket
  job: ProductionJob | null
  fieldDiffs: WorkshopProductionSheetFieldDiff[]
  warnings: string[]
  errors: string[]
}

export interface WorkshopProductionSheetWorksheetTrace {
  name: string
  visibility: 'VISIBLE' | 'HIDDEN' | 'VERY_HIDDEN'
  range: string | null
  formulaCellCount: number
}

export interface WorkshopProductionSheetPreview {
  fileName: string
  sourceWorksheet: string
  worksheets: WorkshopProductionSheetWorksheetTrace[]
  rows: WorkshopProductionSheetRowPreview[]
  jobs: ProductionJob[]
  summaries: Record<WorkshopProductionSheetBucket, number>
  expectedPieceCount: number | null
  issues: string[]
}

const SOURCE_WORKSHEET = 'Workshop List'
const DATA_START_ROW = 7
const SOURCE_COLUMNS = ['A', 'B', 'D', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF'] as const
const COMPETITION_COLUMNS = {
  FILES: 'Z',
  PRINTED: 'AA',
  STRETCHER_BASE: 'AB',
  MOUNTED: 'AC',
  FRAME_MADE: 'AD',
  FRAMED: 'AE',
  SHIPPED: 'AF',
} as const

const trimText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

const normalizeIdentityPart = (value: string): string => value.trim().toUpperCase().replace(/\s+/g, ' ')

const stableHash = (value: string): string => {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

const dateCellToIso = (cell: CellObject | undefined): string | null => {
  if (!cell) return null
  if (typeof cell.v === 'number') {
    const parsed = XLSX.SSF.parse_date_code(cell.v)
    if (!parsed) return null
    return `${String(parsed.y).padStart(4, '0')}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
  }
  const text = trimText(cell.v)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  return match ? text : null
}

const productTypeFromLegacyCode = (value: string): ProductType | null => {
  const normalized = normalizeIdentityPart(value)
  if (/^[01]\s+ORIG\b/.test(normalized)) return 'ORIGINAL'
  if (/^2\s+3D\s+LIM\b/.test(normalized)) return 'TEXTURED_REPLICA_3D'
  if (/^3\s+CANV\b/.test(normalized)) return 'CANVAS'
  if (/^4\s+PAPER\b/.test(normalized)) return 'PAPER'
  return null
}

const defaultEstimatedMinutes = (productType: ProductType): ProductionEstimatedMinutes => ({
  FILES: productType === 'ORIGINAL' ? 0 : 15,
  PRINTED: productType === 'ORIGINAL' ? 0 : 50,
  DIBOND: productType === 'TEXTURED_REPLICA_3D' ? 75 : 0,
  STRETCHER_BASE: 80,
  MOUNTED: 90,
  FRAME_MADE: 105,
  FRAMED: 85,
  SHIPPED: 40,
})

const buildSteps = (worksheet: WorkSheet, rowNumber: number, productType: ProductType): ProductionStepsRecord => {
  const steps: ProductionStepsRecord = {
    FILES: 'WAITING',
    PRINTED: productType === 'ORIGINAL' ? 'NOT_APPLICABLE' : 'WAITING',
    DIBOND: productType === 'TEXTURED_REPLICA_3D' ? 'WAITING' : 'NOT_APPLICABLE',
    STRETCHER_BASE: 'WAITING',
    MOUNTED: productType === 'TEXTURED_REPLICA_3D' ? 'WAITING' : 'NOT_APPLICABLE',
    FRAME_MADE: 'WAITING',
    FRAMED: 'WAITING',
    SHIPPED: 'WAITING',
  }

  for (const [step, column] of Object.entries(COMPETITION_COLUMNS)) {
    if (trimText(worksheet[`${column}${rowNumber}`]?.v).toLowerCase() === 'c') {
      steps[step as keyof ProductionStepsRecord] = 'COMPLETE'
    }
  }
  return steps
}

const priorityFor = (customerName: string, productType: ProductType): Priority => {
  if (productType === 'ORIGINAL') return 'ORIGINALS'
  if (normalizeIdentityPart(customerName) === 'GALLERY INVENTORY') return 'GALLERY_INVENTORY'
  return 'CUSTOMER_PURCHASED'
}

const traceCell = (worksheet: WorkSheet, address: string) => {
  const cell = worksheet[address]
  return {
    address,
    value: cell?.v ?? null,
    formatted: cell?.w ?? null,
    formula: cell?.f ?? null,
    style: cell?.s ?? null,
  }
}

const comparableFields = (job: ProductionJob): Record<string, string | number | boolean | null> => ({
  customerName: job.customerName,
  artworkTitle: job.artworkTitle,
  productType: job.productType,
  width: job.width,
  height: job.height,
  frameInfo: job.frameInfo,
  dueDate: job.dueDate,
  priority: job.priority,
  redNotes: job.redNotes ?? null,
  filesComplete: job.steps.FILES === 'COMPLETE',
  printedComplete: job.steps.PRINTED === 'COMPLETE',
  stretcherBaseComplete: job.steps.STRETCHER_BASE === 'COMPLETE',
  mountedComplete: job.steps.MOUNTED === 'COMPLETE',
  frameMadeComplete: job.steps.FRAME_MADE === 'COMPLETE',
  framedComplete: job.steps.FRAMED === 'COMPLETE',
  shippedComplete: job.steps.SHIPPED === 'COMPLETE',
})

const emptySummaries = (): Record<WorkshopProductionSheetBucket, number> => ({
  NEW: 0,
  CHANGED: 0,
  UNCHANGED: 0,
  SKIPPED: 0,
  NEEDS_REVIEW: 0,
  ERRORS: 0,
})

export class WorkshopProductionSheetImportService {
  parseBuffer(buffer: ArrayBuffer, fileName: string, existingJobs: ProductionJob[] = []): WorkshopProductionSheetPreview {
    const catalogWorkbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: false,
      cellFormula: true,
      cellStyles: false,
    })
    const workshopWorkbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: false,
      cellStyles: true,
      sheets: SOURCE_WORKSHEET,
    })
    const worksheets = catalogWorkbook.SheetNames.map((name, index) => {
      const hidden = catalogWorkbook.Workbook?.Sheets?.[index]?.Hidden ?? 0
      const catalogWorksheet = catalogWorkbook.Sheets[name]
      const formulaCellCount = catalogWorksheet
        ? Object.values(catalogWorksheet).filter((cell) => typeof cell === 'object' && cell !== null && 'f' in cell).length
        : 0
      return {
        name,
        visibility: hidden === 2 ? 'VERY_HIDDEN' as const : hidden === 1 ? 'HIDDEN' as const : 'VISIBLE' as const,
        range: catalogWorksheet?.['!ref'] ?? null,
        formulaCellCount,
      }
    })
    const worksheet = workshopWorkbook.Sheets[SOURCE_WORKSHEET]
    const summaries = emptySummaries()
    const issues: string[] = []

    if (!worksheet) {
      return {
        fileName,
        sourceWorksheet: SOURCE_WORKSHEET,
        worksheets,
        rows: [],
        jobs: [],
        summaries: { ...summaries, ERRORS: 1 },
        expectedPieceCount: null,
        issues: [`Missing required worksheet: ${SOURCE_WORKSHEET}.`],
      }
    }

    const expectedPieceCount = typeof worksheet.I4?.v === 'number' ? worksheet.I4.v : null
    const existingById = new Map(existingJobs.map((job) => [job.id, job]))
    const occurrenceByIdentity = new Map<string, number>()
    const identityCounts = new Map<string, number>()
    const candidateRows: number[] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1:A1')

    for (let rowNumber = DATA_START_ROW; rowNumber <= range.e.r + 1; rowNumber += 1) {
      const customer = trimText(worksheet[`G${rowNumber}`]?.v)
      const artwork = trimText(worksheet[`H${rowNumber}`]?.v)
      if (!customer && !artwork) continue
      candidateRows.push(rowNumber)
      const cleanCustomer = customer.replace(/\s*\(Red Note\)\s*$/i, '').trim()
      const identity = `${normalizeIdentityPart(cleanCustomer)}|${normalizeIdentityPart(artwork)}`
      identityCounts.set(identity, (identityCounts.get(identity) ?? 0) + 1)
    }

    const rows = candidateRows.map((rowNumber): WorkshopProductionSheetRowPreview => {
      const rawCustomer = trimText(worksheet[`G${rowNumber}`]?.v)
      const customerName = rawCustomer.replace(/\s*\(Red Note\)\s*$/i, '').trim()
      const artworkTitle = trimText(worksheet[`H${rowNumber}`]?.v)
      const identity = `${normalizeIdentityPart(customerName)}|${normalizeIdentityPart(artworkTitle)}`
      const occurrence = (occurrenceByIdentity.get(identity) ?? 0) + 1
      occurrenceByIdentity.set(identity, occurrence)
      const sourceRecordId = `WPS-${stableHash(`${identity}|${occurrence}`)}`
      const warnings: string[] = []
      const errors: string[] = []
      const dueDate = dateCellToIso(worksheet[`A${rowNumber}`])
      const productType = productTypeFromLegacyCode(trimText(worksheet[`P${rowNumber}`]?.v))
      const width = Number(worksheet[`N${rowNumber}`]?.v)
      const height = Number(worksheet[`O${rowNumber}`]?.v)
      const hasRedNote = /\(Red Note\)\s*$/i.test(rawCustomer)

      if (!customerName) errors.push('Customer is required.')
      if (!artworkTitle) errors.push('Artwork is required.')
      if (!dueDate) errors.push('Due date is missing or malformed.')
      if (!productType) errors.push(`Unknown legacy product code: ${trimText(worksheet[`P${rowNumber}`]?.v) || '(blank)'}.`)
      if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) errors.push('Width and height must be positive numbers.')
      if ((identityCounts.get(identity) ?? 0) > 1) warnings.push('Source identity is duplicated; deterministic worksheet occurrence is used.')

      if (errors.length > 0 || !dueDate || !productType) {
        summaries.NEEDS_REVIEW += 1
        return {
          sourceRecordId,
          worksheetName: SOURCE_WORKSHEET,
          rowNumber,
          bucket: 'NEEDS_REVIEW',
          job: null,
          fieldDiffs: [],
          warnings,
          errors,
        }
      }

      const job: ProductionJob = {
        id: sourceRecordId,
        orderNumber: sourceRecordId,
        customerName,
        artworkTitle,
        productType,
        width,
        height,
        frameInfo: trimText(worksheet[`J${rowNumber}`]?.v) || 'Unframed',
        dueDate,
        dueStatus: calculateDueStatus(dueDate),
        priority: priorityFor(customerName, productType),
        assignedWorkerId: '',
        notes: hasRedNote ? 'Red note indicated in source workbook.' : '',
        steps: buildSteps(worksheet, rowNumber, productType),
        estimatedMinutes: defaultEstimatedMinutes(productType),
        orderSource: 'WORKSHOP_PRODUCTION_SHEET',
        requestedDeliveryOrPickupDate: dueDate,
        redNotes: hasRedNote ? 'Red note indicated in source workbook.' : undefined,
        originalImport: {
          sourceFileName: fileName,
          worksheetName: SOURCE_WORKSHEET,
          rowNumber,
          sourceRecordId,
          identityOccurrence: occurrence,
          cells: Object.fromEntries(SOURCE_COLUMNS.map((column) => [column, traceCell(worksheet, `${column}${rowNumber}`)])),
        },
      }

      const existing = existingById.get(sourceRecordId)
      const fieldDiffs: WorkshopProductionSheetFieldDiff[] = []
      if (existing) {
        const before = comparableFields(existing)
        const after = comparableFields(job)
        for (const field of Object.keys(after)) {
          if (before[field] !== after[field]) fieldDiffs.push({ field, before: before[field], after: after[field] })
        }
      }
      const bucket: WorkshopProductionSheetBucket = !existing ? 'NEW' : fieldDiffs.length > 0 ? 'CHANGED' : 'UNCHANGED'
      summaries[bucket] += 1
      return {
        sourceRecordId,
        worksheetName: SOURCE_WORKSHEET,
        rowNumber,
        bucket,
        job,
        fieldDiffs,
        warnings,
        errors,
      }
    })

    const jobs = rows.flatMap((row) => row.job ? [row.job] : [])
    if (expectedPieceCount !== null && expectedPieceCount !== jobs.length) {
      summaries.NEEDS_REVIEW += 1
      issues.push(`Workshop List control cell I4 reports ${expectedPieceCount} pieces, but ${jobs.length} populated rows were found.`)
    }

    return {
      fileName,
      sourceWorksheet: SOURCE_WORKSHEET,
      worksheets,
      rows,
      jobs,
      summaries,
      expectedPieceCount,
      issues,
    }
  }
}