# Dibond Cut Millimeters

- **Rule Name:** Dibond Cut Millimeters
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Dibond Cutting`; `Dibond Pieces Cutting`
- **Cell(s) or table used:** `Dibond Cutting!C2:C8,K2:K8,S7:S8`; `Dibond Pieces Cutting!C3:C26,K14:K77,AA25:AA26`
- **Inputs:** Requested cut dimension in inches.
- **Outputs:** Integer cut dimension in millimeters.
- **Dependencies:** Inch-to-millimeter factor 25.4 and a `9/32`-inch allowance.
- **Exceptions:** `Dibond Pieces Cutting` suppresses output for zero or blank source values; some “inches up” helper cells convert without the `9/32` allowance.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Converts finished Dibond dimensions into machine-ready millimeter cuts with a fixed fabrication allowance.
- **Suggested TypeScript service:** `DibondRules`
- **Confidence:** High.
- **NEEDS_REVIEW:** Confirm the physical reason for the `9/32` allowance and whether `ROUNDDOWN` is required for all cutters.

## Formula

`cutMillimeters = ROUNDDOWN((inches + 9/32) * 25.4, 0)`
