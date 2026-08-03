# Material Unit Cost Valuation

- **Rule Name:** Material Unit Cost Valuation
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Cost Calculator`; `Simple Cost Calculator`
- **Cell(s) or table used:** `Cost Calculator!BA6:CK45`; `Simple Cost Calculator!AU2:CF2`; lookup `Costs!A:B`
- **Inputs:** Calculated material quantities and item/frame names.
- **Outputs:** Cost contribution for each material consumed by a work item.
- **Dependencies:** Exact material names in `Costs!A:B`; quantity columns for stretcher bar, strainer, 3D base, glues, nails, paint, canvas, Dibond, inks, staples, backing, paper, epoxy, frame hardware, and related items.
- **Exceptions:** Blank quantities produce blanks. Canvas ink is omitted for `1 Orig`. Frame material cost uses the frame name as a lookup key. Missing cost keys produce Excel lookup errors.
- **Related lookup tables:** `Costs!A:B` item/unit-cost master.
- **Related named ranges:** None.
- **Business purpose:** Converts physical production requirements into per-item material cost.
- **Suggested TypeScript service:** `MaterialRules`
- **Confidence:** High.
- **NEEDS_REVIEW:** Normalize material names and units before implementation; the formulas assume exact text and compatible quantity units.

## Formula

`materialCost = quantity * exactLookup(materialName, Costs.itemUnitCost)`
