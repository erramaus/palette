import type {
  ConfirmedMeasurementRule,
  UnresolvedMeasurementRule,
} from './measurementRuleTypes'

const confirmedBase = (
  id: string,
  frameName: string,
  adjustmentInches: number,
  tagCells: string,
  bpCells: string,
): ConfirmedMeasurementRule => ({
  id,
  reconciliationKey: `BASE:${frameName.toUpperCase()}`,
  status: 'CONFIRMED',
  confidence: 'HIGH',
  sources: [
    {
      workbook: 'warehouse_production_tags_2026-07-01.xlsx',
      worksheet: 'Measurements',
      cells: tagCells,
      ruleId: 'base-adjustment-lookup',
    },
    {
      workbook: 'Warehouse Production Sheets.xlsx',
      worksheet: 'BP',
      cells: bpCells,
      ruleId: 'battle-plan-base-and-frame-cuts',
    },
  ],
  productType: 'TEXTURED_REPLICA_3D',
  frameFamily: frameName,
  importedFrameName: frameName,
  normalizedProductionFrameName: frameName,
  adjustmentInches,
  formula: 'baseDimension = artworkDimension + adjustmentInches',
})

export const activeBaseMeasurementRules = [
  confirmedBase('base.black.adjustment.v1', 'Black', -0.25, 'D7:E7', 'AP7:AQ7'),
  confirmedBase('base.b-and-g-plein-faux.adjustment.v1', 'B&G Plein Faux', 1.0625, 'D8:E8', 'AP15:AQ15'),
  confirmedBase('base.silver-plein-faux.adjustment.v1', 'Silver Plein Faux', 1.0625, 'D9:E9', 'AP14:AQ14'),
  confirmedBase('base.gold-plein-faux.adjustment.v1', 'Gold Plein Faux', 1.0625, 'D10:E10', 'AP12:AQ12'),
  confirmedBase('base.gold-reh.adjustment.v1', 'Gold REH', -1.5, 'D12:E12', 'AP17:AQ17'),
  confirmedBase('base.silver-reh.adjustment.v1', 'Silver REH', -1.5, 'D13:E13', 'AP18:AQ18'),
] as const satisfies readonly ConfirmedMeasurementRule[]

export const baseMeasurementRulesNeedsReview = [
  {
    id: 'base.conflicting-adjustments.v1',
    reconciliationKey: 'BASE:CONFLICTING_ADJUSTMENTS',
    status: 'CONFLICT',
    confidence: 'LOW',
    sources: [
      {
        workbook: 'warehouse_production_tags_2026-07-01.xlsx',
        worksheet: 'Measurements',
        cells: 'D2:E16',
        ruleId: 'base-adjustment-lookup',
      },
      {
        workbook: 'Warehouse Production Sheets.xlsx',
        worksheet: 'BP',
        cells: 'AP4:AQ22',
        ruleId: 'battle-plan-base-and-frame-cuts',
      },
    ],
    productType: 'TEXTURED_REPLICA_3D',
    frameFamily: 'Gold; Silver; White; Silver EH; Gold EH A; Gold REH NEW',
    competingValues: [
      { source: 'tag Measurements', value: 'signed adjustment added to artwork dimension' },
      { source: 'BP inline table', value: 'lookup value subtracted from artwork dimension' },
    ],
    notes: 'After sign normalization these frame families still produce different dimensions.',
  },
  {
    id: 'base.single-source-adjustments.v1',
    reconciliationKey: 'BASE:SINGLE_SOURCE_ADJUSTMENTS',
    status: 'NEEDS_REVIEW',
    confidence: 'MEDIUM',
    sources: [
      {
        workbook: 'warehouse_production_tags_2026-07-01.xlsx',
        worksheet: 'Measurements',
        cells: 'D11:E16',
        ruleId: 'base-adjustment-lookup',
      },
      {
        workbook: 'Warehouse Production Sheets.xlsx',
        worksheet: 'BP',
        cells: 'AP21:AQ22',
        ruleId: 'battle-plan-base-and-frame-cuts',
      },
    ],
    productType: 'TEXTURED_REPLICA_3D',
    frameFamily: 'None; Light Gold; Red Gold; Picture White; Picture Black',
    notes: 'These entries appear in only one source and unsupported-frame behavior is undocumented.',
  },
] as const satisfies readonly UnresolvedMeasurementRule[]