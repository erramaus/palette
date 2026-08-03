# 3D Production Tag Checklist

- **Rule Name:** 3D Production Tag Checklist
- **Source Workbook:** `warehouse_production_tags_2026-07-01.xlsx`
- **Source Worksheet:** `Tags`
- **Cell(s) or table used:** Repeated blocks `A3:E4`, `H3:L4`, and corresponding blocks through row 324
- **Inputs:** Calculated tag category.
- **Outputs:** 3D-only prompts: `Scan`, `New / Old`, `Printed`, `IA`, `Resliced`, and `Yes / No` choices.
- **Dependencies:** Production Tag Product Category.
- **Exceptions:** Non-3D tags emit blank strings rather than checklist fields.
- **Related lookup tables:** None.
- **Related named ranges:** None.
- **Business purpose:** Adds required manual quality/process checkpoints to each 3D production tag.
- **Suggested TypeScript service:** `ProductionTagRules`
- **Confidence:** High.
- **NEEDS_REVIEW:** Define `IA` and whether each prompt is required, optional, or informational.

## Formula

Pseudocode: `if tagCategory == "3D PRINT", render the six checklist labels and Yes/No choices; otherwise render blanks`.
