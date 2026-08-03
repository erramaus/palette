# Week Ending Progression

- **Rule Name:** Week Ending Progression
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `WEs`
- **Cell(s) or table used:** `A2:B1000`
- **Inputs:** Prior calendar date, prior week-ending date, and comparison anchor.
- **Outputs:** Daily date series and repeated/advanced week-ending value.
- **Dependencies:** Seven-day week.
- **Exceptions:** The formula compares the prior week-ending value to fixed cell `B6`; this is unusual and may be a copied historical artifact.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Assigns stretcher usage/cut records to reporting weeks.
- **Suggested TypeScript service:** `TimelineRules`
- **Confidence:** High for the date series; Low for the week-ending recurrence intent.
- **NEEDS_REVIEW:** Validate `IF(B12=B6,B12+7,B12)` and establish the intended weekday boundary.

## Formula

```text
date[n] = date[n-1] + 1 day
weekEnding[n] = priorWeekEnding == B6 ? priorWeekEnding + 7 : priorWeekEnding
```
