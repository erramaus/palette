# Workshop Days To Due

- **Rule Name:** Workshop Days To Due
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Workshop List`; `Workshop Tags Paste`; `Actual Times`; `Warehouse reports paste`
- **Cell(s) or table used:** `Workshop List!B7:B107`; `Workshop Tags Paste!B6:B57`; `Actual Times!B4093:B6089`; `Warehouse reports paste!C2:C29`
- **Inputs:** Due date; current date.
- **Outputs:** Signed calendar-day count until due.
- **Dependencies:** Excel `TODAY()` and a valid due date.
- **Exceptions:** Negative values indicate overdue work. No workday, holiday, timezone, or blank-date handling is explicit.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Provides urgency and lateness information for production prioritization.
- **Suggested TypeScript service:** `TimelineRules`
- **Confidence:** High.
- **NEEDS_REVIEW:** Confirm whether Palette should preserve calendar-day behavior or use production working days.

## Formula

`daysToDue = dueDate - TODAY()`
