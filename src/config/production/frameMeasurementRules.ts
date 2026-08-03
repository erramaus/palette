import type {
  ConfirmedMeasurementRule,
  MeasurementRuleSource,
  UnresolvedMeasurementRule,
} from './measurementRuleTypes'

const warehouseSource = (cells: string): MeasurementRuleSource => ({
  workbook: 'Warehouse Production Sheets.xlsx',
  worksheet: 'Measurements',
  cells,
  ruleId: 'frame-increase-lookup',
})

const tagSource = (cells: string): MeasurementRuleSource => ({
  workbook: 'warehouse_production_tags_2026-07-01.xlsx',
  worksheet: 'Measurements',
  cells,
  ruleId: 'frame-increase-lookup',
})

const bpSource = (cells: string): MeasurementRuleSource => ({
  workbook: 'Warehouse Production Sheets.xlsx',
  worksheet: 'BP',
  cells,
  ruleId: 'battle-plan-base-and-frame-cuts',
})

const confirmedFrame = (
  id: string,
  frameName: string,
  adjustmentInches: number,
  cells: readonly [string, string, string],
): ConfirmedMeasurementRule => ({
  id,
  reconciliationKey: `FRAME:${frameName.toUpperCase()}`,
  status: 'CONFIRMED',
  confidence: 'HIGH',
  sources: [warehouseSource(cells[0]), tagSource(cells[1]), bpSource(cells[2])],
  productType: 'ALL',
  frameFamily: frameName,
  importedFrameName: frameName,
  normalizedProductionFrameName: frameName,
  adjustmentInches,
  formula: 'finishedDimension = artworkDimension + adjustmentInches',
})

export const activeFrameMeasurementRules = [
  confirmedFrame('frame.silver-eh.increase.v1', 'Silver EH', 1.5625, ['D10:E10', 'A10:B10', 'AP10:AR10']),
  confirmedFrame('frame.b-and-g-plein.increase.v1', 'B&G Plein', 5.875, ['D19:E19', 'A19:B19', 'AP16:AR16']),
  confirmedFrame('frame.b-and-g-plein-faux.increase.v1', 'B&G Plein Faux', 6.9375, ['D21:E21', 'A21:B21', 'AP15:AR15']),
  confirmedFrame('frame.gold-eh-a.increase.v1', 'Gold EH A', 1.6875, ['D28:E28', 'A14:B14', 'AP20:AR20']),
  confirmedFrame('frame.gold-reh-new.increase.v1', 'Gold REH NEW', 1.5625, ['D29:E29', 'A29:B29', 'AP19:AR19']),
  confirmedFrame('frame.picture-white.increase.v1', 'Picture White', 2.6875, ['D30:E30', 'A30:B30', 'AP21:AR21']),
  confirmedFrame('frame.picture-black.increase.v1', 'Picture Black', 2.6875, ['D31:E31', 'A31:B31', 'AP22:AR22']),
] as const satisfies readonly ConfirmedMeasurementRule[]

const conflictingFrame = (
  id: string,
  frameName: string,
  values: readonly [number, number, number],
  cells: readonly [string, string, string],
): UnresolvedMeasurementRule => ({
  id,
  reconciliationKey: `FRAME:${frameName.toUpperCase()}`,
  status: 'CONFLICT',
  confidence: 'LOW',
  sources: [warehouseSource(cells[0]), tagSource(cells[1]), bpSource(cells[2])],
  productType: 'ALL',
  frameFamily: frameName,
  importedFrameName: frameName,
  normalizedProductionFrameName: frameName,
  competingValues: [
    { source: 'production Measurements', value: values[0] },
    { source: 'tag Measurements', value: values[1] },
    { source: 'BP inline table', value: values[2] },
  ],
  notes: 'No source is selected as authoritative.',
})

export const frameMeasurementRulesNeedsReview = [
  conflictingFrame('frame.black.increase.v1', 'Black', [1.375, 1.4375, 1.3125], ['D3:E3', 'A3:B3', 'AP7:AR7']),
  conflictingFrame('frame.gold.increase.v1', 'Gold', [1.375, 1.3125, 1.3125], ['D7:E7', 'A7:B7', 'AP5:AR5']),
  conflictingFrame('frame.white.increase.v1', 'White', [1.375, 1.3125, 1.3125], ['D6:E6', 'A6:B6', 'AP8:AR8']),
  conflictingFrame('frame.silver.increase.v1', 'Silver', [1.625, 1.3125, 1.3125], ['D4:E4', 'A4:B4', 'AP6:AR6']),
  conflictingFrame('frame.gold-plein.increase.v1', 'Gold Plein', [7.625, 7.625, 7.5625], ['D16:E16', 'A16:B16', 'AP11:AR11']),
  conflictingFrame('frame.silver-plein.increase.v1', 'Silver Plein', [7.625, 7.625, 7.5625], ['D18:E18', 'A18:B18', 'AP13:AR13']),
  conflictingFrame('frame.silver-plein-faux.increase.v1', 'Silver Plein Faux', [9, 8.5, 8.5], ['D22:E22', 'A22:B22', 'AP14:AR14']),
  conflictingFrame('frame.gold-plein-faux.increase.v1', 'Gold Plein Faux', [9, 9, 8.5], ['D23:E23', 'A23:B23', 'AP12:AR12']),
  conflictingFrame('frame.gold-reh.increase.v1', 'Gold REH', [1.625, 1.3125, 1.3125], ['D24:E24', 'A24:B24', 'AP17:AR17']),
  conflictingFrame('frame.silver-reh.increase.v1', 'Silver REH', [1.625, 1.3125, 1.3125], ['D25:E25', 'A25:B25', 'AP18:AR18']),
  {
    id: 'frame.red-gold.increase.v1',
    reconciliationKey: 'FRAME:RED GOLD',
    status: 'CONFLICT',
    confidence: 'LOW',
    sources: [warehouseSource('D26:E26'), tagSource('A28:B28')],
    productType: 'ALL',
    frameFamily: 'Red Gold',
    importedFrameName: 'Red Gold',
    normalizedProductionFrameName: 'Red Gold',
    competingValues: [
      { source: 'production Measurements', value: 1.625 },
      { source: 'tag Measurements', value: 1.3125 },
    ],
    notes: 'No BP row exists and no source is selected as authoritative.',
  },
  {
    id: 'frame.single-source-and-aliases.v1',
    reconciliationKey: 'FRAME:SINGLE_SOURCE_AND_ALIASES',
    status: 'NEEDS_REVIEW',
    confidence: 'MEDIUM',
    sources: [warehouseSource('D2:E31'), tagSource('A2:B33'), bpSource('AP4:AR22')],
    productType: 'ALL',
    frameFamily: 'MULTIPLE',
    notes: 'EH, None, KoF, plein-air aliases, Metro, Light Gold, Rolled, Picture Rolled, Stretched, and 30x40 lack three-source agreement or a documented normalization decision.',
  },
  {
    id: 'frame.cost-envelope.fallback.v1',
    reconciliationKey: 'FRAME:COST_ENVELOPE_FALLBACK',
    status: 'NEEDS_REVIEW',
    confidence: 'LOW',
    sources: [{
      workbook: 'Warehouse Production Sheets.xlsx',
      worksheet: 'Cost Calculator; Simple Cost Calculator',
      cells: 'Cost Calculator!AH6:AI45; Simple Cost Calculator!AB2:AC2',
      ruleId: 'cost-calculator-frame-envelope',
    }],
    productType: 'ALL',
    frameFamily: 'FALLBACK',
    formula: 'KoF +6; Stretched +0; Roll N/A; all other frames +2',
    notes: 'The coarse fallback conflicts with detailed lookup tables and is not declared obsolete.',
  },
] as const satisfies readonly UnresolvedMeasurementRule[]