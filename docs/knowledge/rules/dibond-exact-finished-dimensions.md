# Dibond Exact Finished Dimensions

- **Rule Name:** Dibond Exact Finished Dimensions
- **Source:** Production Director clarification
- **Confirmation date:** 2026-08-03
- **Inputs:** Finished 3D painting width and height.
- **Outputs:** Dibond cut width and height.
- **Workstation:** CNC.
- **Confidence:** High.
- **Status:** CONFIRMED.

## Formula

```text
dibondWidth = finishedPaintingWidth
dibondHeight = finishedPaintingHeight
```

No allowance, deduction, or rounding is applied. CNC nesting, sheet layout, coordinates, kerf optimization, multi-piece placement, and sheet optimization are future CNC Layout Tool work and are not part of this rule.