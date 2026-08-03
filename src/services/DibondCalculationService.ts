import { activeDibondMeasurementRules } from '../config/production/dibondMeasurementRules'
import type { ProductionCutCalculationResult, ProductionCutInputs } from '../types/productionCut'

const validDimension = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

const reviewResult = (input: ProductionCutInputs, explanation: string): ProductionCutCalculationResult => ({
  kind: 'DIBOND',
  status: 'NEEDS_REVIEW',
  canGenerateFinalSawTag: false,
  members: [],
  normalizedFrame: null,
  frameFamily: null,
  mouldingIdentifier: null,
  baseHeightInches: null,
  centerStrainerRequired: null,
  cornerStrainerRequired: null,
  oppositeAdditionalStrainerRequired: null,
  cutDimensions: undefined,
  workstation: 'cnc',
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

export class DibondCalculationService {
  calculate(input: ProductionCutInputs): ProductionCutCalculationResult {
    if (input.productType !== 'THREE_D_PRINT' && input.productType !== 'TEXTURED_REPLICA_3D') {
      return reviewResult(input, `Dibond calculations do not support product type ${input.productType}.`)
    }
    if (!validDimension(input.width) || !validDimension(input.height)) {
      return reviewResult(input, 'Dibond calculation requires positive finite finished width and height values.')
    }

    const rule = activeDibondMeasurementRules[0]
    return {
      kind: 'DIBOND',
      status: 'CONFIRMED',
      canGenerateFinalSawTag: true,
      members: [],
      normalizedFrame: null,
      frameFamily: 'ALL',
      mouldingIdentifier: null,
      baseHeightInches: null,
      centerStrainerRequired: null,
      cornerStrainerRequired: null,
      oppositeAdditionalStrainerRequired: null,
      cutDimensions: { width: input.width, height: input.height },
      workstation: 'cnc',
      trace: {
        ruleId: rule.id,
        ruleIds: [rule.id],
        sources: rule.sources,
        originalInputs: input,
        normalizedInputs: {
          productType: input.productType,
          finishedPaintingWidthInches: input.width,
          finishedPaintingHeightInches: input.height,
        },
        calculatedOutputs: {
          cutWidthInches: input.width,
          cutHeightInches: input.height,
          workstation: 'CNC',
          formula: 'cutWidth = finishedPaintingWidth; cutHeight = finishedPaintingHeight',
          source: 'Production Director clarification',
          confirmationDate: '2026-08-03',
        },
        confidence: rule.confidence,
        explanation: 'Dibond cut dimensions equal the finished painting dimensions exactly. Cutting is performed on the CNC machine. CNC layout remains future tool work.',
      },
    }
  }
}