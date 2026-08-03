# Production Tag Multiple Customer Marker

- **Rule Name:** Production Tag Multiple Customer Marker
- **Source Workbook:** `warehouse_production_tags_2026-07-01.xlsx`
- **Source Worksheet:** `Tags`
- **Cell(s) or table used:** Repeated customer fields `B5`, `I5`, and equivalent blocks through row 325; source customer column `Q`
- **Inputs:** Customer name and all customer names in the tag source list.
- **Outputs:** Customer name, optionally suffixed with a space and `(MULTI)`.
- **Dependencies:** Count of identical customer names in column Q.
- **Exceptions:** Every repeated customer receives the suffix; the formula does not distinguish multiple pieces in one order from separate orders.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Warns production and packing staff that multiple pieces belong to the same customer.
- **Suggested TypeScript service:** `ProductionTagRules`
- **Confidence:** High.
- **NEEDS_REVIEW:** Confirm whether grouping should use customer, order number, shipment, or destination.

## Formula

`displayCustomer = customer + (COUNTIF(allCustomers, customer) == 1 ? "" : " (MULTI)")`
