# Warehouse Report Order Date

- **Rule Name:** Warehouse Report Order Date
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Warehouse reports paste`
- **Cell(s) or table used:** `B2:B29`
- **Inputs:** Due date in column A.
- **Outputs:** Derived date in column B.
- **Dependencies:** None beyond a valid due date.
- **Exceptions:** This 21-day offset conflicts with the 14-day offset used by the active Workshop List.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Reconstructs a report date/order date from a warehouse due date.
- **Suggested TypeScript service:** `OrderImportRules`
- **Confidence:** High for the arithmetic; Low for current operational authority.
- **NEEDS_REVIEW:** Determine why imported warehouse reports use 21 days while active production sheets use 14 days, and which date definition Palette should retain.

## Formula

`reportDate = dueDate - 21 days`
