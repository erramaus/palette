# Stretcher Support Thresholds

- **Rule Name:** Stretcher Support Thresholds
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Helper BPs`
- **Cell(s) or table used:** `F6:G32`
- **Inputs:** Maximum of canvas width and length.
- **Outputs:** `STRAINER? = YES` and/or `CORNERS? = YES`.
- **Dependencies:** Numeric canvas dimensions.
- **Exceptions:** Exactly 30 does not require a strainer; exactly 45 does not require corners because both comparisons are strict greater-than.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Adds structural reinforcement requirements to canvas Battle Plans.
- **Suggested TypeScript service:** `StretcherRules`
- **Confidence:** High.
- **NEEDS_REVIEW:** Confirm whether threshold equality should remain excluded and what “corners” specifically requires.

## Formula

```text
strainerRequired = max(width, length) > 30
cornersRequired = max(width, length) > 45
```
