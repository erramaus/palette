# Material Demand Overage

- **Rule Name:** Material Demand Overage
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Materials`
- **Cell(s) or table used:** `B2:D56`
- **Inputs:** Historical material consumption from corresponding `Black Friday Calc` columns.
- **Outputs:** Doubled demand and demand with 25 percent overage.
- **Dependencies:** Material-specific source columns in `Black Friday Calc`.
- **Exceptions:** Some liquids convert source totals by `0.033814` before scaling. The labels say `LAST YEAR`, but the source period is not encoded in formulas.
- **Related lookup tables:** Material rows `A2:A56`; source usage columns in `Black Friday Calc`.
- **Related named ranges:** `CF`, `DF`, `CS`, `CB` are referenced by other formulas on the sheet.
- **Business purpose:** Forecasts material purchasing quantities for a doubled production scenario with safety stock.
- **Suggested TypeScript service:** `MaterialRules`
- **Confidence:** High for scaling; Medium for source-period semantics.
- **NEEDS_REVIEW:** Confirm why demand is doubled, whether 25 percent applies to every material, and which source columns remain authoritative.

## Formula

```text
baseline = SUM(materialUsageSource)
doubled = baseline * 2
withOverage = doubled * 1.25
```
