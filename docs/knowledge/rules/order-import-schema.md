# Dated Order Import Schema

- **Rule Name:** Dated Order Import Schema
- **Source Workbook:** `2026-07-28-OrdersList.xlsx`
- **Source Worksheet:** `7 28 2026`
- **Cell(s) or table used:** `A1:N4`
- **Inputs:** Due date, days, size, item, 3D number, customer, type, frame, value, shipping amount, batch, box, TM, cumulative value.
- **Outputs:** One normalized production-order row per populated worksheet row.
- **Dependencies:** Product-type vocabulary used by `Warehouse Production Sheets.xlsx` (`1 Orig`, `2 3D`, `2 3D Lim`, `3 Canv`, `4 Paper`, and related variants).
- **Exceptions:** Blank optional fields are present in valid rows. No workbook formula validates types, required fields, or uniqueness.
- **Related lookup tables:** None in this workbook.
- **Related named ranges:** None.
- **Business purpose:** Defines the column contract for importing a dated order list into the Workshop List workflow.
- **Suggested TypeScript service:** `OrderImportRules`
- **Confidence:** High for the column contract; Medium for required/optional semantics.
- **NEEDS_REVIEW:** Confirm whether `DAYS`, `TM`, and `CUMUL.` are imported values or should be recalculated, and identify the unique order key because none is present in this extract.

## Formula

No formulas are present. Pseudocode:

```text
for each populated row after row 1:
  map columns A:N to the dated order import fields
  preserve blanks in optional production fields
```
