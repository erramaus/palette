<!-- markdownlint-disable MD060 -->

# Palette Workbook Map

This map documents every worksheet found in the six authoritative Excel workbooks in `docs/source`. Purpose and driver assignments are based on worksheet names, visible labels, formula references, named-range destinations, and Excel table metadata. `NEEDS_REVIEW` means the available workbook evidence does not establish the operational purpose with sufficient confidence.

## Driver Key

- **Workshop List**: order queue and workshop status data.
- **Production Tags**: printable or scannable production labels.
- **Frame / Base / Stretcher / Dibond**: product-specific calculations or instructions.
- **Inventory**: stock, purchasing, usage, or replenishment.
- **Battle Plans**: production work allocation or build instructions.
- **Timeline**: dates, durations, work tracking, or scheduling.
- **Statistics**: performance, cost, throughput, or historical analysis.
- **Imports / Exports**: staging data entering or leaving an operational workbook.

## 2026-07-28-OrdersList.xlsx

Workbook role: small dated order export or manually prepared import containing due date, dimensions, item, customer, type, and frame.

| Worksheet | Visibility | Apparent purpose | Formulas | Named ranges used | Excel tables | Likely drivers |
|---|---|---|---:|---|---|---|
| `7 28 2026` | Visible | Dated order list used to introduce orders into production. | 0 | None | None | Imports; Workshop List |

## Contact with Collectors.xlsx

Workbook role: collector-contact log with current lists and reusable templates. Four structured Excel tables hold the active/template records.

| Worksheet | Visibility | Apparent purpose | Formulas | Named ranges used | Excel tables | Likely drivers |
|---|---|---|---:|---|---|---|
| `Sheet1` | Hidden | Legacy contact log with name, contact method, date, and reason. Its relationship to the structured 2026 sheets is **NEEDS_REVIEW**. | 0 | None | None | Workshop List (possible manual input) |
| `Original Collectors - 2026` | Visible | Active contact register for original-art collectors, including order number and whether to add an item to the Workshop List. | 0 | None | `Originals` | Workshop List; Imports |
| `Template - Original Collectors` | Hidden | Blank/reusable template for the original-collector contact register. | 0 | None | `Originals_2` | Workshop List; Imports |
| `ReplicaCanvasPrint Collectors -` | Visible | Active replica/canvas-print collector contact register with Workshop List update status. | 0 | None | `Recreation` | Workshop List; Imports |
| `Template - ReplicaCanvasPrint C` | Hidden | Blank/reusable template for replica/canvas-print collector contacts. | 0 | None | `Recreation_2` | Workshop List; Imports |

## Tracking Steps.xlsx

Workbook role: monthly day-by-day production-step tracking. The current template and July 2026 sheet are visible; prior periods are retained as hidden history.

| Worksheet | Visibility | Apparent purpose | Formulas | Named ranges used | Excel tables | Likely drivers |
|---|---|---|---:|---|---|---|
| `Template` | Visible | Blank monthly production-step tracking grid organized by week-ending dates and days. | 0 | None | None | Timeline; Statistics |
| `July 2026` | Visible | Current July 2026 daily/weekly production-step tracking grid. | 0 | None | None | Timeline; Statistics |
| `February 2026` | Hidden | Archived February 2026 production-step tracking grid. | 0 | None | None | Timeline; Statistics |
| `December 2025` | Hidden | Archived December 2025 production-step tracking grid. | 0 | None | None | Timeline; Statistics |
| `November 2025` | Hidden | Archived November 2025 production-step tracking grid. | 0 | None | None | Timeline; Statistics |
| `October 2025` | Hidden | Archived October 2025 production-step tracking grid. | 0 | None | None | Timeline; Statistics |
| `September 2025` | Hidden | Archived September 2025 production-step tracking grid. | 0 | None | None | Timeline; Statistics |
| `August 2025` | Hidden | Archived August 2025 production-step tracking grid. | 0 | None | None | Timeline; Statistics |
| `April 2025` | Hidden | Archived April 2025 production-step tracking grid. | 0 | None | None | Timeline; Statistics |
| `May 2025` | Hidden | Archived May 2025 production-step tracking grid. | 0 | None | None | Timeline; Statistics |
| `June 2025` | Hidden | Archived June 2025 production-step tracking grid. | 0 | None | None | Timeline; Statistics |
| `July 2025` | Hidden | Archived July 2025 production-step tracking grid. | 0 | None | None | Timeline; Statistics |
| `March 2025` | Hidden | Archived March 2025 production-step tracking grid; the second week-ending value is blank and should be reviewed before reuse. | 0 | None | None | Timeline; Statistics |

## Warehouse Inventory 2026-07-08.xlsx

Workbook role: location-specific stock and reorder calculations plus historical purchase-order records.

| Worksheet | Visibility | Apparent purpose | Formulas | Named ranges used | Excel tables | Likely drivers |
|---|---|---|---:|---|---|---|
| `Unit A` | Visible | Unit A stock, order quantity, 12-week target, reorder quantity, and weeks-on-hand calculations. | 354 | None | None | Inventory; Statistics |
| `Unit B` | Visible | Unit B stock, maximum quantity, reorder quantity, and weeks-on-hand calculations. | 435 | None | None | Inventory; Statistics |
| `Unit C` | Visible | Unit C stock, maximum quantity, reorder quantity, and weeks-on-hand calculations. | 125 | None | None | Inventory; Statistics |
| `Erins Studio` | Visible | Erin's Studio stock, reorder, weeks-on-hand, and purchasing calculations. | 415 | None | None | Inventory; Statistics |
| `Total PO Values` | Hidden | Aggregates purchase-order totals by account and location. | 20 | None | None | Inventory; Statistics; Exports |
| `2021-10-21 POs` | Hidden | Archived purchase order dated 2021-10-21 with quantity, vendor, account, unit price, and subtotal. | 1 | None | None | Inventory; Imports/Exports |
| `2021-10-14 POs` | Hidden | Archived purchase order dated 2021-10-14 with quantity, vendor, account, unit price, and subtotal. | 6 | None | None | Inventory; Imports/Exports |

## Warehouse Production Sheets.xlsx

Workbook role: central legacy production workbook. It combines imports, Workshop List operations, production tags, Battle Plans, product calculations, inventory, cost analysis, timing, and statistics.

| Worksheet | Visibility | Apparent purpose | Formulas | Named ranges used | Excel tables | Likely drivers |
|---|---|---|---:|---|---|---|
| `3D Table Export` | Hidden | Export-shaped 3D print table containing print date, key, name, coverage, material, and ink-color fields. | 0 | None | None | Exports; Production Tags |
| `Black Friday Calc` | Visible | Weekend-ending sales/production scenario calculator using customer, product, value, dimensions, frame, and date. | 192 | None | None | Statistics; Frame calculations |
| `Materials` | Visible | Material demand, overage, cost, quantity, and stretcher-inch calculations. | 137 | `CF`, `DF`, `CS`, `CB` | None | Inventory; Stretcher calculations; Statistics |
| `BP` | Visible | Main Battle Plan worksheet for frame, base, frame-cut, and assembly instructions. | 145 | `stretch` (broken `#REF!` definition) | None | Battle Plans; Frame; Base; Stretcher |
| `Print BP` | Visible | Compact printable Battle Plan output, primarily showing base-making instructions. | 1 | None | None | Battle Plans; Base; Exports |
| `Analysis` | Visible | Historical production/sales analysis by sent date, dimensions, count, year, square inches, and price. | 796 | None | None | Statistics |
| `Workshop Tags Paste` | Visible | Staging/paste area for production-tag data and counts by original, 3D, and canvas work. | 2,141 | None | None | Production Tags; Imports; Workshop List |
| `Steps Log` | Hidden | Workshop-operator weekly steps log by employee initials. | 5 | None | None | Timeline; Statistics |
| `Stats` | Visible | Weekly production summary for value of sales, number of pieces, deadlines, steps, value printed, and employee step counts. | 7,101 | None | None | Statistics; Timeline |
| `Stats Data` | Visible | Detailed source/calculation grid feeding production averages and statistical summaries. | 88,536 | `canvas`, `COA`, `ink` (`canvas` and `ink` are broken `#REF!` definitions) | None | Statistics; Workshop List |
| `Workshop List` | Visible | Central operational queue for originals, 3D prints, canvas prints, file status, print status, due dates, and production checkpoints. | 2,763 | `PT`, `SC`, `CF`, `SP`, `DFC`, `PP`, `PCP`, `PB`, `WP`, `SIF`, `S3D`, `JCS`, `COA`, `JF`, `DF`, `M3D`, `S3DP`, `TDF`, `CS`, `CB`, `SCP`, `CCS`, `JS`, `CFC`, `JB`, `PBC` | None | Workshop List; Production Tags; Timeline; Imports |
| `Actual Times` | Visible | Detailed actual-duration and due-date calculations for originals, 3D prints, and canvas prints. | 19,834 | `PT`, `SC`, `CF`, `SP`, `DFC`, `PP`, `PCP`, `PB`, `WP`, `SIF`, `S3D`, `JCS`, `COA`, `JF`, `DF`, `M3D`, `S3DP`, `TDF`, `CS`, `CB`, `SCP`, `CCS`, `JS`, `CCP`, `CFC`, `JB`, `PBC` | None | Timeline; Statistics; Workshop List |
| `3D table plan` | Visible | Layout calculator for arranging 3D prints on a table with fixed width/height constraints. | 7 | None | None | Battle Plans; Production calculations |
| `Purchase Orders` | Visible | Current purchase-order preparation sheet using stock, item, vendor, account, and pricing fields. | 65 | None | None | Inventory; Exports |
| `Moulding Summary` | Visible | Current moulding stock, usage, months-in-stock, average usage, and maximum usage summary. | 55 | None | None | Inventory; Frame; Statistics |
| `Moulding Inventory History` | Visible | Dated moulding inventory and usage history with stock-difference calculations. | 2,086 | None | None | Inventory; Frame; Statistics |
| `Damage Log` | Hidden | Manual log of damaged orders/pieces and damaged parts. | 0 | None | None | Statistics; Workshop List |
| `Canvas Project` | Hidden | One-off canvas/frame preparation checklist. Continued operational relevance is **NEEDS_REVIEW**. | 0 | None | None | Stretcher; Timeline |
| `Dibond Cutting` | Hidden | Dibond sheet cutting-layout calculator converting inches/millimeters and positioning cut lines. | 173 | None | None | Dibond calculations; Battle Plans |
| `Dibond Pieces Cutting` | Hidden | Piece-level Dibond cutting-layout calculator with cut positions and inches-up calculations. | 418 | None | None | Dibond calculations; Battle Plans |
| `ABS Paste` | Hidden | Pasted order/report staging data with due, ship, location, customer, and item fields. Exact upstream source is **NEEDS_REVIEW**. | 120 | None | None | Imports; Timeline; Workshop List |
| `La Quinta Itinerary` | Hidden | Travel itinerary unrelated to an evident production workflow. **NEEDS_REVIEW** for retention. | 0 | None | None | None established |
| `Cost Calculator` | Visible | Detailed print cost, cost-of-goods, ROI, dimensions, frame, shipping, and production scenario calculator. | 4,074 | `canvas`, `COA`, `ink` (`canvas` and `ink` are broken `#REF!` definitions) | None | Frame; Base; Stretcher; Statistics; Inventory |
| `Simple Cost Calculator` | Visible | Compact cost-of-goods and ROI calculator using type, selling price, dimensions, frame, and weight. | 103 | `canvas`, `COA`, `ink` (`canvas` and `ink` are broken `#REF!` definitions) | None | Frame; Base; Stretcher; Statistics |
| `Boxes` | Visible | Box cost, dimensions, and girth lookup. | 5 | None | None | Inventory; Lookup; Base/Frame shipping calculations |
| `Basing BP` | Hidden | Historical or specialized basing Battle Plan with customer, artwork, size, and frame data. | 84 | None | None | Battle Plans; Base |
| `Value Printed` | Hidden | Historical value-printed log by date, customer, piece, size, and value. | 0 | None | None | Statistics; Timeline |
| `Erin Approved Images` | Hidden | Artwork/image approval-date lookup used to determine production readiness. | 0 | None | None | Lookup; Workshop List; Timeline |
| `Helper BPs` | Hidden | Helper calculations for canvas stretchers, cuts, strainers, customer, image, and size. | 189 | None | None | Battle Plans; Stretcher; Frame |
| `Costs` | Visible | Material/item cost master with actual cost, overage, calculated cost, and unit. | 8,685 | None | None | Lookup; Inventory; Material calculations; Statistics |
| `Measurements` | Visible | Frame-size, frame increase, shipper, box, girth, state, and zone lookup/calculation sheet. | 19 | None | None | Lookup; Frame; Base; Inventory |
| `Petites List` | Hidden | Specialized shipped-list and frame-cut calculator for petite works. Current use is **NEEDS_REVIEW**. | 220 | None | None | Frame calculations; Battle Plans |
| `GirthShipping` | Visible | Shipping lookup/calculation by girth, average weight, and average shipping cost. | 206 | None | None | Lookup; Inventory; Statistics |
| `3D Print Times` | Hidden | 3D print duration history/calculator using dimensions, layers, passes, time, and time per width. | 438 | None | None | Timeline; Statistics; Battle Plans |
| `SA` | Visible | Large iterative calculation grid labeled SAV. A, result, totals, and averages. Business meaning is **NEEDS_REVIEW**. | 140,811 | None | None | Calculation purpose uncertain |
| `Warehouse reports paste` | Hidden | Paste/import staging area for warehouse reports with due dates, age, dimensions, item, value, shipping, customer, and frame. | 308 | None | None | Imports; Workshop List; Timeline |
| `Monthly CoG` | Hidden | Monthly value-of-sales and cost-of-goods summary sourced from `Stats Data`. | 5 | None | None | Statistics |
| `Prints CoG snapshot 2022-04-07` | Hidden | Historical print cost-of-goods snapshot with dimensions, frame, box, value, shipping, and material calculations. | 7,222 | `canvas`, `ink` (both broken `#REF!` definitions) | None | Statistics; Frame; Inventory |
| `Gallery Work` | Visible | Project labor/time log calculating total time and seconds per unit. | 168 | None | None | Timeline; Statistics |
| `Usage Numbers` | Hidden | Historical usage analysis and 12-week stock calculations by product, frame, box, and material. | 3,494 | None | None | Inventory; Statistics; Material calculations |
| `WEs` | Hidden | Date/week-ending helper and stretcher cut-quantity history. | 1,986 | None | None | Stretcher calculations; Timeline; Statistics |
| `Shipping Options` | Hidden | Purchasing lookup for common supplies, vendors, quantities, subtotals, and urgency. | 0 | None | None | Lookup; Inventory |
| `Hours` | Visible | Work-hours and take-home-pay history with duration and average calculations. Relationship to production capacity is **NEEDS_REVIEW**. | 145 | None | None | Timeline; Statistics |

### Named Ranges

All 36 workbook-level named ranges are in `Warehouse Production Sheets.xlsx`.

| Name | Destination | Status |
|---|---|---|
| `AVG` | `'Stats Data'!$R$2` | Valid |
| `CB` | `'Workshop List'!$AN$1` | Valid |
| `CCP` | `'Workshop List'!$AT$1` | Valid |
| `CCS` | `'Workshop List'!$AU$1` | Valid |
| `CF` | `'Workshop List'!$AY$1` | Valid |
| `CFC` | `'Workshop List'!$BD$1` | Valid |
| `COA` | `'Workshop List'!$BE$1` | Valid |
| `CS` | `'Workshop List'!$AG$1` | Valid |
| `DF` | `'Workshop List'!$AR$1` | Valid |
| `DFC` | `'Workshop List'!$AZ$1` | Valid |
| `GSO` | `#REF!` | Broken; **NEEDS_REVIEW** |
| `GST` | `#REF!` | Broken; **NEEDS_REVIEW** |
| `JB` | `'Workshop List'!$AO$1` | Valid |
| `JCS` | `'Workshop List'!$AV$1` | Valid |
| `JF` | `'Workshop List'!$BA$1` | Valid |
| `JS` | `'Workshop List'!$AH$1` | Valid |
| `M3D` | `'Workshop List'!$AQ$1` | Valid |
| `PB` | `'Workshop List'!$AP$1` | Valid |
| `PBC` | `'Workshop List'!$AX$1` | Valid |
| `PCP` | `'Workshop List'!$AS$1` | Valid |
| `PP` | `'Workshop List'!$BG$1` | Valid |
| `PT` | `'Workshop List'!$AK$1` | Valid |
| `S3D` | `'Workshop List'!$BF$1` | Valid |
| `S3DP` | `'Workshop List'!$AM$1` | Valid |
| `SC` | `'Workshop List'!$AI$1` | Valid |
| `SCP` | `'Workshop List'!$AW$1` | Valid |
| `SIF` | `'Workshop List'!$BB$1` | Valid |
| `SP` | `'Workshop List'!$BH$1` | Valid |
| `SZN` | `#REF!` | Broken; **NEEDS_REVIEW** |
| `TDF` | `'Workshop List'!$AL$1` | Valid |
| `VRN` | `'Workshop List'!$AJ$1` | Valid |
| `WP` | `'Workshop List'!$BC$1` | Valid |
| `canvas` | `#REF!` | Broken but referenced by formulas; **NEEDS_REVIEW** |
| `ink` | `#REF!` | Broken but referenced by formulas; **NEEDS_REVIEW** |
| `stretch` | `#REF!` | Broken but referenced by `BP`; **NEEDS_REVIEW** |
| `varnish` | `#REF!` | Broken; **NEEDS_REVIEW** |

## warehouse_production_tags_2026-07-01.xlsx

Workbook role: generated production-tag output with embedded frame/base measurement and box lookup sheets.

| Worksheet | Visibility | Apparent purpose | Formulas | Named ranges used | Excel tables | Likely drivers |
|---|---|---|---:|---|---|---|
| `Tags` | Visible | Generates paired production tags and routes each row to paper, canvas, 3D print, stretcher, or 3D base labels. | 1,919 | None | None | Production Tags; Exports; Frame; Base; Stretcher |
| `Measurements` | Visible | Frame-increase and base-decrease lookup used by tag calculations. | 12 | None | None | Lookup; Frame calculations; Base calculations |
| `Box Lookup` | Visible | Box dimensions, paste size, and face-cut lookup used by tag/shipping output. | 6 | None | None | Lookup; Inventory; Production Tags |

## Excel Table Catalog

Only `Contact with Collectors.xlsx` contains structured Excel tables.

| Table | Worksheet | Purpose |
|---|---|---|
| `Originals` | `Original Collectors - 2026` | Active original-collector contact records. |
| `Originals_2` | `Template - Original Collectors` | Original-collector template records. |
| `Recreation` | `ReplicaCanvasPrint Collectors -` | Active replica/canvas-print contact records. |
| `Recreation_2` | `Template - ReplicaCanvasPrint C` | Replica/canvas-print template records. |
