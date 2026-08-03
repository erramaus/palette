# Manual Production Step Tracking Grid

- **Rule Name:** Manual Production Step Tracking Grid
- **Source Workbook:** `Tracking Steps.xlsx`
- **Source Worksheet:** `Template`; `July 2026`
- **Cell(s) or table used:** `A1:Q15`
- **Inputs:** Month, four week-ending periods, daily dates, and employee rows such as `DG` and `DS`.
- **Outputs:** Manual daily production-step record grouped into weekly reporting blocks.
- **Dependencies:** Friday-through-Thursday week layout.
- **Exceptions:** No formulas, validation, step names, or aggregation are embedded in this workbook.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Captures daily work by operator for weekly production tracking.
- **Suggested TypeScript service:** `TimelineRules`
- **Confidence:** Medium.
- **NEEDS_REVIEW:** Determine what users enter in each daily cell, the complete employee roster, allowed values, and how this sheet feeds `Steps Log` or `Stats`.

## Formula

No formula. Pseudocode: create four Friday-through-Thursday week blocks for the month and capture one daily value per operator row.
