# Workshop Frame Dimensions

- **Rule Name:** Workshop Frame Dimensions
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Workshop List`; `Workshop Tags Paste`; `Actual Times`
- **Cell(s) or table used:** `Workshop List!R7:S107`; `Workshop Tags Paste!R6:S57`; `Actual Times!R4093:S6089`; lookup `Measurements!D:E`
- **Inputs:** Width, length, frame, product type.
- **Outputs:** Frame width and frame height/length.
- **Dependencies:** Exact-match frame increase lookup; paper products prepend `Picture` plus a space to the frame name.
- **Exceptions:** `Roll` and `Rolled` return `N/A`; missing lookup keys produce Excel lookup errors; early Workshop List rows omit the paper-prefix branch.
- **Related lookup tables:** `Measurements!D2:E31` frame-to-increase mapping.
- **Related named ranges:** None.
- **Business purpose:** Converts artwork dimensions into outside frame dimensions for cutting, packing, and tags.
- **Suggested TypeScript service:** `FrameRules`
- **Confidence:** High.
- **NEEDS_REVIEW:** Reconcile the early-row formula variant and decide behavior for missing or duplicate frame names.

## Formula

```text
if frame in {"Roll", "Rolled"}: N/A
lookupKey = productType == "4 Paper" ? "Picture " + frame : frame
frameWidth = min(width, length) + exactLookup(lookupKey, Measurements.frameIncrease)
frameHeight = max(width, length) + exactLookup(lookupKey, Measurements.frameIncrease)
```
