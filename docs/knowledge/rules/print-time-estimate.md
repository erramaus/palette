# 3D Print Time Estimate

- **Rule Name:** 3D Print Time Estimate
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `3D Print Times`
- **Cell(s) or table used:** `U2:W58`; totals `W9:W59`, `Y2:Y8`, `AD4:AD6`
- **Inputs:** Print length, pass count, layer count, average pass time, and fitted constants.
- **Outputs:** Estimated time per layer/pass and total estimated print time.
- **Dependencies:** 3D Print Pass Time Normalization.
- **Exceptions:** Formula uses unexplained constants `0.0005024083469` and `0.000005260641303`; units are not labeled.
- **Related lookup tables:** Pass averages `L2:M8` and historical observations.
- **Related named ranges:** None.
- **Business purpose:** Forecasts 3D printer occupancy for production scheduling and Battle Plans.
- **Suggested TypeScript service:** `PrintingRules`
- **Confidence:** Medium for formula extraction; Low for model interpretation.
- **NEEDS_REVIEW:** Identify the regression/source of both constants, validate units, and compare estimates with current equipment.

## Formula

```text
baseLayerTime = ((0.0005024083469 + length * 0.000005260641303) / 6)
              * passes * width
averageBasedTime = width * averagePassTime
layerTotal = baseLayerTime * layerCount
printTotal = SUM(layerTotals)
```
