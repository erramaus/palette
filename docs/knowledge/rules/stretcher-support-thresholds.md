# Stretcher Support Thresholds

- **Rule Name:** Stretcher Support Thresholds
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Helper BPs`
- **Cell(s) or table used:** `F6:G32`
- **Inputs:** Maximum of canvas width and length.
- **Outputs:** Center strainer and four-corner reinforcement requirements, exact center/additional lengths, and added standard minutes.
- **Dependencies:** Numeric canvas dimensions.
- **Exceptions:** Exactly 30 does not require a center strainer; exactly 45 does not require corners; exactly 60 does not require additional lengthwise strainers.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Adds structural reinforcement requirements to canvas Battle Plans.
- **Suggested TypeScript service:** `StretcherRules`
- **Confidence:** High.
- **Production Director clarification:** Confirmed 2026-08-03. Corner quantity is four. Square canvases use the horizontal center span.

## Formula

```text
strainerRequired = max(width, length) > 30
cornersRequired = max(width, length) > 45
outerWidth = width - 1/16
outerHeight = height - 1/16
centerLength = perpendicularOuterDimension - (2 * 1 1/16)
if max(width, length) > 60:
	longInteriorSpan = max(outerWidth, outerHeight) - (2 * 1 1/16)
	eachAdditionalLength = (longInteriorSpan - 1 7/16) / 2
	additionalQuantity = 2
addedStandardMinutes = (centerQuantity + additionalQuantity + cornerQuantity) * 4
```

Material constants: stretcher face `1 15/16 in`, specified stretcher thickness `1 2/32 in`, normalized opening thickness `1 1/16 in`, strainer width `1 7/16 in`, and strainer thickness `3/4 in`.
