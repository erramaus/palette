import { activeStretcherMeasurementRules } from '../config/production/stretcherMeasurementRules'
import type { MeasurementRuleSource } from '../config/production/measurementRuleTypes'
import type {
  ProductionCutCalculationResult,
  ProductionCutInputs,
  ProductionCutMember,
} from '../types/productionCut'

export type StretcherCalculationInput = ProductionCutInputs

const validDimension = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
const supportedProduct = (productType: string): boolean =>
  productType === 'CANVAS' || productType === 'ORIGINAL'

const reviewResult = (input: StretcherCalculationInput, explanation: string): ProductionCutCalculationResult => ({
  kind: 'STRETCHER',
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
    },
    calculatedOutputs: {},
    confidence: 'LOW',
    explanation,
  },
})

const fourMembers = (long: number, short: number): ProductionCutMember[] => [
  { id: 'stretcher-long-1', kind: 'LONG', cutLengthInches: long, quantity: 1 },
  { id: 'stretcher-long-2', kind: 'LONG', cutLengthInches: long, quantity: 1 },
  { id: 'stretcher-short-1', kind: 'SHORT', cutLengthInches: short, quantity: 1 },
  { id: 'stretcher-short-2', kind: 'SHORT', cutLengthInches: short, quantity: 1 },
]

export class StretcherCalculationService {
  calculate(input: StretcherCalculationInput): ProductionCutCalculationResult {
    if (!supportedProduct(input.productType)) {
      return reviewResult(input, `Stretcher calculations do not support product type ${input.productType}.`)
    }
    if (!validDimension(input.width) || !validDimension(input.height)) {
      return reviewResult(input, 'Stretcher calculation requires positive finite width and height values.')
    }

    const [cutRule, centerRule, cornerRule] = activeStretcherMeasurementRules
    const adjustment = cutRule.adjustmentInches!
    const long = Math.max(input.width, input.height) + adjustment
    const short = Math.min(input.width, input.height) + adjustment
    const maximumDimension = Math.max(input.width, input.height)
    const centerStrainerRequired = maximumDimension > 30
    const cornerStrainerRequired = maximumDimension > 45
    const members = fourMembers(long, short)

    return {
      kind: 'STRETCHER',
      status: 'CONFIRMED',
      canGenerateFinalSawTag: true,
      members,
      normalizedFrame: null,
      frameFamily: 'ALL',
      mouldingIdentifier: input.mouldingIdentifier ?? null,
      baseHeightInches: null,
      centerStrainerRequired,
      cornerStrainerRequired,
      oppositeAdditionalStrainerRequired: null,
      trace: {
        ruleId: cutRule.id,
        ruleIds: activeStretcherMeasurementRules.map((rule) => rule.id),
        sources: activeStretcherMeasurementRules.reduce<MeasurementRuleSource[]>(
          (sources, rule) => [...sources, ...rule.sources],
          [],
        ),
        originalInputs: input,
        normalizedInputs: {
          productType: input.productType,
          width: input.width,
          height: input.height,
          maximumDimension,
        },
        calculatedOutputs: {
          adjustedWidthInches: input.width + adjustment,
          adjustedHeightInches: input.height + adjustment,
          longCutLengthInches: long,
          shortCutLengthInches: short,
          memberCount: members.length,
          centerStrainerRequired,
          cornerStrainerRequired,
          oppositeAdditionalStrainerRequired: null,
        },
        confidence: 'HIGH',
        explanation: `Applied ${cutRule.id}, ${centerRule.id}, and ${cornerRule.id} without rounding. No confirmed rule defines an opposite/additional strainer requirement, so that output remains null.`,
      },
    }
  }
}