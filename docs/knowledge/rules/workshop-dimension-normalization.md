# Workshop Dimension Normalization

- **Rule Name:** Workshop Dimension Normalization
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Workshop List`; `Workshop Tags Paste`; `Actual Times`; `Warehouse reports paste`
- **Cell(s) or table used:** `Workshop List!I7:I107,Q7:Q107`; `Workshop Tags Paste!I6:I57,Q6:Q57`; `Actual Times!I4093:I6089,Q4093:Q6089`; `Warehouse reports paste!D2:D29`
- **Inputs:** Width and length.
- **Outputs:** Orientation-independent size label and square-inch area.
- **Dependencies:** Numeric dimensions in inches.
- **Exceptions:** No validation exists for zero, negative, text, or mixed-unit dimensions.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Gives every work item a stable size string and area regardless of portrait/landscape orientation.
- **Suggested TypeScript service:** `WorkshopListRules`
- **Confidence:** High.
- **NEEDS_REVIEW:** Define rounding and precision for fractional dimensions.

## Formula

```text
size = min(width, length) + " x " + max(width, length)
squareInches = width * length
```
