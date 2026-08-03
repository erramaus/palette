# Battle Plan Print Projection

- **Rule Name:** Battle Plan Print Projection
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Print BP`; `Basing BP`
- **Cell(s) or table used:** `Print BP!A4:E32`; `Basing BP!A2:D22`
- **Inputs:** Generated Battle Plan rows or source order fields.
- **Outputs:** Compact printable task list; customer, artwork, size, and frame projection for basing.
- **Dependencies:** Upstream `BP` generation or manually pasted source columns.
- **Exceptions:** `Basing BP` is a historical hidden projection that simply maps `M:P` into `A:D`; no filter formula establishes which rows belong there.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Converts operational source data into print-friendly plans for production staff.
- **Suggested TypeScript service:** `BattlePlanRules`
- **Confidence:** High for projection behavior; Low for row selection.
- **NEEDS_REVIEW:** Determine how rows are selected, sorted, and transferred into `Print BP` and `Basing BP`; the workbook contains values but no complete selection formula.

## Formula

Pseudocode: project selected generated tasks into the print layout; for basing rows map `customer=M`, `artwork=N`, `size=O`, and `frame=P`.
