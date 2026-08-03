<!-- markdownlint-disable MD060 -->

# Production Rules Index

This index covers Phase 2 extraction from worksheets identified as drivers of the Workshop List, Production Tags, frame/base/stretcher/Dibond calculations, Timeline, Printing, and Battle Plans. Each linked rule records exact source cells, formulas or pseudocode, dependencies, exceptions, lookups, named ranges, implementation ownership, confidence, and unresolved source questions.

## Order Import

| Rule | Primary source | Confidence |
|---|---|---|
| [Dated Order Import Schema](rules/order-import-schema.md) | `2026-07-28-OrdersList.xlsx` / `7 28 2026!A1:N4` | High contract; Medium semantics |
| [Collector Contact Workshop Update Flag](rules/collector-workshop-update-flag.md) | `Contact with Collectors.xlsx` / `Originals`; `Recreation` | High trigger; Medium workflow |
| [Warehouse Report Order Date](rules/warehouse-report-order-date.md) | `Warehouse Production Sheets.xlsx` / `Warehouse reports paste!B2:B29` | High arithmetic; Low authority |

## Workshop List

| Rule | Primary source | Confidence |
|---|---|---|
| [Workshop Dimension Normalization](rules/workshop-dimension-normalization.md) | `Workshop List!I,Q`; related staging/history sheets | High |
| [Workshop Operation Routing](rules/workshop-operation-routing.md) | `Workshop List!AG:BH`; `Actual Times!AG:BH` | High matrix; Medium branches |
| [Workshop Workload Summary](rules/workshop-workload-summary.md) | `Workshop List!A1:I4`; `Workshop Tags Paste!A1:O4` | High formulas; Medium conversion |

## Printing

| Rule | Primary source | Confidence |
|---|---|---|
| [3D Print Table Capacity](rules/print-table-capacity.md) | `3D table plan!B2:M11` | Medium |
| [3D Print Pass Time Normalization](rules/print-pass-time-normalization.md) | `3D Print Times!H2:M36` | Medium |
| [3D Print Time Estimate](rules/print-time-estimate.md) | `3D Print Times!U2:AD59` | Medium formula; Low model meaning |

## Frames

| Rule | Primary source | Confidence |
|---|---|---|
| [Frame Increase Lookup](rules/frame-increase-lookup.md) | Both `Measurements` sheets | High tables; Low authority conflict |
| [Workshop Frame Dimensions](rules/workshop-frame-dimensions.md) | `Workshop List!R:S`; related staging/history sheets | High |
| [Workshop Cut Dimensions And Girth](rules/workshop-cut-dimensions-and-girth.md) | `Workshop List!T:U`; related staging/history sheets | High current; Medium history |
| [Petite Frame And Board Cuts](rules/petite-frame-cuts.md) | `Petites List!A2:O33` | High formulas; Medium current use |
| [Cost Calculator Frame Envelope](rules/cost-calculator-frame-envelope.md) | Both cost calculators | High formula; Low authority |

## Bases

| Rule | Primary source | Confidence |
|---|---|---|
| [Base Adjustment Lookup](rules/base-adjustment-lookup.md) | Tag workbook `Measurements!D2:E16` | High |

## Stretchers

| Rule | Primary source | Confidence |
|---|---|---|
| [Stretcher Cut Deduction](rules/stretcher-cut-deduction.md) | `BP`; `Helper BPs` | High |
| [Stretcher Support Thresholds](rules/stretcher-support-thresholds.md) | `Helper BPs!F6:G32` | High |

## Dibond

| Rule | Primary source | Confidence |
|---|---|---|
| [Dibond Cut Millimeters](rules/dibond-cut-millimeters.md) | `Dibond Cutting`; `Dibond Pieces Cutting` | High |
| [Dibond Layout Spacing](rules/dibond-layout-spacing.md) | `Dibond Cutting`; `Dibond Pieces Cutting` | Medium |
| [Dibond Inches Up Display](rules/dibond-inches-up.md) | `Dibond Pieces Cutting` | Medium |

## Tags

| Rule | Primary source | Confidence |
|---|---|---|
| [Production Tag Product Category](rules/tag-product-category.md) | `Tags` repeated header blocks | High formula; Medium fallback |
| [3D Production Tag Checklist](rules/tag-3d-checklist.md) | `Tags` repeated checklist blocks | High |
| [Production Tag Multiple Customer Marker](rules/tag-multiple-customer-marker.md) | `Tags` customer fields and column Q | High |
| [Production Tag Packaging Display](rules/tag-packaging-display.md) | `Tags` package fields; `Box Lookup` | High |
| [Production Tag Build Part Routing](rules/tag-build-part-routing.md) | `Tags` build labels | High formula; Medium fallback |
| [Production Tag Stretcher And Base Cuts](rules/tag-stretcher-and-base-cuts.md) | `Tags` build-cut blocks; tag `Measurements` | High formula; Medium fallback |

## Timeline

| Rule | Primary source | Confidence |
|---|---|---|
| [Workshop Days To Due](rules/workshop-days-to-due.md) | Workshop, staging, history, and report date columns | High |
| [Workshop Production Start Date](rules/workshop-production-start-date.md) | Workshop, staging, and history date columns | High arithmetic; Medium meaning |
| [Workshop Cumulative Time](rules/workshop-cumulative-time.md) | Workshop, staging, and history cumulative columns | High current; Medium units |
| [Workshop Pack And Ship Time](rules/workshop-pack-ship-time.md) | `Workshop List!BG:BH`; `Actual Times!BG:BH` | High |
| [Week Ending Progression](rules/week-ending-progression.md) | `WEs!A2:B1000` | High series; Low recurrence meaning |
| [Manual Production Step Tracking Grid](rules/manual-step-tracking-grid.md) | `Tracking Steps.xlsx` / `Template`; `July 2026` | Medium |

## Battle Plans

| Rule | Primary source | Confidence |
|---|---|---|
| [Battle Plan Operation Sequence](rules/battle-plan-operation-sequence.md) | `BP!AI4:AN27` | High scoped types; Low originals |
| [Battle Plan Base And Frame Cuts](rules/battle-plan-base-and-frame-cuts.md) | `BP!AL4:AR27` | High |
| [Battle Plan Print Date](rules/battle-plan-print-date.md) | `BP!B2`; `Print BP!B2` | High |
| [Battle Plan Print Projection](rules/battle-plan-print-projection.md) | `Print BP`; `Basing BP` | High projection; Low selection |

## Inventory

| Rule | Primary source | Confidence |
|---|---|---|
| [Workshop Packaging Selection](rules/workshop-packaging-selection.md) | `Workshop List!Y`; `Actual Times!Y` | High formula; Medium overrides |
| [Box Face Cut](rules/box-face-cut.md) | Tag workbook `Box Lookup!A1:F7` | High |
| [Material Demand Overage](rules/material-demand-overage.md) | `Materials!B2:D56` | High scaling; Medium source period |
| [Material Unit Cost Valuation](rules/material-unit-cost-valuation.md) | Cost calculators; `Costs!A:B` | High |
| [Production Cost And Profitability](rules/production-cost-and-profitability.md) | Both cost calculators | High arithmetic; Medium authority |

## Worksheets Analyzed

Twenty-six worksheets were inspected for rule extraction:

- `2026-07-28-OrdersList.xlsx`: `7 28 2026`
- `Contact with Collectors.xlsx`: `Original Collectors - 2026`; `ReplicaCanvasPrint Collectors -`
- `Tracking Steps.xlsx`: `Template`; `July 2026`
- `Warehouse Production Sheets.xlsx`: `Materials`; `BP`; `Print BP`; `Workshop Tags Paste`; `Workshop List`; `Actual Times`; `3D table plan`; `Dibond Cutting`; `Dibond Pieces Cutting`; `Cost Calculator`; `Simple Cost Calculator`; `Basing BP`; `Helper BPs`; `Measurements`; `Petites List`; `3D Print Times`; `Warehouse reports paste`; `WEs`
- `warehouse_production_tags_2026-07-01.xlsx`: `Tags`; `Measurements`; `Box Lookup`

## Lookup Catalog

| Lookup | Used by |
|---|---|
| `Contact with Collectors.xlsx` tables `Originals`, `Recreation` | Collector-to-Workshop update flag |
| Production workbook `Measurements!D:E` | Workshop frame dimensions |
| Tag workbook `Measurements!A:B` | Tag frame dimensions |
| Tag workbook `Measurements!D:E` | Base and component cuts |
| `BP!AP:AR` | Battle Plan base and frame adjustments |
| `Petites List!N:O` | Petite frame additions |
| Tag workbook `Box Lookup!A:F` | Packaging display and face cuts |
| Production workbook `Measurements!G:H` | Box/girth references and rolled-box SKUs |
| `Actual Times!AG:BH` | Historical operation, pack, and ship durations |
| `3D Print Times!A:M` | Historical pass-time factors |
| `Costs!A:B` | Material unit costs |
| `Materials!A:B` and `Black Friday Calc` usage columns | Material demand baseline |

## Review Status

Every rule file identifies any source question under `NEEDS_REVIEW`. Twenty-six rules contain a Medium or Low confidence aspect that affects authority, fallback behavior, units, historical applicability, or manual workflow. The remaining fifteen have High-confidence formulas but still record implementation-policy questions where the workbook does not define validation or failure behavior.
