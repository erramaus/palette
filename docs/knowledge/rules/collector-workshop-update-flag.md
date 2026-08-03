# Collector Contact Workshop Update Flag

- **Rule Name:** Collector Contact Workshop Update Flag
- **Source Workbook:** `Contact with Collectors.xlsx`
- **Source Worksheet:** `Original Collectors - 2026`; `ReplicaCanvasPrint Collectors -`
- **Cell(s) or table used:** `Originals[Add to Workshop List]`; `Recreation[Workshop List Update]`
- **Inputs:** Collector contact record, order number, contact reason, interaction summary, Boolean update flag.
- **Outputs:** Manual indication that an order should be added to or updated on the Workshop List.
- **Dependencies:** Structured tables `Originals` and `Recreation`; a matching order number.
- **Exceptions:** Original and replica sheets use different flag labels. Blank template rows default to false.
- **Related lookup tables:** `Originals`; `Recreation`.
- **Related named ranges:** None.
- **Business purpose:** Transfers delivery, address, and collector-contact changes into production operations.
- **Suggested TypeScript service:** `OrderImportRules`
- **Confidence:** High that the flags trigger Workshop List attention; Medium on the exact manual action.
- **NEEDS_REVIEW:** Confirm whether true means “pending update” or “update completed,” because the workbook contains no automation or status timestamp.

## Formula

No formula. Pseudocode: `if contact.workshopFlag is true, require a manual Workshop List add/update for contact.orderNumber`.
