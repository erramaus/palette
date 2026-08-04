# Inventory Workbook Map

Source workbook: `docs/source/Warehouse Inventory 2026-07-08.xlsx`

Extraction artifacts used:

- `docs/knowledge/generated/WarehouseInventoryWorkbook.analysis.json`
- `docs/knowledge/generated/WarehouseInventoryWorkbook.summary.json`
- `docs/knowledge/generated/WarehouseInventoryWorkbook.items.json`
- `docs/knowledge/generated/training_guide_extract/document_text.txt`

## Scope and Method

- Parsed with Node `xlsx` package (`scripts/analyzeWarehouseInventory.mjs`).
- Parsed DOCX guidance from OOXML (`word/document.xml`) using PowerShell ZIP/XML extraction.
- Preserved worksheet names, row numbers, formulas, style refs, and worksheet/cell trace refs.
- Flagged missing/ambiguous rows as `NEEDS_REVIEW`.
- Did not infer reorder or purchase policy beyond explicit columns/formulas and training-guide statements.

## Workbook and Worksheets

Workbook contains 7 worksheets:

1. `Unit A` (visible)
2. `Unit B` (visible)
3. `Unit C` (visible)
4. `Erins Studio` (visible)
5. `Total PO Values` (hidden)
6. `2021-10-21 POs` (hidden)
7. `2021-10-14 POs` (hidden)

## Worksheet Purposes and Source Structures

### 1) Unit A

- Header row: 2
- Main range columns: `A:P`
- Merged category bands: `A3:A26`, `A27:A31`, `A32:A44`, `A45:A59`, `A60:A78`, `A79:A85`, `A86:A90`
- Primary source columns:
  - `A` = category/group label (`COLUMN_A [A]`)
  - `B` = sort/order index (`ORDER [B]`)
  - `C` = target stock basis (`12-WEEKS [C]`)
  - `D` = reorder threshold (`RE-ORDER QTY [D]`)
  - `E` = weeks on hand (`WEEKS ON HAND [E]`) formula
  - `F` = order quantity (`ORDER QTY. [F]`) formula
  - `G` = stock count (`STOCK [G]`)
  - `H` = item text (`Item [H]`)
  - `I` = package/unit size (`Size [I]`)
  - `J` = item/SKU/value id (`Item#2 [J]`)
  - `K` = description (`Description [K]`)
  - `L` = supplier (`Purchase from [L]`)
  - `M` = account/category (`Account [M]`)
  - `N` = cost (`Price Ea. [N]`)
  - `O` = subtotal (`Subtotal [O]`) formula
  - `P` = notes / computed value in some rows (`Notes [P]`)

### 2) Unit B

- Header row: 3
- Main range columns: `A:P`
- Merged category bands: `A4:A11`, `A12:A42`, `A43:A86`, `A87:A103`, `A104:A107`, `A108:A116`
- Primary columns are same structure as Unit A except `C` is `MAX QTY [C]`.

### 3) Unit C

- Header row: 2
- Main range columns: `A:P`
- Merged category bands: `A3:A9`, `A10:A24`, `A25:A31`, `A32:A34`
- Primary columns are same structure as Unit B (`MAX QTY [C]` basis).

### 4) Erins Studio

- Header row: 2
- Main range columns: `A:AA`
- Merged category bands: `A3:A8`, `A9:A18`, `A19:A41`, `A42:A62`, `A63:A85`
- Operational inventory columns are `A:P`; trailing columns `Q:AA` exist but were not reliably populated with standard item rows.
- Category explicitly represents Erin's Studio supplies.

### 5) Total PO Values (hidden)

- Header row: 1
- Formula summary sheet with account totals split by unit columns.
- Treated as reporting/aggregate sheet, not line-item inventory import source.

### 6) 2021-10-21 POs (hidden)

- Historical PO line sheet.
- Columns include order qty, item, size, description, supplier, account, unit cost, subtotal.
- Not used as active stock sheet source for current warehouse counts.

### 7) 2021-10-14 POs (hidden)

- Historical PO line sheet with same shape as above.
- Not used as active stock sheet source for current warehouse counts.

## Item Categories Found (from column A grouped sections)

- `3D Printer Supplies`
- `Brushes`
- `Canvas Cutting Table`
- `Canvas Printer`
- `Canvases`
- `Computer`
- `Crate`
- `Engraver`
- `Framing Cart`
- `Framing Table`
- `Material Bays`
- `Misc`
- `Office`
- `OIl Paints`
- `Originals/Print Tables`
- `Pallets/Racks`
- `Paper Prints`
- `Powder Coater`
- `Prints`
- `Racks`
- `Shipping Table`
- `Varnish Room`

## Locations Found

- `Unit A`
- `Unit B`
- `Unit C`
- `Erins Studio`

## Units of Measure (source forms)

Extracted from `Size [I]` as literal source values, including examples like:

- `1 box`
- `1 pack`
- `1 bag`
- `1 bottle`
- `1 bundle`
- `1 roll`
- `1 case`
- `1 pair`
- `1 sheet`
- `1 pallet`

Normalization policy:

- Keep literal source text in preserved fields.
- Derive normalized UOM only as deterministic parse from size string; if not parseable, mark `NEEDS_REVIEW`.

## Suppliers Found

- `Amazon`
- `AMS (Email)`
- `B & H`
- `Berkshire`
- `Blick`
- `BreathingColor`
- `ClearBags`
- `Colex`
- `DickBlick`
- `Eastwood`
- `FedEx`
- `Frame Destination`
- `Framer's Inventory (Email)`
- `Harbor Freight`
- `Jackson's`
- `LexJet`
- `Lowe's`
- `Lowes`
- `Monroe Speciality`
- `N/A`
- `swissQprints`
- `Tools Today`
- `Uline`
- `Walmart`
- `Warehouse`

## Costs and Quantity Fields

Confirmed source fields:

- Unit cost: `Price Ea. [N]`
- Extended/subtotal: `Subtotal [O]`
- Quantity on hand/count: `STOCK [G]`
- Reorder threshold: `RE-ORDER QTY [D]`
- Desired/target stock basis:
  - `12-WEEKS [C]` on Unit A
  - `MAX QTY [C]` on Unit B/Unit C/Erins Studio
- Suggested/ordered quantity: `ORDER QTY. [F]` formula-derived field

## Formula Rules Confirmed

Observed formula templates (row-relative forms):

1. Weeks on hand:
   - `12/Cn*Gn`
   - Example: `Erins Studio!E3`

2. Suggested order quantity:
   - `IF(Gn="","",IF(Gn>Dn,"",Cn-Gn))`
   - Example: `Erins Studio!F3`

3. Subtotal:
   - `IF(Fn="","",Nn*Fn)`
   - Example: `Erins Studio!O3`

4. Sequential order index:
   - `SUM(B(n-1)+1)` or `B(n-1)+1`

5. Explicit arithmetic in cost cells (`Price Ea. [N]`), examples:
   - `51.2+34.8`
   - `77.5+(45/4)+0.25`
   - `0.91*200`

6. Notes formula pattern in some rows:
   - `IF(Gn="","",On*Gn)`

Important implementation constraint:

- Formula meaning is preserved as source trace; inventory policy logic should rely only on confirmed reorder/stock fields and explicit formulas, not visual assumptions.

## Style-Based Groupings (Confirmed, Not Policy)

Style metadata was preserved per cell (`styleObject`, number format, source cell).

Confirmed style signals:

- Column headers are in distinct header rows (2 or 3 depending on sheet).
- `ORDER [B]`, `12-WEEKS/MAX QTY [C]`, and `RE-ORDER QTY [D]` commonly use a solid fill (example RGB `DEEAF6`) in item rows.
- Currency fields use explicit number format (`"$"#,##0.00`).
- Category groupings are represented structurally by merged ranges in column A and row adjacency.

Constraint:

- Formatting is not treated as an inventory rule unless supported by explicit column semantics or training text.

## Ambiguous Merged/Category Rows and NEEDS_REVIEW Items

Ambiguous rows (`NEEDS_REVIEW`) found during extraction:

1. `Unit A!72` missing supplier
2. `Unit A!75` missing description and supplier
3. `Unit B!9` missing description
4. `Unit B!10` missing description
5. `Unit B!107` missing description and supplier
6. `Unit C!32` missing description and supplier
7. `Unit C!34` missing description and supplier

Merged category behavior:

- Category labels are often stored once at the top of a merged `A` range and implied for subsequent item rows.
- This carry-forward behavior is preserved but marked as potential manual-review dependency where merged structure is irregular.

## Training Guide Workflow Rules (Confirmed)

From `Production Director Training Guide` extracted text:

- Warehouse inventory is taken on Thursdays.
- Paperwork is prepared for Production Manager review Friday morning.
- Most recent inventory sheet is copied and date updated.
- Count values in column G are cleared in the new copy before counting.
- Counts are captured by unit tabs.
- General counting rule: open items are not counted as in stock.
- Erin's Studio tab is part of inventory workflow and supports RPO/CSW process.
- Frame moulding inventory is monthly.

These are procedural rules; purchase creation remains manual review/approval and is not auto-issued by system logic.

## Source Traceability Requirements for Palette

Each imported item must preserve:

- workbook file name
- worksheet name
- row number
- source cell references for mapped fields
- source raw values
- source formulas (where present)
- source style references (where present)
- extraction timestamp/parser version

## Parser Limitations

1. `xlsx` returns formula expressions but not Excel calc-chain/external-link semantics.
2. Conditional formatting rules are not fully expanded as deterministic business rules.
3. Merged-cell category carry-forward can require manual confirmation in edge rows.
4. VBA/macros/print directives are not executed.
5. DOCX extraction captures text paragraphs, not full visual training layout.

## Extraction Totals

- Worksheets analyzed: 7
- Inventory item rows extracted from active inventory tabs: 316
- Distinct categories: 22
- Distinct locations: 4
- Ambiguous rows: 7 (`NEEDS_REVIEW`)
