import { ImportProxyError } from './errors'
import type {
  ImportConnectionStatus,
  PreviewValidationError,
  PreviewWarning,
  ImportValidationStatus,
  SafeSourceFieldValueRecord,
  WarehouseOrdersPreviewResponseBody,
} from './types'

export interface WarehouseAdminAuthProbeResponse {
  isAuthenticated: boolean
  email: string | null
}

export interface WarehouseAdminOrderItem {
  id: string | number
  productType: string | null
  count: number | null
  deliveryStatus: string | null
  dueDate: string | null
  dryDate: string | null
  timeDelivered: string | null
  flowType: string | null
  productName: string | null
  thumbnailImage: string | null
  isLimitedPrint: boolean | null
  isOpenEdition3D: boolean | null
  isPaperPrint: boolean | null
  limitedEditionNumber: string | number | null
  printHeight: number | null
  printWidth: number | null
  origStyleText: string | null
  printStyleText: string | null
  frameItemFrameText: string | null
  girth: number | null
  shippingAccount: string | null
  timeWorkComplete: string | null
  statWeek: string | null
  selected: boolean | null
}

export interface WarehouseAdminOrderDto {
  id: string | number
  firstName: string | null
  lastName: string | null
  manualEntry: boolean | null
  timeCreated: string | null
  timeDelivered: string | null
  subTotal: number | null
  shipping: number | null
  crateFee: number | null
  tax: number | null
  balanceIsZero: boolean | null
  company: string | null
  shippingFirstName: string | null
  shippingLastName: string | null
  shipAddress1: string | null
  shipAddress2: string | null
  shipCity: string | null
  shipState: string | null
  shipZip: string | null
  shipCountry: string | null
  email: string | null
  phone: string | null
  isGift: boolean | null
  giftMessage: string | null
  orderItems: WarehouseAdminOrderItem[]
  orderNotes: Array<{ id?: string | number; note?: string | null; createdAt?: string | null }> | null
  shippingLabels: Array<Record<string, unknown>> | null
}

export interface WarehousePageDtoResponse {
  statTable: {
    vsdRolledPrint: number
    vsdStretchedPrint: number
    vsdFramedPrint: number
    vsd3DPrint: number
    vsdOriginal: number
    vsdLastWeekEnding: string | null
    vsdThisWeekEnding: string | null
    lastWeeksVSD: number
    thisWeeksVSD: number
    thisWeeksVOS: number
    lastWeeksVOS: number
    lastWeeksNumParts: number
    thisWeeksNumParts: number
    lastWeeksPercOnDeadline: number
    thisWeeksPercOnDeadline: number
  }
  orders: WarehouseAdminOrderDto[]
}

export interface WarehouseVsdReportResponse {
  vsdThis: number
  vsdLast: number
  vsdPrior: number
  cvsdThis: number
  cvsdLast: number
  cvsdPrior: number
}

export interface WarehouseAdminFetchResult {
  connectionStatus: ImportConnectionStatus
  fetchedAt: string
  normalizedOrderPreviews: WarehouseOrdersPreviewResponseBody['normalizedOrderPreviews']
  warnings: PreviewWarning[]
  validationErrors: PreviewValidationError[]
  sourceRecordIds: string[]
}

export interface WarehouseAdminTransport {
  fetchAuthProbe: () => Promise<WarehouseAdminAuthProbeResponse>
  fetchWarehousePageDto: () => Promise<WarehousePageDtoResponse>
  fetchWarehouseVsdReport: () => Promise<WarehouseVsdReportResponse>
}

export interface WarehouseAdminTransportOptions {
  baseUrl: string
  cookieHeader?: string
  fetchImpl?: typeof fetch
}

const toTrimmed = (value: string | null | undefined): string => (value ?? '').trim()

const formatShippingDestination = (order: WarehouseAdminOrderDto): string => {
  const pieces = [order.shipAddress1, order.shipAddress2, order.shipCity, order.shipState, order.shipZip, order.shipCountry]
    .map(toTrimmed)
    .filter((piece) => piece.length > 0)
  return pieces.join(', ')
}

const buildSourceFields = (order: WarehouseAdminOrderDto, item: WarehouseAdminOrderItem): SafeSourceFieldValueRecord => ({
  id: order.id,
  orderId: order.id,
  customer: toTrimmed(order.company ?? `${order.firstName ?? ''} ${order.lastName ?? ''}`),
  artwork: toTrimmed(item.productName),
  productType: toTrimmed(item.productType),
  size: `${item.printWidth ?? ''} x ${item.printHeight ?? ''}`.trim(),
  orientation: item.printWidth !== null && item.printHeight !== null && item.printWidth < item.printHeight ? 'VERT' : 'HORIZ',
  frame: toTrimmed(item.frameItemFrameText ?? item.printStyleText ?? item.origStyleText),
  dueDate: toTrimmed(item.dueDate),
  fulfillmentMethod: toTrimmed(item.deliveryStatus),
  shippingDestination: formatShippingDestination(order),
  notes: Array.isArray(order.orderNotes) ? order.orderNotes.map((note) => note.note ?? '').filter(Boolean).join(' | ') : '',
  redNotes: toTrimmed(order.giftMessage),
})

const normalizeOrder = (order: WarehouseAdminOrderDto) => {
  const items = order.orderItems ?? []
  const firstItem = items[0] ?? null

  if (!firstItem) {
    return {
      preview: null,
      validationErrors: [
        {
          code: 'ORDER_ITEMS_MISSING',
          message: 'Order does not contain any warehouse items.',
          sourceRecordId: String(order.id),
          field: 'orderItems',
        },
      ],
    }
  }

  const sourceRecordId = String(order.id)
  const customer = toTrimmed(order.company ?? `${order.firstName ?? ''} ${order.lastName ?? ''}`)
  const artwork = toTrimmed(firstItem.productName)
  const productType = toTrimmed(firstItem.productType)
  const size = `${firstItem.printWidth ?? ''} x ${firstItem.printHeight ?? ''}`.trim()
  const orientation = firstItem.printWidth !== null && firstItem.printHeight !== null && firstItem.printWidth < firstItem.printHeight ? 'VERT' : 'HORIZ'
  const frame = toTrimmed(firstItem.frameItemFrameText ?? firstItem.printStyleText ?? firstItem.origStyleText)
  const dueDate = toTrimmed(firstItem.dueDate)
  const fulfillmentMethod = toTrimmed(firstItem.deliveryStatus)
  const shippingDestination = formatShippingDestination(order)
  const notes = Array.isArray(order.orderNotes) ? order.orderNotes.map((note) => note.note ?? '').filter(Boolean).join(' | ') : ''
  const redNotes = toTrimmed(order.giftMessage)

  const validationErrors: PreviewValidationError[] = []
  for (const [field, value] of Object.entries({ customer, artwork, productType, size, dueDate, fulfillmentMethod, shippingDestination })) {
    if (!value.trim()) {
      validationErrors.push({
        code: `ORDER_${field.toUpperCase()}_MISSING`,
        message: `Warehouse order is missing a usable ${field}.`,
        sourceRecordId,
        field,
      })
    }
  }

  const validationStatus: ImportValidationStatus = validationErrors.length > 0 ? 'VALID_WITH_WARNINGS' : 'VALID'

  return {
    preview: {
      sourceRecordId,
      orderNumber: sourceRecordId,
      customer,
      artwork,
      productType,
      size,
      orientation,
      frame,
      dueDate,
      fulfillmentMethod,
      shippingDestination,
      notes,
      redNotes,
      validationStatus,
      originalSourceFields: buildSourceFields(order, firstItem),
    },
    validationErrors,
  }
}

const buildHeaders = (cookieHeader: string | undefined): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (cookieHeader?.trim()) {
    headers.Cookie = cookieHeader.trim()
  }

  return headers
}

const normalizeError = (error: unknown, code: string, message: string): ImportProxyError => {
  if (error instanceof ImportProxyError) {
    return error
  }

  return new ImportProxyError({
    code,
    message: error instanceof Error ? `${message}: ${error.message}` : message,
    statusCode: 502,
  })
}

export const createWarehouseAdminTransport = (options: WarehouseAdminTransportOptions): WarehouseAdminTransport => {
  const fetchImpl = options.fetchImpl ?? fetch
  const baseUrl = options.baseUrl.replace(/\/$/, '')

  return {
    async fetchAuthProbe() {
      const response = await fetchImpl(`${baseUrl}/api/Auth/Me`, {
        method: 'GET',
        headers: buildHeaders(options.cookieHeader),
      })

      if (!response.ok) {
        throw normalizeError(new Error(`Auth probe failed with status ${response.status}`), 'AUTH_PROBE_FAILED', 'Auth probe failed')
      }

      return (await response.json()) as WarehouseAdminAuthProbeResponse
    },
    async fetchWarehousePageDto() {
      const response = await fetchImpl(`${baseUrl}/api/warehouse/warehouse-page-dto`, {
        method: 'GET',
        headers: buildHeaders(options.cookieHeader),
      })

      if (!response.ok) {
        throw normalizeError(new Error(`Warehouse page DTO failed with status ${response.status}`), 'WAREHOUSE_PAGE_DTO_FAILED', 'Warehouse page DTO failed')
      }

      return (await response.json()) as WarehousePageDtoResponse
    },
    async fetchWarehouseVsdReport() {
      const response = await fetchImpl(`${baseUrl}/api/warehouse/warehouse-vsd-report`, {
        method: 'GET',
        headers: buildHeaders(options.cookieHeader),
      })

      if (!response.ok) {
        throw normalizeError(new Error(`Warehouse VSD report failed with status ${response.status}`), 'WAREHOUSE_VSD_REPORT_FAILED', 'Warehouse VSD report failed')
      }

      return (await response.json()) as WarehouseVsdReportResponse
    },
  }
}

export const buildWarehouseAdminPreview = async (transport: WarehouseAdminTransport): Promise<WarehouseAdminFetchResult> => {
  const auth = await transport.fetchAuthProbe()
  if (!auth.isAuthenticated) {
    throw new ImportProxyError({
      code: 'INVALID_CREDENTIALS',
      message: 'Upstream session is not authenticated.',
      statusCode: 401,
    })
  }

  const pageDto = await transport.fetchWarehousePageDto()
  const report = await transport.fetchWarehouseVsdReport()

  const normalized = pageDto.orders.flatMap((order) => {
    const outcome = normalizeOrder(order)
    return outcome.preview ? [outcome.preview] : []
  })

  const validationErrors = pageDto.orders.flatMap((order) => normalizeOrder(order).validationErrors)
  const warnings: PreviewWarning[] = [
    {
      code: 'READ_ONLY_HTTP_EXPORT_CONFIRMED',
      message: 'Warehouse preview is sourced from read-only JSON export endpoints.',
    },
    {
      code: 'VSD_REPORT_INCLUDED',
      message: `Warehouse VSD report values available for review: this=${report.vsdThis}, last=${report.vsdLast}, prior=${report.vsdPrior}.`,
    },
  ]

  return {
    connectionStatus: validationErrors.length > 0 ? 'DEGRADED' : 'CONNECTED',
    fetchedAt: new Date().toISOString(),
    normalizedOrderPreviews: normalized,
    warnings,
    validationErrors,
    sourceRecordIds: normalized.map((preview) => preview.sourceRecordId),
  }
}