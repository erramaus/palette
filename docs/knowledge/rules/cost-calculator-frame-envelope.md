# Cost Calculator Frame Envelope

- **Rule Name:** Cost Calculator Frame Envelope
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Cost Calculator`; `Simple Cost Calculator`
- **Cell(s) or table used:** `Cost Calculator!AH6:AI45`; `Simple Cost Calculator!AB2:AC2`
- **Inputs:** Artwork height, artwork length, and frame type.
- **Outputs:** Simplified outside frame width and length for costing.
- **Dependencies:** Frame categories `Roll`, `Stretched`, and `KoF`.
- **Exceptions:** `Roll` returns `N/A`; `Stretched` adds zero; `KoF` adds 6 inches; every other frame adds 2 inches. This differs from the detailed `Measurements` lookup.
- **Related lookup tables:** Detailed frame increases in `Measurements!D:E`, not used by these formulas.
- **Related named ranges:** None.
- **Business purpose:** Produces a coarse frame envelope for shipping and cost estimation.
- **Suggested TypeScript service:** `FrameRules`
- **Confidence:** High for the formulas; Low on whether they remain authoritative.
- **NEEDS_REVIEW:** Decide whether costing intentionally uses coarse categories or should share the detailed frame-increase lookup.

## Formula

```text
if frame == Roll: N/A
else if frame == Stretched: [minDimension, maxDimension]
else if frame == KoF: [height + 6, length + 6]
else: [height + 2, length + 2]
```
