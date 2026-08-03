# Workshop Pack And Ship Time

- **Rule Name:** Workshop Pack And Ship Time
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Workshop List`; `Actual Times`
- **Cell(s) or table used:** `Workshop List!BG7:BH107`; `Actual Times!BG:BH`
- **Inputs:** Packaging method, frame, product type, historical pack/ship durations, named defaults.
- **Outputs:** Estimated pack and ship minutes or `X`.
- **Dependencies:** `Actual Times` averages; named ranges `PP` and `SP`.
- **Exceptions:** Delivery is 5 minutes; crate is 300 minutes; gallery/pickup produce `X`; CNC and rolled work use historical averages when available.
- **Related lookup tables:** Historical `Actual Times!Y:BH` operation records.
- **Related named ranges:** `PP`; `SP`.
- **Business purpose:** Estimates fulfillment effort for schedule and workload totals.
- **Suggested TypeScript service:** `TimelineRules`
- **Confidence:** High.
- **NEEDS_REVIEW:** Define fallback behavior when `AVERAGEIF` has no qualifying history and confirm whether crate time is always 300 minutes.

## Formula

```text
pack = DELIVERY ? 5
     : CNC ? averageHistoricalCncPack
     : CRATE ? 300
     : GALLERY or PICKUP ? X
     : Rolled ? averageHistoricalRolledPack
     : PP
ship = Rolled ? averageHistoricalRolledShip
     : GALLERY or PICKUP or 0 Canv ? X
     : SP
```
