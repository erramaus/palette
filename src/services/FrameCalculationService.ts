import { activeFrameMeasurementRules } from '../config/production/frameMeasurementRules'
import { activeFrameNormalizationRules } from '../config/production/frameNormalizationRules'
import type { ConfirmedMeasurementRule } from '../config/production/measurementRuleTypes'
import type {
  ProductionCutCalculationResult,
  ProductionCutInputs,
  ProductionCutMember,
} from '../types/productionCut'

export interface FrameCalculationInput extends ProductionCutInputs {
  importedFrameName: string
}

const normalizeKey = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ')
const validDimension = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

const reviewResult = (input: FrameCalculationInput, explanation: string): ProductionCutCalculationResult => ({
  kind: 'FRAME',
  status: 'NEEDS_REVIEW',
  canGenerateFinalSawTag: false,
  members: [],
  normalizedFrame: null,
  frameFamily: null,
  mouldingIdentifier: input.mouldingIdentifier ?? null,
  baseHeightInches: null,
  centerStrainerRequired: null,
  cornerStrainerRequired: null,
  oppositeAdditionalStrainerRequired: null,
  trace: {
    ruleId: null,
    ruleIds: [],
    sources: [],
    originalInputs: input,
    normalizedInputs: {
      productType: input.productType,
      width: input.width ?? null,
      height: input.height ?? null,
      importedFrameName: normalizeKey(input.importedFrameName),
    },
    calculatedOutputs: {},
    confidence: 'LOW',
    explanation,
  },
})

const fourMembers = (long: number, short: number): ProductionCutMember[] => [
  { id: 'frame-long-1', kind: 'LONG', cutLengthInches: long, quantity: 1 },
  { id: 'frame-long-2', kind: 'LONG', cutLengthInches: long, quantity: 1 },
  { id: 'frame-short-1', kind: 'SHORT', cutLengthInches: short, quantity: 1 },
  { id: 'frame-short-2', kind: 'SHORT', cutLengthInches: short, quantity: 1 },
]

export class FrameCalculationService {
  calculate(input: FrameCalculationInput): ProductionCutCalculationResult {
    if (!validDimension(input.width) || !validDimension(input.height)) {
      return reviewResult(input, 'Frame calculation requires positive finite width and height values.')
    }

    const normalizedFrame = this.resolveFrameName(input)
    if (!normalizedFrame) {
      return reviewResult(input, 'The imported frame name has no confirmed product-specific normalization mapping.')
    }

    const rule = activeFrameMeasurementRules.find(
      (candidate) => normalizeKey(candidate.normalizedProductionFrameName ?? '') === normalizeKey(normalizedFrame),
    )
    if (!rule || rule.adjustmentInches === undefined) {
      return reviewResult(input, `No confirmed frame allowance exists for ${normalizedFrame}.`)
    }

    return this.confirmedResult({ ...input, width: input.width, height: input.height }, normalizedFrame, rule)
  }

  private resolveFrameName(input: FrameCalculationInput): string | null {
    const importedKey = normalizeKey(input.importedFrameName)
    const directRule = activeFrameMeasurementRules.find(
      (rule) => normalizeKey(rule.normalizedProductionFrameName ?? '') === importedKey,
    )
    if (directRule) return directRule.normalizedProductionFrameName ?? null

    const mapping = activeFrameNormalizationRules.find(
      (rule) => rule.productType === input.productType
        && normalizeKey(rule.importedFrameName ?? '') === importedKey,
    )
    return mapping?.normalizedProductionFrameName ?? null
  }

  private confirmedResult(
    input: FrameCalculationInput & { width: number; height: number },
    normalizedFrame: string,
    rule: ConfirmedMeasurementRule,
  ): ProductionCutCalculationResult {
    const long = Math.max(input.width, input.height) + rule.adjustmentInches!
    const short = Math.min(input.width, input.height) + rule.adjustmentInches!
    const members = fourMembers(long, short)

    return {
      kind: 'FRAME',
      status: 'CONFIRMED',
      canGenerateFinalSawTag: true,
      members,
      normalizedFrame,
      frameFamily: rule.frameFamily,
      mouldingIdentifier: input.mouldingIdentifier ?? null,
      baseHeightInches: null,
      centerStrainerRequired: null,
      cornerStrainerRequired: null,
      oppositeAdditionalStrainerRequired: null,
      trace: {
        ruleId: rule.id,
        ruleIds: [rule.id],
        sources: rule.sources,
        originalInputs: input,
        normalizedInputs: {
          productType: input.productType,
          width: input.width,
          height: input.height,
          normalizedFrame,
        },
        calculatedOutputs: {
          adjustedWidthInches: input.width + rule.adjustmentInches!,
          adjustedHeightInches: input.height + rule.adjustmentInches!,
          longCutLengthInches: long,
          shortCutLengthInches: short,
          memberCount: members.length,
        },
        confidence: rule.confidence,
        explanation: `Applied ${rule.adjustmentInches} inches to both artwork dimensions without rounding.`,
      },
    }
  }
}