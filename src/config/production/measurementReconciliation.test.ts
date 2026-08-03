import { describe, expect, it } from 'vitest'
import {
  findConflictingMeasurementRuleKeys,
  findDuplicateMeasurementRuleIds,
  hasCompleteMeasurementTraceability,
  type MeasurementRuleDraft,
} from './measurementRuleTypes'
import {
  activeStretcherMeasurementRules,
  stretcherMeasurementRulesNeedsReview,
} from './stretcherMeasurementRules'
import { activeFrameMeasurementRules, frameMeasurementRulesNeedsReview } from './frameMeasurementRules'
import { activeBaseMeasurementRules, baseMeasurementRulesNeedsReview } from './baseMeasurementRules'
import { activeDibondMeasurementRules, dibondMeasurementRulesNeedsReview } from './dibondMeasurementRules'
import { activeFrameNormalizationRules, frameNormalizationRulesNeedsReview } from './frameNormalizationRules'

const activeRules: readonly MeasurementRuleDraft[] = [
  ...activeFrameMeasurementRules,
  ...activeBaseMeasurementRules,
  ...activeStretcherMeasurementRules,
  ...activeDibondMeasurementRules,
  ...activeFrameNormalizationRules,
]

const unresolvedRules: readonly MeasurementRuleDraft[] = [
  ...frameMeasurementRulesNeedsReview,
  ...baseMeasurementRulesNeedsReview,
  ...stretcherMeasurementRulesNeedsReview,
  ...dibondMeasurementRulesNeedsReview,
  ...frameNormalizationRulesNeedsReview,
]

describe('measurement rule reconciliation', () => {
  it('detects duplicate rule IDs', () => {
    const duplicate = activeStretcherMeasurementRules[0]
    expect(findDuplicateMeasurementRuleIds([duplicate, duplicate])).toEqual([duplicate.id])
  })

  it('contains no duplicate IDs in the reconciliation drafts', () => {
    expect(findDuplicateMeasurementRuleIds([...activeRules, ...unresolvedRules])).toEqual([])
  })

  it('detects conflicting source values for the same reconciliation key', () => {
    const source = activeStretcherMeasurementRules[0]
    const conflict: MeasurementRuleDraft = { ...source, id: 'conflict-probe', adjustmentInches: -0.125 }
    expect(findConflictingMeasurementRuleKeys([source, conflict])).toEqual([source.reconciliationKey])
  })

  it('records distinct competing values on every source conflict', () => {
    const conflicts = unresolvedRules.filter((rule) => rule.status === 'CONFLICT')
    expect(conflicts.length).toBeGreaterThan(0)
    expect(conflicts.every((rule) => new Set(rule.competingValues?.map((entry) => entry.value)).size > 1)).toBe(true)
  })

  it('keeps stable versioned rule IDs', () => {
    expect(activeRules.map((rule) => rule.id)).toEqual([
      'frame.silver-eh.increase.v1',
      'frame.b-and-g-plein.increase.v1',
      'frame.b-and-g-plein-faux.increase.v1',
      'frame.gold-eh-a.increase.v1',
      'frame.gold-reh-new.increase.v1',
      'frame.picture-white.increase.v1',
      'frame.picture-black.increase.v1',
      'base.black.adjustment.v1',
      'base.b-and-g-plein-faux.adjustment.v1',
      'base.silver-plein-faux.adjustment.v1',
      'base.gold-plein-faux.adjustment.v1',
      'base.gold-reh.adjustment.v1',
      'base.silver-reh.adjustment.v1',
      'stretcher.canvas.cut-deduction.v1',
      'stretcher.canvas.strainer-threshold.v1',
      'stretcher.canvas.corner-threshold.v1',
      'frame-normalization.paper-white.v1',
      'frame-normalization.paper-black.v1',
    ])
  })

  it('requires source traceability on every active rule', () => {
    expect(activeRules.every(hasCompleteMeasurementTraceability)).toBe(true)
  })

  it('excludes unresolved rules from active configuration', () => {
    const activeIds = new Set<string>(activeRules.map((rule) => rule.id))
    expect(unresolvedRules.every((rule) => !activeIds.has(rule.id))).toBe(true)
    expect(unresolvedRules.every((rule) => rule.status !== 'CONFIRMED')).toBe(true)
  })
})