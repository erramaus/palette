# Dibond Layout Spacing

- **Rule Name:** Dibond Layout Spacing
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Dibond Cutting`; `Dibond Pieces Cutting`
- **Cell(s) or table used:** `Dibond Cutting!E2:O25,U2:AA40`; `Dibond Pieces Cutting!E3:AI104`
- **Inputs:** Converted cut dimensions and preceding rectangle/line positions.
- **Outputs:** Rectangle origins, cumulative line positions, and sheet-limit markers.
- **Dependencies:** Dibond Cut Millimeters; fixed 13-millimeter inter-layout spacing; fixed 1,525-millimeter sheet boundary.
- **Exceptions:** Blank/zero inputs suppress many downstream positions. The two sheets use multiple manually repeated layout blocks with slightly different references.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Places multiple rectangular cuts on a Dibond sheet without overlap and indicates cutter lines.
- **Suggested TypeScript service:** `DibondRules`
- **Confidence:** Medium.
- **NEEDS_REVIEW:** The formulas establish 13 mm spacing and a 1,525 mm limit, but block order, rotation policy, maximum sheet width, and optimization objective are not documented.

## Formula

Pseudocode:

```text
nextOrigin = max(previousCutLineA, previousCutLineB) + 13 mm
nextCutLine = nextOrigin + convertedDimension
sheetBoundary = 1525 mm when the block is active
```
