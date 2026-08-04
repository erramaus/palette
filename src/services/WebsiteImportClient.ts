import { mockWebsiteImportPreview } from '../data/mockWebsiteImportPreview'
export {
  WebsiteOrderExcelImportService,
  type WebsiteOrderImportApprovalResult,
  type WebsiteOrderImportBucket,
  type WebsiteOrderImportExistingLookup,
  type WebsiteOrderImportExistingRecord,
  type WebsiteOrderImportFieldDiff,
  type WebsiteOrderImportPreview,
  type WebsiteOrderImportRowPreview,
  type WebsiteOrderImportSafeSourceFields,
  type WebsiteOrderImportSourceEndpoint,
  type WebsiteOrderImportValidationTrace,
} from './WebsiteOrderExcelImportService'

export type WebsiteImportConnectionStatus = 'CONNECTED' | 'DEGRADED' | 'UNAVAILABLE'
export type WebsiteImportValidationStatus = 'VALID' | 'VALID_WITH_WARNINGS' | 'INVALID'

export interface WebsiteImportPreviewOrder {
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
  validationStatus: WebsiteImportValidationStatus
  originalSourceFields: Record<string, string | number | boolean | null>
}

export interface WebsiteImportPreviewWarning {
  code: string
  message: string
  sourceRecordId?: string
}

export interface WebsiteImportPreviewValidationError {
  code: string
  message: string
  sourceRecordId?: string
  field?: string
}

export interface WebsiteImportPreviewResponse {
  connectionStatus: WebsiteImportConnectionStatus
  fetchedAt: string
  normalizedOrderPreviews: WebsiteImportPreviewOrder[]
  warnings: WebsiteImportPreviewWarning[]
  validationErrors: WebsiteImportPreviewValidationError[]
  sourceRecordIds: string[]
}

export interface WebsiteImportClient {
  fetchPreview: () => Promise<WebsiteImportPreviewResponse>
}

export const getWebsiteImportProxyUrl = (): string => {
  return import.meta.env.VITE_WEBSITE_IMPORT_PROXY_URL?.trim() ?? ''
}

export const acceptedWorkbookExtensions = ['.xlsx', '.xls'] as const

export const isAcceptedWorkbookFile = (fileName: string): boolean => {
  const lowerName = fileName.trim().toLowerCase()
  return acceptedWorkbookExtensions.some((extension) => lowerName.endsWith(extension))
}

export const createWebsiteImportClient = (proxyUrl = getWebsiteImportProxyUrl()): WebsiteImportClient => {
  return {
    async fetchPreview() {
      if (!proxyUrl) {
        throw new Error('VITE_WEBSITE_IMPORT_PROXY_URL is not configured.')
      }

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Website import proxy request failed with ${response.status}.`)
      }

      return (await response.json()) as WebsiteImportPreviewResponse
    },
  }
}

export const createFixtureWebsiteImportClient = (): WebsiteImportClient => {
  return {
    async fetchPreview() {
      return {
        ...mockWebsiteImportPreview,
        normalizedOrderPreviews: mockWebsiteImportPreview.normalizedOrderPreviews.map((preview) => ({
          ...preview,
          originalSourceFields: { ...preview.originalSourceFields },
        })),
        warnings: mockWebsiteImportPreview.warnings.map((warning) => ({ ...warning })),
        validationErrors: mockWebsiteImportPreview.validationErrors.map((error) => ({ ...error })),
        sourceRecordIds: [...mockWebsiteImportPreview.sourceRecordIds],
      }
    },
  }
}