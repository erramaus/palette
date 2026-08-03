import type { PackagingMethodCode } from '../types/entities'
import type {
  CanonicalOrderImport,
  CanonicalOrderImportInput,
  CanonicalOrderSource,
  CanonicalOrientation,
  CanonicalProductionPiece,
  CanonicalSize,
  NormalizationConfidence,
  NormalizationResult,
  RuleTraceability,
} from '../types/orderImport'
import type { Priority, ProductType } from '../types/production'

const ORDER_SCHEMA_TRACE: RuleTraceability = {
  sourceWorkbook: '2026-07-28-OrdersList.xlsx',
  worksheet: '7 28 2026',
  ruleId: 'order-import-schema',
  confidence: 'MEDIUM',
}

const PRODUCT_TYPE_TRACE: RuleTraceability = {
  sourceWorkbook: '2026-07-28-OrdersList.xlsx',
  worksheet: '7 28 2026',
  ruleId: 'order-import-schema',
  confidence: 'MEDIUM',
}

const normalized = <TOriginal, TNormalized>(
  original: TOriginal,
  value: TNormalized,
  traceability: RuleTraceability = ORDER_SCHEMA_TRACE,
): NormalizationResult<TOriginal, TNormalized> => ({
  original,
  normalized: value,
  status: 'NORMALIZED',
  traceability,
})

const needsReview = <TOriginal, TNormalized>(
  original: TOriginal,
  reason: string,
  traceability: RuleTraceability = ORDER_SCHEMA_TRACE,
  value: TNormalized | null = null,
): NormalizationResult<TOriginal, TNormalized> => ({
  original,
  normalized: value,
  status: 'NEEDS_REVIEW',
  traceability,
  reviewReason: reason,
})

const canonicalText = (value: string): string => value.trim().replace(/\s+/g, ' ')

const normalizeRequiredText = (
  value: string,
  label: string,
): NormalizationResult<string, string> => {
  const canonical = canonicalText(value)
  return canonical
    ? normalized(value, canonical)
    : needsReview(value, `${label} is required.`)
}

const normalizeDate = (
  value: string,
  label: string,
): NormalizationResult<string, string> => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return needsReview(value, `${label} must use YYYY-MM-DD.`)
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  const valid = date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
  return valid ? normalized(value, value.trim()) : needsReview(value, `${label} is not a valid calendar date.`)
}

const normalizeOptionalDate = (
  value: string | undefined,
  dueDate: NormalizationResult<string, string>,
): NormalizationResult<string | undefined, string | undefined> => {
  if (!value?.trim()) {
    return normalized(value, undefined)
  }
  const result = normalizeDate(value, 'Requested delivery/pickup date')
  if (result.status === 'NEEDS_REVIEW') return result
  if (dueDate.normalized && result.normalized && result.normalized > dueDate.normalized) {
    return needsReview(
      value,
      'Customer-requested date is later than the due date; precedence is unresolved.',
      ORDER_SCHEMA_TRACE,
      result.normalized,
    )
  }
  return result
}

const PRODUCT_TYPE_MAP: Record<string, ProductType> = {
  '0 CNVS': 'GALLERY_INVENTORY',
  '1 ORIG': 'ORIGINAL',
  '2 3D': 'THREE_D_PRINT',
  '2 3D LIM': 'TEXTURED_REPLICA_3D',
  '3 CANV': 'CANVAS',
  '4 PAPER': 'PAPER',
  ORIGINAL: 'ORIGINAL',
  TEXTURED_REPLICA_3D: 'TEXTURED_REPLICA_3D',
  THREE_D_PRINT: 'THREE_D_PRINT',
  CANVAS: 'CANVAS',
  PAPER: 'PAPER',
  GALLERY_INVENTORY: 'GALLERY_INVENTORY',
}

const normalizeProductType = (value: string): NormalizationResult<string, ProductType> => {
  const key = canonicalText(value).toUpperCase()
  const productType = PRODUCT_TYPE_MAP[key]
  return productType
    ? normalized(value, productType, PRODUCT_TYPE_TRACE)
    : needsReview(value, `Unknown product type: ${value || '(blank)'}.`, PRODUCT_TYPE_TRACE)
}

const normalizeSize = (
  width: unknown,
  height: unknown,
): NormalizationResult<{ width: unknown; height: unknown }, CanonicalSize> => {
  const numericWidth = typeof width === 'number' ? width : Number(width)
  const numericHeight = typeof height === 'number' ? height : Number(height)
  const original = { width, height }
  if (!Number.isFinite(numericWidth) || !Number.isFinite(numericHeight) || numericWidth <= 0 || numericHeight <= 0) {
    return needsReview(original, 'Width and height must be positive numbers.')
  }
  return normalized(original, {
    width: numericWidth,
    height: numericHeight,
    display: `${Math.min(numericWidth, numericHeight)} x ${Math.max(numericWidth, numericHeight)}`,
  })
}

const normalizeOrientation = (
  value: string | undefined,
  size: NormalizationResult<{ width: unknown; height: unknown }, CanonicalSize>,
): NormalizationResult<string | undefined, CanonicalOrientation> => {
  const aliases: Record<string, CanonicalOrientation> = {
    HORIZ: 'HORIZONTAL',
    HORIZONTAL: 'HORIZONTAL',
    VERT: 'VERTICAL',
    VERTICAL: 'VERTICAL',
    SQUARE: 'SQUARE',
    PANORAMA: 'PANORAMA',
  }
  const explicit = value ? aliases[value.trim().toUpperCase()] : undefined
  if (explicit) return normalized(value, explicit)
  if (value?.trim()) return needsReview(value, `Unknown orientation: ${value}.`)
  if (!size.normalized) return needsReview(value, 'Orientation cannot be inferred without valid dimensions.')
  const inferred: CanonicalOrientation = size.normalized.width === size.normalized.height
    ? 'SQUARE'
    : size.normalized.width > size.normalized.height ? 'HORIZONTAL' : 'VERTICAL'
  return normalized(value, inferred)
}

const normalizeSource = (value: string): NormalizationResult<string, CanonicalOrderSource> => {
  const aliases: Record<string, CanonicalOrderSource> = {
    DATED_ORDER_LIST: 'DATED_ORDER_LIST',
    COLLECTOR_CONTACT: 'COLLECTOR_CONTACT',
    WAREHOUSE_REPORT: 'WAREHOUSE_REPORT',
    PALETTE_UI: 'PALETTE_UI',
  }
  const source = aliases[canonicalText(value).toUpperCase()]
  return source ? normalized(value, source) : needsReview(value, `Unknown order source: ${value || '(blank)'}.`)
}

const normalizePriority = (value: string): NormalizationResult<string, Priority> => {
  const aliases: Record<string, Priority> = {
    ORIGINALS: 'ORIGINALS',
    CUSTOMER_PURCHASED: 'CUSTOMER_PURCHASED',
    GALLERY_INVENTORY: 'GALLERY_INVENTORY',
  }
  const priority = aliases[canonicalText(value).toUpperCase()]
  return priority ? normalized(value, priority) : needsReview(value, `Unknown priority: ${value || '(blank)'}.`)
}

const normalizeShippingMethod = (
  value: string | undefined,
): NormalizationResult<string | undefined, PackagingMethodCode> => {
  if (!value?.trim()) {
    return needsReview(value, 'Shipping/pickup method was not supplied; note text is not used to guess it.')
  }
  const methods: PackagingMethodCode[] = ['STANDARD_BOX', 'CNC', 'CRATE', 'GALLERY', 'PICKUP', 'DELIVERY']
  const method = value.trim().toUpperCase() as PackagingMethodCode
  return methods.includes(method)
    ? normalized(value, method)
    : needsReview(value, `Unknown shipping/pickup method: ${value}.`)
}

const normalizeOptionalNote = (
  value: string | undefined,
): NormalizationResult<string | undefined, string | undefined> => {
  if (value === undefined) return normalized(value, undefined)
  return normalized(value, canonicalText(value) || undefined)
}

export class OrderImportService {
  normalize(input: CanonicalOrderImportInput): CanonicalOrderImport {
    const source = normalizeSource(input.source)
    const orderIdentifier = normalizeRequiredText(input.orderIdentifier, 'Order identifier')
    const customerIdentifier = normalizeRequiredText(input.customerIdentifier, 'Customer identifier')
    const artwork = normalizeRequiredText(input.artwork, 'Artwork')
    const productType = normalizeProductType(input.productType)
    const size = normalizeSize(input.width, input.height)
    const orientation = normalizeOrientation(input.orientation, size)
    const frameSelection = normalizeRequiredText(input.frameSelection, 'Frame selection')
    const dueDate = normalizeDate(input.dueDate, 'Due date')
    const requestedDeliveryOrPickupDate = normalizeOptionalDate(input.requestedDeliveryOrPickupDate, dueDate)
    const redNotes = normalizeOptionalNote(input.redNotes)
    const priority = normalizePriority(input.priority)
    const shippingOrPickupMethod = normalizeShippingMethod(input.shippingOrPickupMethod)
    const pieceOriginal = `${input.orderIdentifier}:${input.artwork}:${input.productType}:${String(input.width)}x${String(input.height)}`
    const productionPiece = orderIdentifier.normalized && artwork.normalized && productType.normalized && size.normalized
      ? normalized(pieceOriginal, {
          key: `${orderIdentifier.normalized}:${artwork.normalized}:${productType.normalized}:${size.normalized.width}x${size.normalized.height}`,
          artwork: artwork.normalized,
          productType: productType.normalized,
          size: size.normalized,
        })
      : needsReview<string, CanonicalProductionPiece>(
          pieceOriginal,
          'Production piece cannot be normalized until identifier, artwork, product type, and size are valid.',
        )

    const fields = [
      source,
      orderIdentifier,
      customerIdentifier,
      artwork,
      productType,
      productionPiece,
      size,
      orientation,
      frameSelection,
      dueDate,
      requestedDeliveryOrPickupDate,
      redNotes,
      priority,
      shippingOrPickupMethod,
    ]

    return {
      source,
      orderIdentifier,
      customerIdentifier,
      artwork,
      productType,
      productionPiece,
      size,
      orientation,
      frameSelection,
      dueDate,
      requestedDeliveryOrPickupDate,
      redNotes,
      priority,
      shippingOrPickupMethod,
      originalImport: input.originalImport ?? { ...input },
      status: fields.some((field) => field.status === 'NEEDS_REVIEW') ? 'NEEDS_REVIEW' : 'NORMALIZED',
    }
  }
}

export const orderImportTrace = (
  sourceWorkbook: string,
  worksheet: string,
  ruleId: string,
  confidence: NormalizationConfidence,
): RuleTraceability => ({ sourceWorkbook, worksheet, ruleId, confidence })