# Dibond Inches Up Display

- **Rule Name:** Dibond Inches Up Display
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Dibond Pieces Cutting`
- **Cell(s) or table used:** `B9:C9`, `J20:K20`, `R28:S28`, `Z28:AA28`, and display helpers such as `D44:D85`, `AB52:AB53`
- **Inputs:** Offset in inches or millimeters.
- **Outputs:** Millimeter position and rounded human-readable inches-up instruction.
- **Dependencies:** Conversion factor 25.4.
- **Exceptions:** Some displays use `ROUND`, others use `ROUNDUP`; precision varies between one decimal and whole inches.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Gives operators both machine millimeter coordinates and manual inches-up references.
- **Suggested TypeScript service:** `DibondRules`
- **Confidence:** Medium.
- **NEEDS_REVIEW:** Standardize whether operator-facing inches are rounded, rounded up, or shown to one decimal.

## Formula

```text
millimetersUp = ROUNDDOWN(inchesUp * 25.4, 0)
displayInches = ROUND or ROUNDUP(millimetersUp / 25.4) + " in."
```
