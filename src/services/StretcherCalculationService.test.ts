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
    expect(result.oppositeAdditionalStrainerRequired).toBeNull()
  })

  it('uses strict confirmed thresholds', () => {
    const atThirty = service.calculate({ productType: 'ORIGINAL', width: 20, height: 30 })
    const atFortyFive = service.calculate({ productType: 'ORIGINAL', width: 20, height: 45 })

    expect(atThirty.centerStrainerRequired).toBe(false)
    expect(atFortyFive.centerStrainerRequired).toBe(true)
    expect(atFortyFive.cornerStrainerRequired).toBe(false)
  })

  it('returns NEEDS_REVIEW for unsupported products and missing dimensions', () => {
    const unsupported = service.calculate({ productType: 'PAPER', width: 20, height: 30 })
    const missing = service.calculate({ productType: 'CANVAS', width: 20 })

    expect(unsupported.status).toBe('NEEDS_REVIEW')
    expect(missing.status).toBe('NEEDS_REVIEW')
    expect(missing.canGenerateFinalSawTag).toBe(false)
  })
})