import {
  activeStretcherMeasurementRules,
  STRETCHER_PRODUCTION_CONSTANTS,
} from '../config/production/stretcherMeasurementRules'
import type { MeasurementRuleSource } from '../config/production/measurementRuleTypes'
import type {
  ProductionCutCalculationResult,
  ProductionCutInputs,
  ProductionCutMember,
  ProductionStrainerMember,
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
  strainerMembers: [],
  addedStandardMinutes: 0,
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

    const cutRule = activeStretcherMeasurementRules.find((rule) => rule.id === 'stretcher.canvas.cut-deduction.v1')!
    const centerRule = activeStretcherMeasurementRules.find((rule) => rule.id === 'stretcher.canvas.strainer-threshold.v1')!
    const cornerRule = activeStretcherMeasurementRules.find((rule) => rule.id === 'stretcher.canvas.corner-threshold.v1')!
    const centerLengthRule = activeStretcherMeasurementRules.find((rule) => rule.id === 'stretcher.canvas.center-strainer.v1')!
    const additionalRule = activeStretcherMeasurementRules.find((rule) => rule.id === 'stretcher.canvas.over-60-additional-strainers.v1')!
    const laborRule = activeStretcherMeasurementRules.find((rule) => rule.id === 'stretcher.canvas.strainer-labor.v1')!
    const adjustment = cutRule.adjustmentInches!
    const outerWidth = input.width + adjustment
    const outerHeight = input.height + adjustment
    const long = Math.max(outerWidth, outerHeight)
    const short = Math.min(outerWidth, outerHeight)
    const maximumDimension = Math.max(input.width, input.height)
    const isOriginal = input.productType === 'ORIGINAL'
    const centerStrainerRequired = isOriginal || maximumDimension > 30
    const cornerStrainerRequired = isOriginal || maximumDimension > 45
    const additionalStrainersRequired = maximumDimension > 60
    const members = fourMembers(long, short)
    const strainerMembers = this.buildStrainerMembers({
      width: input.width,
      height: input.height,
      outerWidth,
      outerHeight,
      centerStrainerRequired,
      cornerStrainerRequired,
      additionalStrainersRequired,
      centerRuleId: centerLengthRule.id,
      cornerRuleId: cornerRule.id,
      additionalRuleId: additionalRule.id,
    })
    const strainerQuantity = strainerMembers.reduce((sum, member) => sum + member.quantity, 0)
    const addedStandardMinutes = strainerQuantity * STRETCHER_PRODUCTION_CONSTANTS.standardMinutesPerStrainer
    const centerMember = strainerMembers.find((member) => member.type === 'CENTER')
    const additionalMember = strainerMembers.find((member) => member.type === 'ADDITIONAL_LENGTHWISE')

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
      oppositeAdditionalStrainerRequired: additionalStrainersRequired,
      strainerMembers,
      addedStandardMinutes,
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
          adjustedWidthInches: outerWidth,
          adjustedHeightInches: outerHeight,
          longCutLengthInches: long,
          shortCutLengthInches: short,
          memberCount: members.length,
          centerStrainerRequired,
          cornerStrainerRequired,
          oppositeAdditionalStrainerRequired: additionalStrainersRequired,
          stretcherBarFaceHeightInches: STRETCHER_PRODUCTION_CONSTANTS.stretcherBar.faceHeightInches,
          stretcherBarThicknessAsSpecifiedInches: STRETCHER_PRODUCTION_CONSTANTS.stretcherBar.thicknessAsSpecifiedInches,
          stretcherBarNormalizedThicknessInches: STRETCHER_PRODUCTION_CONSTANTS.stretcherBar.normalizedThicknessInches,
          strainerBarWidthInches: STRETCHER_PRODUCTION_CONSTANTS.strainerBar.widthInches,
          strainerBarThicknessInches: STRETCHER_PRODUCTION_CONSTANTS.strainerBar.thicknessInches,
          centerStrainerLengthInches: centerMember?.cutLengthInches ?? null,
          centerStrainerQuantity: centerMember?.quantity ?? 0,
          centerStrainerOrientation: centerMember?.orientation ?? null,
          additionalStrainerLengthInches: additionalMember?.cutLengthInches ?? null,
          additionalStrainerQuantity: additionalMember?.quantity ?? 0,
          cornerStrainerQuantity: cornerStrainerRequired ? 4 : 0,
          addedStandardMinutes,
          outerStretcherFormula: 'outerDimension = paintingDimension - 0.0625',
          centerStrainerFormula: 'perpendicularOuterDimension - (2 * 1.0625)',
          additionalStrainerFormula: '(longInteriorSpan - 1.4375) / 2',
          laborFormula: 'individualStrainerQuantity * 4',
          source: STRETCHER_PRODUCTION_CONSTANTS.source,
          confirmationDate: STRETCHER_PRODUCTION_CONSTANTS.confirmationDate,
        },
        confidence: 'HIGH',
        explanation: `Applied ${cutRule.id}, ${centerRule.id}, ${cornerRule.id}, ${centerLengthRule.id}, ${additionalRule.id}, and ${laborRule.id} without rounding. Added ${addedStandardMinutes} standard minutes for ${strainerQuantity} individual strainers.`,
      },
    }
  }

  private buildStrainerMembers(input: {
    width: number
    height: number
    outerWidth: number
    outerHeight: number
    centerStrainerRequired: boolean
    cornerStrainerRequired: boolean
    additionalStrainersRequired: boolean
    centerRuleId: string
    cornerRuleId: string
    additionalRuleId: string
  }): ProductionStrainerMember[] {
    const constants = STRETCHER_PRODUCTION_CONSTANTS
    const materialDimensions = {
      widthInches: constants.strainerBar.widthInches,
      thicknessInches: constants.strainerBar.thicknessInches,
    }
    const supportMembers: ProductionStrainerMember[] = []

    if (input.centerStrainerRequired) {
      const horizontalSpan = input.width <= input.height
      const perpendicularOuterDimension = horizontalSpan ? input.outerWidth : input.outerHeight
      supportMembers.push({
        id: 'strainer-center-1',
        type: 'CENTER',
        cutLengthInches: perpendicularOuterDimension - (2 * constants.stretcherBar.normalizedThicknessInches),
        quantity: 1,
        placement: 'CENTERED',
        orientation: horizontalSpan ? 'HORIZONTAL' : 'VERTICAL',
        materialDimensions,
        formula: 'perpendicularOuterDimension - (2 * 1.0625)',
        ruleId: input.centerRuleId,
      })
    }

    if (input.additionalStrainersRequired) {
      const longInteriorSpan = Math.max(input.outerWidth, input.outerHeight)
        - (2 * constants.stretcherBar.normalizedThicknessInches)
      supportMembers.push({
        id: 'strainer-additional-lengthwise',
        type: 'ADDITIONAL_LENGTHWISE',
        cutLengthInches: (longInteriorSpan - constants.strainerBar.widthInches) / 2,
        quantity: 2,
        placement: 'EVENLY_SPACED_EACH_SIDE',
        orientation: input.width >= input.height ? 'HORIZONTAL' : 'VERTICAL',
        materialDimensions,
        formula: '(longInteriorSpan - 1.4375) / 2',
        ruleId: input.additionalRuleId,
      })
    }

    if (input.cornerStrainerRequired) {
      supportMembers.push({
        id: 'strainer-corners',
        type: 'CORNER',
        cutLengthInches: null,
        quantity: 4,
        placement: 'CORNERS',
        orientation: 'CORNER',
        materialDimensions,
        formula: 'quantity = 4 when max(width, height) > 45; existing cut size unchanged',
        ruleId: input.cornerRuleId,
      })
    }

    return supportMembers
  }
}