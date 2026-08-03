import { describe, expect, it } from 'vitest'
import type { CanonicalOrderImportInput } from '../types/orderImport'
import { OrderImportService } from './OrderImportService'

const service = new OrderImportService()

const validInput = (overrides: Partial<CanonicalOrderImportInput> = {}): CanonicalOrderImportInput => ({
  source: 'DATED_ORDER_LIST',
  orderIdentifier: ' WEB-1001 ',
  customerIdentifier: ' Avery  Collins ',
  artwork: ' Pacific  Crest ',
  productType: '2 3D Lim',
  width: 40,
  height: 30,
  frameSelection: 'Maple Float Frame',
  dueDate: '2026-08-14',
  priority: 'CUSTOMER_PURCHASED',
  shippingOrPickupMethod: 'STANDARD_BOX',
  ...overrides,
})

describe('OrderImportService', () => {
  it('normalizes a known 3D order and preserves original values with traceability', () => {
    const result = service.normalize(validInput())

    expect(result.productType.normalized).toBe('TEXTURED_REPLICA_3D')
    expect(result.orderIdentifier).toMatchObject({ original: ' WEB-1001 ', normalized: 'WEB-1001' })
    expect(result.orientation.normalized).toBe('HORIZONTAL')
    expect(result.productType.traceability).toMatchObject({
      sourceWorkbook: '2026-07-28-OrdersList.xlsx',
      worksheet: '7 28 2026',
      ruleId: 'order-import-schema',
      confidence: 'MEDIUM',
    })
  })

  it('normalizes a known canvas order', () => {
    const result = service.normalize(validInput({ productType: '3 Canv', width: 24, height: 36 }))
    expect(result.productType.normalized).toBe('CANVAS')
    expect(result.orientation.normalized).toBe('VERTICAL')
  })

  it('normalizes a known original', () => {
    const result = service.normalize(validInput({ productType: '1 Orig', priority: 'ORIGINALS' }))
    expect(result.productType.normalized).toBe('ORIGINAL')
    expect(result.priority.normalized).toBe('ORIGINALS')
  })

  it('normalizes a gallery inventory order', () => {
    const result = service.normalize(validInput({
      productType: '0 Cnvs',
      priority: 'GALLERY_INVENTORY',
      shippingOrPickupMethod: 'GALLERY',
    }))
    expect(result.productType.normalized).toBe('GALLERY_INVENTORY')
    expect(result.shippingOrPickupMethod.normalized).toBe('GALLERY')
  })

  it('normalizes an explicit pickup order without reading note text', () => {
    const result = service.normalize(validInput({ shippingOrPickupMethod: 'PICKUP' }))
    expect(result.shippingOrPickupMethod.normalized).toBe('PICKUP')
  })

  it('normalizes an explicit shipping order', () => {
    const result = service.normalize(validInput({ shippingOrPickupMethod: 'DELIVERY' }))
    expect(result.shippingOrPickupMethod.normalized).toBe('DELIVERY')
  })

  it('preserves and normalizes red notes', () => {
    const result = service.normalize(validInput({ redNotes: '  Verify   collector address  ' }))
    expect(result.redNotes).toMatchObject({
      original: '  Verify   collector address  ',
      normalized: 'Verify collector address',
      status: 'NORMALIZED',
    })
  })

  it('marks an unknown product type as NEEDS_REVIEW without guessing', () => {
    const result = service.normalize(validInput({ productType: 'Mystery Edition' }))
    expect(result.productType).toMatchObject({ normalized: null, status: 'NEEDS_REVIEW' })
    expect(result.productionPiece.status).toBe('NEEDS_REVIEW')
    expect(result.status).toBe('NEEDS_REVIEW')
  })

  it('marks a malformed date as NEEDS_REVIEW', () => {
    const result = service.normalize(validInput({ dueDate: '2026-02-30' }))
    expect(result.dueDate).toMatchObject({ normalized: null, status: 'NEEDS_REVIEW' })
  })

  it('preserves a delayed customer-requested date and marks precedence NEEDS_REVIEW', () => {
    const result = service.normalize(validInput({ requestedDeliveryOrPickupDate: '2026-08-20' }))
    expect(result.requestedDeliveryOrPickupDate).toMatchObject({
      original: '2026-08-20',
      normalized: '2026-08-20',
      status: 'NEEDS_REVIEW',
    })
  })
})