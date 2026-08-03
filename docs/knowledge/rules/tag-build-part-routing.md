# Production Tag Build Part Routing

- **Rule Name:** Production Tag Build Part Routing
- **Source Workbook:** `warehouse_production_tags_2026-07-01.xlsx`
- **Source Worksheet:** `Tags`
- **Cell(s) or table used:** Repeated build labels `AS2`, `AZ2`, and corresponding blocks through row 322
- **Inputs:** Production type.
- **Outputs:** Build-part label `STRETCHER` or `3D BASE`.
- **Dependencies:** Exact type string `3 Canv`.
- **Exceptions:** Every non-canvas type, including blanks and paper, falls through to `3D BASE`.
- **Related lookup tables:** Tag `Measurements!D:E` for base adjustments.
- **Related named ranges:** None.
- **Business purpose:** Directs the fabrication component associated with the tagged work item.
- **Suggested TypeScript service:** `ProductionTagRules`
- **Confidence:** High for the formula; Medium for fallback intent.
- **NEEDS_REVIEW:** Confirm whether paper, originals, and unknown types should generate a 3D Base component.

## Formula

`buildPart = type == "3 Canv" ? "STRETCHER" : "3D BASE"`
