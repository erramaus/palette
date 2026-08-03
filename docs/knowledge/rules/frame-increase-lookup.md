# Frame Increase Lookup

- **Rule Name:** Frame Increase Lookup
- **Source Workbook:** `warehouse_production_tags_2026-07-01.xlsx`; `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Measurements`; `Measurements`
- **Cell(s) or table used:** Tag workbook `A2:B33`; production workbook `D2:E31`
- **Inputs:** Frame name.
- **Outputs:** Per-dimension frame increase in inches.
- **Dependencies:** Exact frame-name match.
- **Exceptions:** `Stretched`, `None`, `Rolled`, and `Picture Rolled` map to zero in the tag workbook. The two workbooks disagree for several names, including Black, Silver, White, Gold, Gold REH, Silver REH, and Silver Plein Faux.
- **Related lookup tables:** Both `Measurements` frame/increase ranges.
- **Related named ranges:** None.
- **Business purpose:** Converts artwork dimensions into finished outside frame dimensions.
- **Suggested TypeScript service:** `FrameRules`
- **Confidence:** High that the tables are authoritative inputs; Low on which duplicate table is current.
- **NEEDS_REVIEW:** Reconcile all values between the two workbooks before implementation; do not merge by assumption.

## Formula

`finishedDimension = artworkDimension + exactLookup(frameName, frameIncreaseTable)`
