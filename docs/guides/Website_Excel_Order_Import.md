# Website Excel Order Import

This guide describes the supported interim workflow for bringing warehouse new orders from the Erin Hanson admin site into Palette.

## Workflow

1. Sign into the Erin Hanson admin site manually.
2. Open the warehouse/new-orders area.
3. Click `Print Warehouse Reps`.
4. Download the Excel workbook that the website generates.
5. Open Palette Import Center.
6. Upload the workbook for preview.
7. Review the normalized rows and field diffs.
8. Approve the import as Production Director.

## Accepted Formats

- `.xlsx`
- `.xls` when the workbook parser can read it safely

## Workbook Mapping

The import parser reads the dated order list export by header, not by fixed column index.

Expected columns from the confirmed workbook:

- `DUE BY`
- `DAYS`
- `SIZE`
- `ITEM`
- `3D#`
- `CUSTOMER`
- `TYPE`
- `FRAME`
- `VALUE`
- `SHIP`
- `BATCH`
- `BOX`
- `TM`
- `CUMUL.`

Optional note fields are preserved when present, including explicit red-note columns.

## Normalization Rules

Palette normalizes each row through the existing canonical order-import schema.

Applied rules:

- product type uses the confirmed vocabulary from the legacy order-import schema
- size is parsed as width and height from the workbook `SIZE` column
- orientation is inferred from dimensions when not explicitly present
- frame text is normalized through the existing order-import rules
- due date is validated as a real calendar date
- fulfillment method is inferred only from the shipped amount when the workbook supplies one
- red notes are preserved when an explicit note column exists
- source order identifiers are preserved from the workbook reference column when present

Unknown or malformed values are marked `NEEDS_REVIEW`.

## Preview Buckets

Palette separates imported rows into:

- New Orders
- Changed Orders
- Existing Orders
- Skipped Rows
- Needs Review
- Errors

Changed Orders show field-level diffs against the last approved import.

## Approval

Nothing is created until the Production Director approves the selected rows.

- `Import Selected` imports the checked rows.
- `Import All Valid` imports only rows that are already valid and normalized.
- `Cancel` clears the staged preview.

Rows with blocking errors are skipped.

## Audit Data

Palette preserves these safe fields with each approved import:

- source file name
- worksheet name
- row number
- uploadedAt
- importedAt
- importedBy
- source record ID
- validation trace
- safe original source fields

No cookies, tokens, credentials, or auth headers are stored.
