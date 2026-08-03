import type {
  ConfirmedMeasurementRule,
  UnresolvedMeasurementRule,
} from './measurementRuleTypes'

export const activeFrameNormalizationRules = [
  {
    id: 'frame-normalization.paper-white.v1',
    reconciliationKey: 'FRAME_NORMALIZATION:PAPER:WHITE',
    status: 'CONFIRMED',
    confidence: 'HIGH',
    sources: [
      {
        workbook: 'Warehouse Production Sheets.xlsx',
        worksheet: 'Workshop List; Workshop Tags Paste; Actual Times',
        cells: 'Workshop List!R7:S107; Workshop Tags Paste!R6:S57; Actual Times!R4093:S6089',
        ruleId: 'workshop-frame-dimensions',
      },
      {
        workbook: 'Warehouse Production Sheets.xlsx; warehouse_production_tags_2026-07-01.xlsx',
        worksheet: 'Measurements',
        cells: 'Production!D30:E30; Tags!A30:B30',
        ruleId: 'frame-increase-lookup',
      },
    ],
    productType: 'PAPER',
    frameFamily: 'White',
    importedFrameName: 'White',
    normalizedProductionFrameName: 'Picture White',
    formula: 'paperLookupKey = "Picture " + importedFrameName',
  },
  {
    id: 'frame-normalization.paper-black.v1',
    reconciliationKey: 'FRAME_NORMALIZATION:PAPER:BLACK',
    status: 'CONFIRMED',
    confidence: 'HIGH',
    sources: [
      {
        workbook: 'Warehouse Production Sheets.xlsx',
        worksheet: 'Workshop List; Workshop Tags Paste; Actual Times',
        cells: 'Workshop List!R7:S107; Workshop Tags Paste!R6:S57; Actual Times!R4093:S6089',
        ruleId: 'workshop-frame-dimensions',
      },
      {
        workbook: 'Warehouse Production Sheets.xlsx; warehouse_production_tags_2026-07-01.xlsx',
        worksheet: 'Measurements',
        cells: 'Production!D31:E31; Tags!A31:B31',
        ruleId: 'frame-increase-lookup',
      },
    ],
    productType: 'PAPER',
    frameFamily: 'Black',
    importedFrameName: 'Black',
    normalizedProductionFrameName: 'Picture Black',
    formula: 'paperLookupKey = "Picture " + importedFrameName',
  },
] as const satisfies readonly ConfirmedMeasurementRule[]

export const frameNormalizationRulesNeedsReview = [
  {
    id: 'frame-normalization.paper-rolled.v1',
    reconciliationKey: 'FRAME_NORMALIZATION:PAPER:ROLLED',
    status: 'NEEDS_REVIEW',
    confidence: 'MEDIUM',
    sources: [
      {
        workbook: 'Warehouse Production Sheets.xlsx',
        worksheet: 'Workshop List; Workshop Tags Paste; Actual Times',
        cells: 'Frame-dimension paper-prefix formulas',
        ruleId: 'workshop-frame-dimensions',
      },
      {
        workbook: 'warehouse_production_tags_2026-07-01.xlsx',
        worksheet: 'Measurements',
        cells: 'A32:B32',
        ruleId: 'frame-increase-lookup',
      },
    ],
    productType: 'PAPER',
    frameFamily: 'Rolled',
    importedFrameName: 'Rolled',
    normalizedProductionFrameName: 'Picture Rolled',
    notes: 'Picture Rolled is absent from the production Measurements table used by Workshop List formulas.',
  },
  {
    id: 'frame-normalization.plein-aliases.v1',
    reconciliationKey: 'FRAME_NORMALIZATION:PLEIN_ALIASES',
    status: 'NEEDS_REVIEW',
    confidence: 'LOW',
    sources: [
      {
        workbook: 'Warehouse Production Sheets.xlsx',
        worksheet: 'Measurements; Petites List; BP',
        cells: 'Measurements!D11:D23; Petites List!N2:N4; BP!AP11:AP16',
        ruleId: 'frame-increase-lookup; petite-frame-cuts; battle-plan-base-and-frame-cuts',
      },
      {
        workbook: 'warehouse_production_tags_2026-07-01.xlsx',
        worksheet: 'Measurements',
        cells: 'A11:A23',
        ruleId: 'frame-increase-lookup',
      },
    ],
    productType: 'ALL',
    frameFamily: 'Plein Air; Plein; Petite PA',
    notes: 'Black & Gold/B&G and Sliver/Silver naming variants are not formally mapped by any source.',
  },
] as const satisfies readonly UnresolvedMeasurementRule[]