# Box Face Cut

- **Rule Name:** Box Face Cut
- **Source Workbook:** `warehouse_production_tags_2026-07-01.xlsx`
- **Source Worksheet:** `Box Lookup`
- **Cell(s) or table used:** `A1:F7`
- **Inputs:** Box height, vertical dimension, and depth.
- **Outputs:** Face-cut dimension string.
- **Dependencies:** Box lookup row.
- **Exceptions:** A depth of exactly 5 adds `x 1.5`; every other depth omits a third dimension. Only the first six box rows have formulas.
- **Related lookup tables:** `Box Lookup!A2:F7`.
- **Related named ranges:** None.
- **Business purpose:** Supplies box-fabrication face cuts for selected shipping boxes.
- **Suggested TypeScript service:** `ShippingRules`
- **Confidence:** High.
- **NEEDS_REVIEW:** Confirm why depth 5 maps to a 1.5-inch face cut and whether rows 8 and 11:22 intentionally omit face cuts.

## Formula

`faceCuts = depth == 5 ? height + " x " + vertical + " x 1.5" : height + " x " + vertical`
