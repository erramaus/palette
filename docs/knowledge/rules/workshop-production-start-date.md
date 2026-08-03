# Workshop Production Start Date

- **Rule Name:** Workshop Production Start Date
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Workshop List`; `Workshop Tags Paste`; `Actual Times`
- **Cell(s) or table used:** `Workshop List!D7:D107`; `Workshop Tags Paste!D6:D57`; `Actual Times!D4093:D6089`
- **Inputs:** Due date.
- **Outputs:** Planned production start/date field.
- **Dependencies:** None beyond a valid due date.
- **Exceptions:** Uses calendar days and does not account for weekends, holidays, capacity, or product type.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Back-schedules the standard production window from the due date.
- **Suggested TypeScript service:** `TimelineRules`
- **Confidence:** High for the arithmetic; Medium for the interpretation of the `DATE` column.
- **NEEDS_REVIEW:** Confirm that the output is a production start date rather than an order date.

## Formula

`productionDate = dueDate - 14 days`
