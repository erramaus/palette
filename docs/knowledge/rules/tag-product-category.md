# Production Tag Product Category

- **Rule Name:** Production Tag Product Category
- **Source Workbook:** `warehouse_production_tags_2026-07-01.xlsx`
- **Source Worksheet:** `Tags`
- **Cell(s) or table used:** Repeated tag headers `A1`, `G1`, and equivalent blocks through row 321; source type column `V`
- **Inputs:** Production type.
- **Outputs:** Tag heading `PAPER`, `CANVAS`, or `3D PRINT`.
- **Dependencies:** Exact type strings `4 Paper` and `3 CANV`; every other value falls through to `3D PRINT`.
- **Exceptions:** Blank, original, and unknown types are labeled `3D PRINT` by the fallback.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Selects the primary visual tag category and downstream checklist behavior.
- **Suggested TypeScript service:** `ProductionTagRules`
- **Confidence:** High for the formula; Medium for the fallback intent.
- **NEEDS_REVIEW:** Confirm whether originals and unknown/blank types should intentionally receive a 3D Print heading.

## Formula

`IF(type="4 Paper","PAPER",IF(type="3 CANV","CANVAS","3D PRINT"))`
