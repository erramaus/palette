# Workshop Cut Dimensions And Girth

- **Rule Name:** Workshop Cut Dimensions And Girth
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Workshop List`; `Workshop Tags Paste`; `Actual Times`
- **Cell(s) or table used:** `Workshop List!T7:U107`; `Workshop Tags Paste!T6:U57`; `Actual Times!T4093:U6089`
- **Inputs:** Calculated frame width and height; frame type; product type.
- **Outputs:** Millimeter cut-dimension label and package girth estimate.
- **Dependencies:** Workshop Frame Dimensions.
- **Exceptions:** `Roll` and `Rolled` return `N/A` for dimensions. Some historical original rows used raw frame dimensions instead of the millimeter conversion.
- **Related lookup tables:** `Measurements!D:E` indirectly through frame dimensions.
- **Related named ranges:** None.
- **Business purpose:** Produces fabrication dimensions and an oversize-shipping measure.
- **Suggested TypeScript service:** `FrameRules`
- **Confidence:** High for current formulas; Medium across historical rows.
- **NEEDS_REVIEW:** Confirm why each dimension adds 4.25 inches before conversion, then adds 5 millimeters, and why girth adds 5 inches and 12 inches.

## Formula

```text
cutDim = (roundUp((min(frameW, frameH) + 4.25) * 25.4) + 5)
       + " x "
       + (roundUp((max(frameW, frameH) + 4.25) * 25.4) + 5)
girth = roundUp(max(frameW, frameH) + 5)
      + 2 * roundUp(min(frameW, frameH) + 5)
      + 12
```
