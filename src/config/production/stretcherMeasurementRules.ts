import type {
  ConfirmedMeasurementRule,
  UnresolvedMeasurementRule,
} from './measurementRuleTypes'

export const STRETCHER_PRODUCTION_CONSTANTS = {
  stretcherBar: {
    faceHeightInches: 1.9375,
    thicknessAsSpecifiedInches: 1.0625,
    normalizedThicknessInches: 1.0625,
  },
  strainerBar: {
    widthInches: 1.4375,
    thicknessInches: 0.75,
  },
  standardMinutesPerStrainer: 4,
  source: 'Production Director clarification',
  confirmationDate: '2026-08-03',
} as const

const productionDirectorSource = (ruleId: string) => ({
  workbook: 'Production Director clarification',
  worksheet: 'Production rules',
  cells: 'Direct clarification',
  ruleId,
  confirmationDate: '2026-08-03',
})

export const activeStretcherMeasurementRules = [
  {
    id: 'stretcher.canvas.cut-deduction.v1',
    reconciliationKey: 'CANVAS:CUT_DEDUCTION',
    status: 'CONFIRMED',
    confidence: 'HIGH',
    sources: [
      {
        workbook: 'Warehouse Production Sheets.xlsx',
        worksheet: 'BP; Helper BPs',
        cells: 'BP!AL4,AN4; Helper BPs!A3:G32',
        ruleId: 'stretcher-cut-deduction',
      },
      {
        workbook: 'warehouse_production_tags_2026-07-01.xlsx',
        worksheet: 'Tags',
        cells: 'AT7,AV7 and repeated blocks through row 327',
        ruleId: 'tag-stretcher-and-base-cuts',
      },
    ],
    productType: 'CANVAS',
    frameFamily: 'ALL',
    adjustmentInches: -0.0625,
    formula: 'cutDimension = artworkDimension - 1/16',
  },
  {
    id: 'stretcher.canvas.strainer-threshold.v1',
    reconciliationKey: 'CANVAS:STRAINER_THRESHOLD',
    status: 'CONFIRMED',
    confidence: 'HIGH',
    sources: [{
      workbook: 'Warehouse Production Sheets.xlsx',
      worksheet: 'Helper BPs',
      cells: 'F6:F32',
      ruleId: 'stretcher-support-thresholds',
    }],
    productType: 'CANVAS',
    frameFamily: 'ALL',
    formula: 'strainerRequired = max(width, height) > 30',
  },
  {
    id: 'stretcher.canvas.corner-threshold.v1',
    reconciliationKey: 'CANVAS:CORNER_THRESHOLD',
    status: 'CONFIRMED',
    confidence: 'HIGH',
    sources: [{
      workbook: 'Warehouse Production Sheets.xlsx',
      worksheet: 'Helper BPs',
      cells: 'G6:G32',
      ruleId: 'stretcher-support-thresholds',
    }, productionDirectorSource('corner-strainer-quantity')],
    productType: 'CANVAS',
    frameFamily: 'ALL',
    formula: 'if max(width, height) > 45: cornersRequired = true; quantity = 4',
  },
  {
    id: 'stretcher.canvas.material-dimensions.v1',
    reconciliationKey: 'CANVAS:MATERIAL_DIMENSIONS',
    status: 'CONFIRMED',
    confidence: 'HIGH',
    sources: [productionDirectorSource('stretcher-material-dimensions')],
    productType: 'CANVAS',
    frameFamily: 'ALL',
    formula: 'stretcher face = 1.9375; specified thickness = 1 2/32; normalized thickness = 1 1/16; strainer width = 1.4375; strainer thickness = 0.75',
  },
  {
    id: 'stretcher.canvas.center-strainer.v1',
    reconciliationKey: 'CANVAS:CENTER_STRAINER',
    status: 'CONFIRMED',
    confidence: 'HIGH',
    sources: [productionDirectorSource('center-strainer')],
    productType: 'CANVAS',
    frameFamily: 'ALL',
    formula: 'centerLength = perpendicularOuterDimension - (2 * 1.0625)',
  },
  {
    id: 'stretcher.canvas.over-60-additional-strainers.v1',
    reconciliationKey: 'CANVAS:OVER_60_ADDITIONAL_STRAINERS',
    status: 'CONFIRMED',
    confidence: 'HIGH',
    sources: [productionDirectorSource('over-60-additional-strainers')],
    productType: 'CANVAS',
    frameFamily: 'ALL',
    formula: 'if max(width,height) > 60: quantity = 2; eachLength = (longInteriorSpan - 1.4375) / 2',
  },
  {
    id: 'stretcher.canvas.strainer-labor.v1',
    reconciliationKey: 'CANVAS:STRAINER_LABOR',
    status: 'CONFIRMED',
    confidence: 'HIGH',
    sources: [productionDirectorSource('strainer-labor')],
    productType: 'CANVAS',
    frameFamily: 'ALL',
    formula: 'addedStandardMinutes = totalIndividualStrainers * 4',
  },
] as const satisfies readonly ConfirmedMeasurementRule[]

export const stretcherMeasurementRulesNeedsReview = [
  {
    id: 'stretcher.canvas.named-range.v1',
    reconciliationKey: 'CANVAS:NAMED_RANGE',
    status: 'NEEDS_REVIEW',
    confidence: 'LOW',
    sources: [{
      workbook: 'Warehouse Production Sheets.xlsx',
      worksheet: 'BP',
      cells: 'Named range stretch (#REF!)',
      ruleId: 'stretcher-cut-deduction',
    }],
    productType: 'CANVAS',
    frameFamily: 'ALL',
    notes: 'The named range is broken and must not be used as configuration.',
  },
] as const satisfies readonly UnresolvedMeasurementRule[]