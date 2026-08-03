# Workshop Workload Summary

- **Rule Name:** Workshop Workload Summary
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Workshop List`; `Workshop Tags Paste`
- **Cell(s) or table used:** `Workshop List!A1:I4`; `Workshop Tags Paste!A1:O4`
- **Inputs:** Product type and cumulative time for all active rows.
- **Outputs:** Time and piece totals for originals, 3D, canvas; total time; weeks in shop; pieces in shop.
- **Dependencies:** Product-type vocabulary and Workshop Cumulative Time.
- **Exceptions:** Workshop List includes `2 3D`, `2 3D Lim`, and `2 3D Open` in the 3D total; Workshop Tags Paste counts only `2 3D`. Weeks use a fixed `24/40` conversion.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Gives the production director a top-level active workload and backlog view.
- **Suggested TypeScript service:** `WorkshopListRules`
- **Confidence:** High for formulas; Medium for the weeks conversion.
- **NEEDS_REVIEW:** Reconcile the differing 3D type coverage and explain the fixed factor `24/40`.

## Formula

```text
typeTime = SUMIF(typeColumn, type, cumulativeTimeColumn)
typeCount = COUNTIF(typeColumn, type)
totalTime = SUM(cumulativeTimeColumn)
weeksInShop = totalTime * 24 / 40
piecesInShop = COUNTA(itemColumn) - headerRows
```
