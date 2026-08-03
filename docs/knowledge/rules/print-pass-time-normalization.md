# 3D Print Pass Time Normalization

- **Rule Name:** 3D Print Pass Time Normalization
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `3D Print Times`
- **Cell(s) or table used:** `H2:J36`; `L2:M8`
- **Inputs:** Observed print duration, print width, print length, pass count, pass type.
- **Outputs:** Time per width, time per area axis, time per pass, and average time-per-width by pass type.
- **Dependencies:** Historical print observations and pass categories such as Bottom 5, Middle, White, Color, and Varnish 1-3.
- **Exceptions:** Division-by-zero behavior is not guarded. `AVERAGEIF(E:H,...)` uses an unusual multi-column criteria range.
- **Related lookup tables:** Historical observations in `A2:J36`.
- **Related named ranges:** None.
- **Business purpose:** Derives reusable speed factors from actual 3D printing history.
- **Suggested TypeScript service:** `PrintingRules`
- **Confidence:** Medium.
- **NEEDS_REVIEW:** Validate the intended units and the multi-column `AVERAGEIF` range before implementation.

## Formula

```text
timePerWidth = duration / width
widthTimePerLength = timePerWidth / length
lengthTimePerPass = widthTimePerLength / passes
passAverage = AVERAGEIF(history.passType, passType, history.timePerWidth)
```
