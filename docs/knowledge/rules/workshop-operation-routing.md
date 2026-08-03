# Workshop Operation Routing

- **Rule Name:** Workshop Operation Routing
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Workshop List`; `Actual Times`
- **Cell(s) or table used:** `Workshop List!AG7:BH107`; `Actual Times!AG4:BH6089`
- **Inputs:** Product type, frame, packaging method, and named standard-time values.
- **Outputs:** Required or excluded operation columns from `CUT STR.` through `SHIP`; excluded steps are marked `X`.
- **Dependencies:** Product types (`0 Cnvs`, `1 Orig`, `2 3D`, `2 3D Lim`, `3 Canv`, `4 Free`); frame exceptions (`None`, `Stretched`, `Rolled`, `KoF`, `N/A`); packaging method.
- **Exceptions:** The formulas contain duplicate `1 Orig` branches and a likely typo `Q="3 Canv"` in one step. `X` mixes “not required” with nonnumeric output.
- **Related lookup tables:** `Actual Times` historical operation durations.
- **Related named ranges:** `CS`, `JS`, `SC`, `PT`, `TDF`, `S3DP`, `CB`, `JB`, `PB`, `M3D`, `DF`, `PCP`, `CCP`, `CCS`, `JCS`, `SCP`, `PBC`, `CF`, `DFC`, `JF`, `SIF`, `WP`, `CFC`, `COA`, `S3D`, `PP`, `SP`.
- **Business purpose:** Builds the product-specific production route and supplies expected minutes for each required operation.
- **Suggested TypeScript service:** `WorkflowRules`
- **Confidence:** High that this is the routing matrix; Medium on several individual branches.
- **NEEDS_REVIEW:** Audit the duplicate branches, `Q="3 Canv"`, `0 Cnvs` spelling, and whether `X` means skipped, completed, or unavailable.

## Formula

Pseudocode: for each operation column, inspect product type/frame/packaging; emit `X` when excluded, otherwise emit the operation's named standard time or historical average.
