import { describe, expect, it } from 'vitest'
import { activeFrameMeasurementRules } from '../config/production/frameMeasurementRules'
import { FrameCalculationService } from './FrameCalculationService'

describe('FrameCalculationService', () => {
  const service = new FrameCalculationService()

  it.each(activeFrameMeasurementRules)('calculates confirmed frame rule $id', (rule) => {
    const result = service.calculate({
      productType: 'CANVAS',
      width: 20,
      height: 30,
      importedFrameName: rule.normalizedProductionFrameName!,
      mouldingIdentifier: 'M-100',
    })

    expect(result.status).toBe('CONFIRMED')
    expect(result.members.map((member) => member.cutLengthInches)).toEqual([
      30 + rule.adjustmentInches!,
      30 + rule.adjustmentInches!,
      20 + rule.adjustmentInches!,
      20 + rule.adjustmentInches!,
    ])
    expect(result.trace.ruleId).toBe(rule.id)
    expect(result.trace.sources).toEqual(rule.sources)
    expect(result.trace.originalInputs.importedFrameName).toBe(rule.normalizedProductionFrameName)
    expect(result.mouldingIdentifier).toBe('M-100')
  })

  it('normalizes a confirmed paper frame while preserving the imported value', () => {
    const result = service.calculate({ productType: 'PAPER', width: 10, height: 12, importedFrameName: ' White ' })

    expect(result.status).toBe('CONFIRMED')
    expect(result.normalizedFrame).toBe('Picture White')
    expect(result.trace.originalInputs.importedFrameName).toBe(' White ')
    expect(result.members[0].cutLengthInches).toBe(14.6875)
  })

  it('returns NEEDS_REVIEW for unresolved mappings, missing rules, and invalid dimensions', () => {
    const unresolved = service.calculate({ productType: 'PAPER', width: 10, height: 12, importedFrameName: 'Rolled' })
    const missingRule = service.calculate({ productType: 'CANVAS', width: 10, height: 12, importedFrameName: 'Black' })
    const invalid = service.calculate({ productType: 'CANVAS', width: 0, height: 12, importedFrameName: 'Silver EH' })

    for (const result of [unresolved, missingRule, invalid]) {
      expect(result.status).toBe('NEEDS_REVIEW')
      expect(result.canGenerateFinalSawTag).toBe(false)
      expect(result.members).toEqual([])
    }
  })
})