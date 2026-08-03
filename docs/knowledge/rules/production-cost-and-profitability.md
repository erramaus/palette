# Production Cost And Profitability

- **Rule Name:** Production Cost And Profitability
- **Source Workbook:** `Warehouse Production Sheets.xlsx`
- **Source Worksheet:** `Cost Calculator`; `Simple Cost Calculator`
- **Cell(s) or table used:** `Cost Calculator!K6:T45,AX6:AZ45`; `Simple Cost Calculator!F2:N2,AR2:AT2`
- **Inputs:** Selling price, material costs, shipping cost, and original/print classification.
- **Outputs:** Print cost of goods, total cost, profit, cost-of-goods percentage, and ROI.
- **Dependencies:** Material Unit Cost Valuation; shipping cost; product type classification.
- **Exceptions:** Original work suppresses print COG; zero selling price suppresses ratios. The sheets contain both direct display totals and auxiliary totals, and sale-price columns are present only in the full calculator.
- **Related lookup tables:** `Costs!A:B`; box/shipping cost lookups.
- **Related named ranges:** None.
- **Business purpose:** Evaluates whether a production item meets cost and profitability targets.
- **Suggested TypeScript service:** `MaterialRules`
- **Confidence:** High for arithmetic; Medium on which total is the reporting authority.
- **NEEDS_REVIEW:** Reconcile duplicate total/ratio columns and confirm whether ROI means `price/cost - 1` or another accounting definition.

## Formula

```text
printCOG = SUM(materialCosts) unless product is Original
totalCost = printCOG + shippingCost
profit = sellingPrice - totalCost
cogPercent = totalCost / sellingPrice
roi = sellingPrice / totalCost - 1
```
