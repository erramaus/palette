import type {
  ConfirmedMeasurementRule,
  UnresolvedMeasurementRule,
} from './measurementRuleTypes'

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
    }],
    productType: 'CANVAS',
    frameFamily: 'ALL',
    formula: 'cornersRequired = max(width, height) > 45',
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