import type {
  ConfirmedMeasurementRule,
  UnresolvedMeasurementRule,
} from './measurementRuleTypes'

export const activeDibondMeasurementRules = [] as const satisfies readonly ConfirmedMeasurementRule[]

export const dibondMeasurementRulesNeedsReview = [
  {
    id: 'dibond.cut-millimeters.v1',
    reconciliationKey: 'DIBOND:CUT_MILLIMETERS',
    status: 'NEEDS_REVIEW',
    confidence: 'HIGH',
    sources: [{
      workbook: 'Warehouse Production Sheets.xlsx',
      worksheet: 'Dibond Cutting; Dibond Pieces Cutting',
      cells: 'Dibond Cutting!C2:C8,K2:K8,S7:S8; Dibond Pieces Cutting!C3:C26,K14:K77,AA25:AA26',
      ruleId: 'dibond-cut-millimeters',
    }],
    productType: 'TEXTURED_REPLICA_3D',
    frameFamily: 'ALL',
    formula: 'cutMillimeters = ROUNDDOWN((inches + 9/32) * 25.4, 0)',
    notes: 'The repeated formula is verified, but the 9/32 allowance and universal ROUNDDOWN policy are unresolved.',
  },
  {
    id: 'dibond.layout-spacing.v1',
    reconciliationKey: 'DIBOND:LAYOUT_SPACING',
    status: 'NEEDS_REVIEW',
    confidence: 'MEDIUM',
    sources: [{
      workbook: 'Warehouse Production Sheets.xlsx',
      worksheet: 'Dibond Cutting; Dibond Pieces Cutting',
      cells: 'Dibond Cutting!E2:O25,U2:AA40; Dibond Pieces Cutting!E3:AI104',
      ruleId: 'dibond-layout-spacing',
    }],
    productType: 'TEXTURED_REPLICA_3D',
    frameFamily: 'ALL',
    formula: 'nextOrigin = max(previousCutLines) + 13; sheetBoundary = 1525',
    notes: 'Rotation, block order, width limit, and optimization objective are undocumented.',
  },
  {
    id: 'dibond.inches-up-display.v1',
    reconciliationKey: 'DIBOND:INCHES_UP_DISPLAY',
    status: 'CONFLICT',
    confidence: 'MEDIUM',
    sources: [{
      workbook: 'Warehouse Production Sheets.xlsx',
      worksheet: 'Dibond Pieces Cutting',
      cells: 'B9:C9,J20:K20,R28:S28,Z28:AA28,D44:D85,AB52:AB53',
      ruleId: 'dibond-inches-up',
    }],
    productType: 'TEXTURED_REPLICA_3D',
    frameFamily: 'ALL',
    competingValues: [
      { source: 'Dibond Pieces Cutting blocks', value: 'ROUND to whole or one decimal' },
      { source: 'Dibond Pieces Cutting blocks', value: 'ROUNDUP to whole inches' },
    ],
    notes: 'Operator display precision is inconsistent across formula blocks.',
  },
] as const satisfies readonly UnresolvedMeasurementRule[]