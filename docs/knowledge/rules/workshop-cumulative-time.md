# Workshop Cumulative Time

- **Rule Name:** Workshop Cumulative Time
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Workshop List`; `Workshop Tags Paste`; `Actual Times`
- **Cell(s) or table used:** `Workshop List!X7:X107`; `Workshop Tags Paste!X6:X57`; `Actual Times!X4093:X6089`
- **Inputs:** All numeric operation-minute columns for a work item.
- **Outputs:** Total work-item time in days.
- **Dependencies:** Workshop Operation Routing and step-duration values.
- **Exceptions:** Text `X` values are ignored by Excel `SUM`. Historical rows shift the operation range by one column (`AF:BG` versus `AG:BH`).
- **Related lookup tables:** Historical operation durations in `Actual Times`.
- **Related named ranges:** The operation standard-time ranges used upstream.
- **Business purpose:** Converts total expected or actual operation minutes into a duration used for workload reporting.
- **Suggested TypeScript service:** `TimelineRules`
- **Confidence:** High for current rows; Medium for the unit interpretation.
- **NEEDS_REVIEW:** The division by 1,440 implies days, while labels elsewhere imply hours/time in shop; confirm the intended unit.

## Formula

`cumulativeDays = SUM(operationMinutes) / 1440`
