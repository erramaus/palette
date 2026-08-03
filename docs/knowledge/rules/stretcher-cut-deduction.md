# Stretcher Cut Deduction

- **Rule Name:** Stretcher Cut Deduction
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `BP`; `Helper BPs`
- **Cell(s) or table used:** `BP!AL4,AN4` repeated every four rows; `Helper BPs!A3:G32`
- **Inputs:** Canvas width and length.
- **Outputs:** Stretcher cut width and length.
- **Dependencies:** Product type `3 Canv`.
- **Exceptions:** Helper BPs explicitly states “SUBTRACT 1/16 INCH FROM ALL DIMENSION CUTS”; some displayed helper dimensions remain source dimensions and require the manual instruction.
- **Related lookup tables:** None.
- **Related named ranges:** `stretch` is referenced elsewhere but its definition is broken (`#REF!`).
- **Business purpose:** Allows the stretched canvas to fit its intended finished dimensions.
- **Suggested TypeScript service:** `StretcherRules`
- **Confidence:** High.
- **NEEDS_REVIEW:** Resolve the broken `stretch` named range and confirm whether the deduction is applied once in data or manually at the saw.

## Formula

`stretcherCut = artworkDimension - 1/16 inch`
