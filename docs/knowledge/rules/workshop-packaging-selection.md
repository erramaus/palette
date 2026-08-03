# Workshop Packaging Selection

- **Rule Name:** Workshop Packaging Selection
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Workshop List`; `Actual Times`
- **Cell(s) or table used:** `Workshop List!Y7:Y51`; `Actual Times!Y4093:Y6089`
- **Inputs:** Girth, frame, minimum artwork dimension, and manual destination override.
- **Outputs:** `CRATE`, `CNC`, `GALLERY`, `PICKUP`, or rolled-box SKU.
- **Dependencies:** Workshop Cut Dimensions And Girth; rolled-box thresholds.
- **Exceptions:** Girth over 165 always selects `CRATE`. Rolled pieces use `<22`, `<34`, and `<54` thresholds; no explicit result exists at or above 54. Historical rows include manual `GALLERY` and `PICKUP` outputs.
- **Related lookup tables:** Rolled box SKUs `S-14048`, `S-14049`, `S-5574` in `Measurements!G:H` and production-tags `Box Lookup`.
- **Related named ranges:** None.
- **Business purpose:** Chooses a shipping/packaging path from finished dimensions and fulfillment method.
- **Suggested TypeScript service:** `ShippingRules`
- **Confidence:** High for the formula; Medium for override precedence.
- **NEEDS_REVIEW:** Define the rolled-piece result when `min(width,length)+5 >= 54` and formalize manual override priority.

## Formula

```text
if girth > 165: CRATE
else if frame == Rolled:
  if minDimension + 5 < 22: S-14048
  else if minDimension + 5 < 34: S-14049
  else if minDimension + 5 < 54: S-5574
else: CNC
```
