import type {
  PreviewValidationError,
  SafeSourceFieldValueRecord,
  WarehouseOrderPreview,
  WarehouseOrderSourceRecord,
} from './types'

const isPresent = (value: string | null | undefined): value is string => typeof value === 'string' && value.trim().length > 0

const sanitizeSourceFields = (record: Record<string, unknown> | undefined): SafeSourceFieldValueRecord => {
  if (!record) {
    return {}
  }

  const allowlist = new Set([
    'orderNumber',
    'customer',
    'artwork',
    'productType',
    'size',
    'orientation',
    'frame',
    'dueDate',
    'fulfillmentMethod',
    'shippingDestination',
    'notes',
    'redNotes',
  ])

  return Object.fromEntries(
    Object.entries(record)
      .filter(([key, value]) => allowlist.has(key) && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null))
      .map(([key, value]) => [key, value as string | number | boolean | null]),
  )
}

export interface NormalizationOutcome {
  preview: WarehouseOrderPreview | null
  validationErrors: PreviewValidationError[]
}

export const normalizeWarehouseOrderRecord = (record: WarehouseOrderSourceRecord): NormalizationOutcome => {
  const validationErrors: PreviewValidationError[] = []

  if (!isPresent(record.sourceRecordId)) {
    validationErrors.push({
      code: 'SOURCE_RECORD_ID_REQUIRED',
      message: 'Source record ID is required.',
      field: 'sourceRecordId',
    })
  }

  const requiredFields: Array<keyof Omit<WarehouseOrderSourceRecord, 'sourceRecordId' | 'originalSourceFields'>> = [
    'orderNumber',
    'customer',
    'artwork',
    'productType',
    'size',
    'orientation',
    'frame',
    'dueDate',
    'fulfillmentMethod',
    'shippingDestination',
    'notes',
    'redNotes',
  ]

  for (const field of requiredFields) {
    if (!isPresent(record[field])) {
      validationErrors.push({
        code: `SOURCE_${field.toUpperCase()}_REQUIRED`,
        message: `${field} is required for warehouse preview normalization.`,
        sourceRecordId: record.sourceRecordId,
        field,
      })
    }
  }

  if (validationErrors.length > 0) {
    return { preview: null, validationErrors }
  }

  return {
    preview: {
      sourceRecordId: record.sourceRecordId,
      orderNumber: record.orderNumber?.trim() ?? '',
      customer: record.customer?.trim() ?? '',
      artwork: record.artwork?.trim() ?? '',
      productType: record.productType?.trim() ?? '',
      size: record.size?.trim() ?? '',
      orientation: record.orientation?.trim() ?? '',
      frame: record.frame?.trim() ?? '',
      dueDate: record.dueDate?.trim() ?? '',
      fulfillmentMethod: record.fulfillmentMethod?.trim() ?? '',
      shippingDestination: record.shippingDestination?.trim() ?? '',
      notes: record.notes?.trim() ?? '',
      redNotes: record.redNotes?.trim() ?? '',
      validationStatus: 'VALID',
      originalSourceFields: sanitizeSourceFields(record.originalSourceFields),
    },
    validationErrors: [],
  }
}