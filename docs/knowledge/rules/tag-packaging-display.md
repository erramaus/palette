# Production Tag Packaging Display

- **Rule Name:** Production Tag Packaging Display
- **Source Workbook:** `warehouse_production_tags_2026-07-01.xlsx`
- **Source Worksheet:** `Tags`
- **Cell(s) or table used:** Repeated tag fields `E5:E7`, `L5:L7`, and equivalent blocks; source packaging `AF`, source cut dimensions `AD`, source frame dimensions `AB:AC`
- **Inputs:** Tag category, packaging method, cut dimensions, frame dimensions.
- **Outputs:** Box method, box/cut detail, and displayed package dimensions.
- **Dependencies:** `Box Lookup!A:E`; packaging values `DELIVERY`, `GALLERY`, `PICKUP`, `CNC`, `CRATE`.
- **Exceptions:** Gallery, pickup, and delivery pass through as text. Crate returns a blank dimension. Paper+CNC uses `26 x 22 x 6`; other paper uses `25 x 3 x 3`.
- **Related lookup tables:** `Box Lookup!A2:E22`.
- **Related named ranges:** None.
- **Business purpose:** Places actionable packing dimensions and method on each production tag.
- **Suggested TypeScript service:** `ProductionTagRules`
- **Confidence:** High.
- **NEEDS_REVIEW:** Confirm why crate dimensions are blank and whether delivery handling should match the first and later repeated tag blocks.

## Formula

```text
box = packagingMethod
boxDetail = gallery/pickup/delivery ? packagingMethod : sourceCutDimensions
if PAPER: dimensions = CNC ? "26 x 22 x 6" : "25 x 3 x 3"
else if gallery/pickup/delivery: dimensions = packagingMethod
else if CNC: dimensions = roundUp(max(frameDims)+5) + " x " + roundUp(min(frameDims)+5) + " x 6"
else if CRATE: dimensions = ""
else: dimensions = exactLookup(packagingMethod, BoxLookup.pasteSize)
```
