# Battle Plan Operation Sequence

- **Rule Name:** Battle Plan Operation Sequence
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `BP`
- **Cell(s) or table used:** Four-row work-item blocks `AI4:AN27`; sequence column `AJ`
- **Inputs:** Product type, frame, item name.
- **Outputs:** Ordered Battle Plan tasks and sequence numbers.
- **Dependencies:** Product types `2 3D Lim` and `3 Canv`; frame value `Stretched`.
- **Exceptions:** Unsupported types produce `ORIG!` in initial sequence rows. Frame-making step 5 is omitted for `Stretched` work.
- **Related lookup tables:** `BP!AP3:AR22` frame/base/cut adjustments.
- **Related named ranges:** None.
- **Business purpose:** Expands each production item into an ordered fabrication plan.
- **Suggested TypeScript service:** `BattlePlanRules`
- **Confidence:** High for 3D limited and canvas items; Low for originals.
- **NEEDS_REVIEW:** Define the intended original-art sequence represented by `ORIG!`, and confirm behavior for `2 3D`, `2 3D Open`, paper, and blank types.

## Formula

```text
2 3D Lim: 1 MAKE BASE, 2 BASE, 5 MAKE FRAME unless Stretched, 6 FRAME/WIRE
3 Canv:   3 MAKE STRETCHER, 4 STRETCH, 5 MAKE FRAME unless Stretched, 6 FRAME/WIRE
other:    ORIG! placeholders, then frame/wire steps where applicable
```
