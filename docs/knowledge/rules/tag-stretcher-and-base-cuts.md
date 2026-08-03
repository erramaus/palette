# Production Tag Stretcher And Base Cuts

- **Rule Name:** Production Tag Stretcher And Base Cuts
- **Source Workbook:** `warehouse_production_tags_2026-07-01.xlsx`
- **Source Worksheet:** `Tags`
- **Cell(s) or table used:** Repeated formulas `AT7`, `AV7`, `BA7`, `BC7` and corresponding blocks through row 327; source dimensions `Y:Z`
- **Inputs:** Product type, artwork width, artwork length, frame/style.
- **Outputs:** Two stretcher or 3D base cut dimensions.
- **Dependencies:** Base Adjustment Lookup; exact `3 Canv` type.
- **Exceptions:** Canvas cuts subtract `1/16` from each dimension. Every non-canvas row uses the base adjustment lookup.
- **Related lookup tables:** `Measurements!D:E` base adjustment table.
- **Related named ranges:** None.
- **Business purpose:** Prints fabrication cut sizes on the component section of a production tag.
- **Suggested TypeScript service:** `ProductionTagRules`
- **Confidence:** High for formulas; Medium for non-canvas fallback.
- **NEEDS_REVIEW:** Confirm that only 3D products can reach the non-canvas branch.

## Formula

```text
if type == "3 Canv":
  cuts = [width - 1/16, length - 1/16]
else:
  adjustment = exactLookup(style, Measurements.baseAdjustment)
  cuts = [width + adjustment, length + adjustment]
```
