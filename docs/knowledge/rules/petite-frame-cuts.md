# Petite Frame And Board Cuts

- **Rule Name:** Petite Frame And Board Cuts
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Petites List`
- **Cell(s) or table used:** `A2:O33`
- **Inputs:** Width, length, and petite frame style.
- **Outputs:** Normalized size, frame cuts, board cuts, outer frame dimensions, and shipper.
- **Dependencies:** Inline frame-add lookup `N2:O4`.
- **Exceptions:** Black/Gold PA uses `6 15/16` frame addition and 7-inch outer addition; Gold/Silver PA uses `8 9/16` frame addition and 9-inch outer addition. Most board cuts add 1.125 inches; row 3 uses `1 1/16`.
- **Related lookup tables:** `Petites List!N2:O4` frame-to-length-add mapping.
- **Related named ranges:** None.
- **Business purpose:** Produces specialized cuts and packing data for petite framed works.
- **Suggested TypeScript service:** `FrameRules`
- **Confidence:** High for formulas; Medium for current operational use.
- **NEEDS_REVIEW:** Resolve the row-3 board-cut difference and the apparent spelling `Sliver PA`; confirm this hidden sheet is still authoritative.

## Formula

Pseudocode: normalize dimensions; add the frame-style allowance to each frame cut; add 1.125 inches to each board cut; add 7 or 9 inches to outer frame dimensions based on style.
