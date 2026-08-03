export type MeasurementResolutionStatus = 'CONFIRMED' | 'CONFLICT' | 'OBSOLETE' | 'NEEDS_REVIEW'
export type MeasurementConfidence = 'HIGH' | 'MEDIUM' | 'LOW'

export interface MeasurementRuleSource {
  workbook: string
  worksheet: string
  cells: string
  ruleId: string
  confirmationDate?: string
}

export interface MeasurementRuleDraft {
  id: string
  reconciliationKey: string
  status: MeasurementResolutionStatus
  confidence: MeasurementConfidence
  sources: readonly MeasurementRuleSource[]
  productType: string
  frameFamily: string
  importedFrameName?: string
  normalizedProductionFrameName?: string
  adjustmentInches?: number
  formula?: string
  notes?: string
  competingValues?: readonly {
    source: string
    value: string | number
  }[]
}

export type ConfirmedMeasurementRule = MeasurementRuleDraft & { status: 'CONFIRMED' }
export type UnresolvedMeasurementRule = MeasurementRuleDraft & {
  status: 'CONFLICT' | 'OBSOLETE' | 'NEEDS_REVIEW'
}

export const findDuplicateMeasurementRuleIds = (
  rules: readonly MeasurementRuleDraft[],
): string[] => {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  rules.forEach((rule) => {
    if (seen.has(rule.id)) duplicates.add(rule.id)
    seen.add(rule.id)
  })
  return [...duplicates].sort()
}

export const findConflictingMeasurementRuleKeys = (
  rules: readonly MeasurementRuleDraft[],
): string[] => {
  const signaturesByKey = new Map<string, Set<string>>()
  rules.forEach((rule) => {
    const signatures = signaturesByKey.get(rule.reconciliationKey) ?? new Set<string>()
    signatures.add(JSON.stringify({ adjustmentInches: rule.adjustmentInches, formula: rule.formula }))
    signaturesByKey.set(rule.reconciliationKey, signatures)
  })
  return [...signaturesByKey.entries()]
    .filter(([, signatures]) => signatures.size > 1)
    .map(([key]) => key)
    .sort()
}

export const hasCompleteMeasurementTraceability = (rule: MeasurementRuleDraft): boolean =>
  rule.sources.length > 0
  && rule.sources.every((source) => Boolean(
    source.workbook && source.worksheet && source.cells && source.ruleId,
  ))