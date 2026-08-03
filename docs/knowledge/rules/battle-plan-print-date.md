# Battle Plan Print Date

- **Rule Name:** Battle Plan Print Date
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `BP`; `Print BP`
- **Cell(s) or table used:** `BP!B2`; `Print BP!B2`
- **Inputs:** Current system date.
- **Outputs:** Battle Plan date displayed on the plan and print view.
- **Dependencies:** Excel `TODAY()`.
- **Exceptions:** The date changes whenever the workbook recalculates; it is not a persisted publication date.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Dates the daily Battle Plan output.
- **Suggested TypeScript service:** `BattlePlanRules`
- **Confidence:** High.
- **NEEDS_REVIEW:** Decide whether Palette should capture generated-at, approved-at, or scheduled-for date instead of a volatile current date.

## Formula

`battlePlanDate = TODAY()`
