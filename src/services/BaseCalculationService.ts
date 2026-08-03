import { activeBaseMeasurementRules } from '../config/production/baseMeasurementRules'
import type { ConfirmedMeasurementRule } from '../config/production/measurementRuleTypes'
import type {
  ProductionCutCalculationResult,
  ProductionCutInputs,
  ProductionCutMember,
} from '../types/productionCut'

export interface BaseCalculationInput extends ProductionCutInputs {
  importedFrameName: string
}

const normalizeKey = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ')
const validDimension = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
const supportedProduct = (productType: string): boolean =>
  productType === 'THREE_D_PRINT' || productType === 'TEXTURED_REPLICA_3D'

const reviewResult = (input: BaseCalculationInput, explanation: string): ProductionCutCalculationResult => ({
  kind: 'BASE',
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
  { id: 'base-long-1', kind: 'LONG', cutLengthInches: long, quantity: 1 },
  { id: 'base-long-2', kind: 'LONG', cutLengthInches: long, quantity: 1 },
  { id: 'base-short-1', kind: 'SHORT', cutLengthInches: short, quantity: 1 },
  { id: 'base-short-2', kind: 'SHORT', cutLengthInches: short, quantity: 1 },
]

export class BaseCalculationService {
  calculate(input: BaseCalculationInput): ProductionCutCalculationResult {
    if (!supportedProduct(input.productType)) {
      return reviewResult(input, `Base calculations do not support product type ${input.productType}.`)
    }
    if (!validDimension(input.width) || !validDimension(input.height)) {
      return reviewResult(input, 'Base calculation requires positive finite width and height values.')
    }

    const rule = activeBaseMeasurementRules.find(
      (candidate) => normalizeKey(candidate.normalizedProductionFrameName ?? '') === normalizeKey(input.importedFrameName),
    )
    if (!rule || rule.adjustmentInches === undefined) {
      return reviewResult(input, `No confirmed base adjustment exists for ${input.importedFrameName}.`)
    }

    return this.confirmedResult({ ...input, width: input.width, height: input.height }, rule)
  }

  private confirmedResult(
    input: BaseCalculationInput & { width: number; height: number },
    rule: ConfirmedMeasurementRule,
  ): ProductionCutCalculationResult {
    const adjustedWidth = input.width + rule.adjustmentInches!
    const adjustedHeight = input.height + rule.adjustmentInches!
    const long = Math.max(adjustedWidth, adjustedHeight)
    const short = Math.min(adjustedWidth, adjustedHeight)
    const members = fourMembers(long, short)

    return {
      kind: 'BASE',
      status: 'CONFIRMED',
      canGenerateFinalSawTag: true,
      members,
      normalizedFrame: rule.normalizedProductionFrameName ?? null,
      frameFamily: rule.frameFamily,
      mouldingIdentifier: input.mouldingIdentifier ?? null,
      baseHeightInches: adjustedHeight,
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
          normalizedFrame: rule.normalizedProductionFrameName ?? rule.frameFamily,
        },
        calculatedOutputs: {
          adjustedWidthInches: adjustedWidth,
          adjustedHeightInches: adjustedHeight,
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