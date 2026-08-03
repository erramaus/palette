import { describe, expect, it } from 'vitest'
import { activeBaseMeasurementRules } from '../config/production/baseMeasurementRules'
import { BaseCalculationService } from './BaseCalculationService'

describe('BaseCalculationService', () => {
  const service = new BaseCalculationService()

  it.each(activeBaseMeasurementRules)('calculates confirmed base rule $id', (rule) => {
    const result = service.calculate({
      productType: 'TEXTURED_REPLICA_3D',
      width: 20,
      height: 30,
      importedFrameName: rule.normalizedProductionFrameName!,
    })

    expect(result.status).toBe('CONFIRMED')
    expect(result.trace.ruleId).toBe(rule.id)
    expect(result.members.map((member) => member.cutLengthInches)).toEqual([
      30 + rule.adjustmentInches!,
      30 + rule.adjustmentInches!,
      20 + rule.adjustmentInches!,
      20 + rule.adjustmentInches!,
    ])
    expect(result.baseHeightInches).toBe(30 + rule.adjustmentInches!)
  })

  it('returns NEEDS_REVIEW for unsupported products and missing confirmed rules', () => {
    const unsupported = service.calculate({ productType: 'PAPER', width: 20, height: 30, importedFrameName: 'Black' })
    const unresolved = service.calculate({ productType: 'THREE_D_PRINT', width: 20, height: 30, importedFrameName: 'Gold' })

    expect(unsupported.status).toBe('NEEDS_REVIEW')
    expect(unresolved.status).toBe('NEEDS_REVIEW')
    expect(unsupported.canGenerateFinalSawTag).toBe(false)
    expect(unresolved.trace.ruleId).toBeNull()
  })
})