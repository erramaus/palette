# Battle Plan Base And Frame Cuts

- **Rule Name:** Battle Plan Base And Frame Cuts
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `BP`
- **Cell(s) or table used:** `AL4:AN27`; inline lookup `AP3:AR22`
- **Inputs:** Product type, artwork dimensions, frame style.
- **Outputs:** Make-base/stretcher cut, finished base/stretch size, frame cut, and finished frame size.
- **Dependencies:** Inline columns `FRAME`, `BASE`, and `FRAME CUT`.
- **Exceptions:** Canvas make-stretcher cuts subtract `1/16`. 3D base cuts subtract the `BASE` lookup value, which includes positive, zero, and negative values. Frame cuts add `FRAME CUT` values. Unsupported types return blanks.
- **Related lookup tables:** `BP!AP4:AR22`.
- **Related named ranges:** None.
- **Business purpose:** Supplies cut dimensions beside each Battle Plan fabrication step.
- **Suggested TypeScript service:** `BattlePlanRules`
- **Confidence:** High.
- **NEEDS_REVIEW:** Reconcile this inline adjustment table with both `Measurements` sheets; values and naming are not identical.

## Formula

```text
canvasMakeStretcher = artworkDimension - 1/16
limited3dMakeBase = artworkDimension - exactLookup(frame, BP.base)
finishedBaseOrStretch = artworkDimension
makeFrame = artworkDimension + exactLookup(frame, BP.frameCut)
finishedFrame = artworkDimension
```
