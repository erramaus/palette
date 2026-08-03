# 3D Print Table Capacity

- **Rule Name:** 3D Print Table Capacity
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `3D table plan`
- **Cell(s) or table used:** `B5:C5`, `B8`, `B11:C11`, `K2:M2`
- **Inputs:** Widths and heights of arranged prints.
- **Outputs:** Used width/height and remaining table space.
- **Dependencies:** Fixed table capacity of 98 inches wide by 80 inches tall; one inch of spacing per counted item.
- **Exceptions:** Different rows count slightly different ranges, suggesting manually arranged groups rather than a general packing algorithm.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Checks whether a proposed set of 3D prints fits on the production table.
- **Suggested TypeScript service:** `PrintingRules`
- **Confidence:** Medium.
- **NEEDS_REVIEW:** Confirm spacing, rotation, row/group rules, and whether the table dimensions remain 98 by 80 inches.

## Formula

```text
usedWidth = SUM(itemWidths) + COUNT(items)
remainingWidth = 98 - usedWidth
usedHeight = SUM(groupHeights) + COUNT(groups)
remainingHeight = 80 - usedHeight
```
