import { describe, expect, it } from 'vitest'
import { activeStretcherMeasurementRules } from '../config/production/stretcherMeasurementRules'
import { StretcherCalculationService } from './StretcherCalculationService'

describe('StretcherCalculationService', () => {
  const service = new StretcherCalculationService()

  it('applies every confirmed stretcher rule without rounding', () => {
    const result = service.calculate({ productType: 'CANVAS', width: 31, height: 46 })

    expect(result.status).toBe('CONFIRMED')
    expect(result.trace.ruleIds).toEqual(activeStretcherMeasurementRules.map((rule) => rule.id))
    expect(result.members.map((member) => member.cutLengthInches)).toEqual([
      45.9375, 45.9375, 30.9375, 30.9375,
    ])
    expect(result.centerStrainerRequired).toBe(true)
    expect(result.cornerStrainerRequired).toBe(true)
    expect(result.oppositeAdditionalStrainerRequired).toBe(false)
    expect(result.addedStandardMinutes).toBe(20)
  })

  it('cuts a centered strainer across the interior perpendicular span', () => {
    const widthDominant = service.calculate({ productType: 'CANVAS', width: 40, height: 20 })
    const heightDominant = service.calculate({ productType: 'CANVAS', width: 20, height: 40 })

    expect(widthDominant.strainerMembers?.find((member) => member.type === 'CENTER')).toMatchObject({
      cutLengthInches: 17.8125,
      quantity: 1,
      placement: 'CENTERED',
      orientation: 'VERTICAL',
      materialDimensions: { widthInches: 1.4375, thicknessInches: 0.75 },
    })
    expect(heightDominant.strainerMembers?.find((member) => member.type === 'CENTER')).toMatchObject({
      cutLengthInches: 17.8125,
      orientation: 'HORIZONTAL',
    })
  })

  it('uses the horizontal span for a square canvas', () => {
    const result = service.calculate({ productType: 'CANVAS', width: 40, height: 40 })

    expect(result.strainerMembers?.find((member) => member.type === 'CENTER')).toMatchObject({
      cutLengthInches: 37.8125,
      orientation: 'HORIZONTAL',
    })
  })

  it('adds two half-span lengthwise strainers only above 60 inches', () => {
    const atSixty = service.calculate({ productType: 'CANVAS', width: 60, height: 40 })
    const overSixty = service.calculate({ productType: 'CANVAS', width: 70, height: 40 })
    const additional = overSixty.strainerMembers?.find((member) => member.type === 'ADDITIONAL_LENGTHWISE')

    expect(atSixty.strainerMembers?.some((member) => member.type === 'ADDITIONAL_LENGTHWISE')).toBe(false)
    expect(atSixty.addedStandardMinutes).toBe(20)
    expect(additional).toMatchObject({
      cutLengthInches: 33.1875,
      quantity: 2,
      placement: 'EVENLY_SPACED_EACH_SIDE',
      orientation: 'HORIZONTAL',
      formula: '(longInteriorSpan - 1.4375) / 2',
    })
    expect(overSixty.strainerMembers?.find((member) => member.type === 'CORNER')?.quantity).toBe(4)
    expect(overSixty.addedStandardMinutes).toBe(28)
    expect(overSixty.trace.calculatedOutputs.additionalStrainerLengthInches).toBe(33.1875)
  })

  it('uses strict confirmed canvas thresholds', () => {
    const atThirty = service.calculate({ productType: 'CANVAS', width: 20, height: 30 })
    const atFortyFive = service.calculate({ productType: 'CANVAS', width: 20, height: 45 })

    expect(atThirty.centerStrainerRequired).toBe(false)
    expect(atFortyFive.centerStrainerRequired).toBe(true)
    expect(atFortyFive.cornerStrainerRequired).toBe(false)
  })

  it('always adds center and corner supports for an original under 60 inches', () => {
    const result = service.calculate({ productType: 'ORIGINAL', width: 24, height: 30 })

    expect(result.centerStrainerRequired).toBe(true)
    expect(result.cornerStrainerRequired).toBe(true)
    expect(result.oppositeAdditionalStrainerRequired).toBe(false)
    expect(result.strainerMembers).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'CENTER', quantity: 1 }),
      expect.objectContaining({ type: 'CORNER', quantity: 4 }),
    ]))
  })

  it('adds two lengthwise strainers for an original over 60 inches', () => {
    const result = service.calculate({ productType: 'ORIGINAL', width: 48, height: 72 })

    expect(result.oppositeAdditionalStrainerRequired).toBe(true)
    expect(result.strainerMembers).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'ADDITIONAL_LENGTHWISE', quantity: 2 }),
    ]))
  })

  it('returns NEEDS_REVIEW for unsupported products and missing dimensions', () => {
    const unsupported = service.calculate({ productType: 'PAPER', width: 20, height: 30 })
    const missing = service.calculate({ productType: 'CANVAS', width: 20 })

    expect(unsupported.status).toBe('NEEDS_REVIEW')
    expect(missing.status).toBe('NEEDS_REVIEW')
    expect(missing.canGenerateFinalSawTag).toBe(false)
  })
})