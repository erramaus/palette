# Base Adjustment Lookup

- **Rule Name:** Base Adjustment Lookup
- **Source Workbook:** `warehouse_production_tags_2026-07-01.xlsx`
- **Source Worksheet:** `Measurements`
- **Cell(s) or table used:** `D2:E16`
- **Inputs:** Frame/base style and artwork dimension.
- **Outputs:** Adjustment added to each 3D base dimension.
- **Dependencies:** Exact style lookup.
- **Exceptions:** Values include both negative reductions and positive increases. `None` subtracts `1/16`; several Plein Faux styles add `1 1/16`.
- **Related lookup tables:** `Measurements!D2:E16` base/decrease table.
- **Related named ranges:** None.
- **Business purpose:** Produces base cuts that fit within the selected frame assembly.
- **Suggested TypeScript service:** `BaseRules`
- **Confidence:** High.
- **NEEDS_REVIEW:** The column is labeled `DECREASE` even where values are positive; confirm sign semantics and unsupported-frame behavior.

## Formula

`baseDimension = artworkDimension + exactLookup(style, baseAdjustmentTable)`
