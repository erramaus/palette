export type ImportConnectionStatus = 'CONNECTED' | 'DEGRADED' | 'UNAVAILABLE'
export type ImportValidationStatus = 'VALID' | 'VALID_WITH_WARNINGS' | 'INVALID'

export interface SafeSourceFieldValueRecord {
  [key: string]: string | number | boolean | null
}

export interface WarehouseOrderSourceRecord {
  sourceRecordId: string
  orderNumber: string | null
  customer: string | null
  artwork: string | null
  productType: string | null
  size: string | null
  orientation: string | null
  frame: string | null
  dueDate: string | null
  fulfillmentMethod: string | null
  shippingDestination: string | null
  notes: string | null
  redNotes: string | null
  originalSourceFields?: Record<string, unknown>
}

export interface WarehouseOrderPreview {
  sourceRecordId: string
  orderNumber: string
  customer: string
  artwork: string
  productType: string
  size: string
  orientation: string
  frame: string
  dueDate: string
  fulfillmentMethod: string
  shippingDestination: string
  notes: string
  redNotes: string
  validationStatus: ImportValidationStatus
  originalSourceFields: SafeSourceFieldValueRecord
}

export interface PreviewWarning {
  code: string
  message: string
  sourceRecordId?: string
}

export interface PreviewValidationError {
  code: string
  message: string
  sourceRecordId?: string
  field?: string
}

export interface WarehouseOrdersPreviewResponseBody {
  connectionStatus: ImportConnectionStatus
  fetchedAt: string
  normalizedOrderPreviews: WarehouseOrderPreview[]
  warnings: PreviewWarning[]
  validationErrors: PreviewValidationError[]
  sourceRecordIds: string[]
}

export interface ImportProxyConfig {
  baseUrl: string
  username: string
  password: string
  allowedOrigins: string[]
}

export interface ReadOnlyUpstreamSession {
  transportMode: 'fixture'
  upstreamBaseUrl: string
  authenticatedAt: string
}

export interface WarehouseOrdersPreviewRequest {
  method: string
  headers: Record<string, string | undefined>
  body?: unknown
}

export interface HttpResponseEnvelope {
  status: number
  headers: Record<string, string>
  body: WarehouseOrdersPreviewResponseBody | { connectionStatus: ImportConnectionStatus; fetchedAt: null; normalizedOrderPreviews: []; warnings: PreviewWarning[]; validationErrors: PreviewValidationError[]; sourceRecordIds: string[]; error: { code: string; message: string; details?: Record<string, unknown> } }
}