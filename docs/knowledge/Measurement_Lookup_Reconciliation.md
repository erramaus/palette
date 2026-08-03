<!-- markdownlint-disable MD060 -->

# Measurement Lookup Reconciliation

This document reconciles measurement and adjustment sources without selecting a winner where the workbooks disagree. Numeric formulas were evaluated for comparison, but original formulas and source cells remain recorded. `CONFIRMED` requires matching operational results across all applicable sources or an independently repeated formula. No entry is classified `OBSOLETE`: the source material does not establish retirement authority.

## Source Set

| Source | Worksheet and cells | Role |
|---|---|---|
| `Warehouse Production Sheets.xlsx` | `Measurements!D2:E31` | Workshop frame increases |
| `warehouse_production_tags_2026-07-01.xlsx` | `Measurements!A2:B33` | Production-tag frame increases |
| `Warehouse Production Sheets.xlsx` | `BP!AP4:AR22` | Battle Plan base and frame-cut adjustments |
| `warehouse_production_tags_2026-07-01.xlsx` | `Measurements!D2:E16` | Production-tag base adjustments |
| `Warehouse Production Sheets.xlsx` | `Petites List!N2:O4` | Petite frame additions |
| `Warehouse Production Sheets.xlsx` | `Helper BPs!F6:G32`; `BP!AL4,AN4` | Stretcher and reinforcement rules |
| `Warehouse Production Sheets.xlsx` | `Dibond Cutting`; `Dibond Pieces Cutting` documented ranges | Dibond conversion, spacing, and display formulas |
| `Warehouse Production Sheets.xlsx` | Workshop frame formulas and both cost calculators | Product-specific mapping and coarse fallback behavior |

## Confirmed Frame Allowances

Recommended authority for these entries is the numeric consensus across production `Measurements`, tag `Measurements`, and the BP frame-cut table.

| Canonical rule ID | Source cells (production; tags; BP) | Product type | Frame family | Imported frame name | Normalized production frame name | Adjustment/formula | Competing sources | Recommended authoritative source | Confidence | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `frame.silver-eh.increase.v1` | `D10:E10`; `A10:B10`; `AP10:AR10` | All | Silver EH | Silver EH | Silver EH | `+1.5625 in` | None numerically | Three-source consensus | High | CONFIRMED |
| `frame.b-and-g-plein.increase.v1` | `D19:E19`; `A19:B19`; `AP16:AR16` | All | B&G Plein | B&G Plein | B&G Plein | `+5.875 in` | None numerically | Three-source consensus | High | CONFIRMED |
| `frame.b-and-g-plein-faux.increase.v1` | `D21:E21`; `A21:B21`; `AP15:AR15` | All | B&G Plein Faux | B&G Plein Faux | B&G Plein Faux | `+6.9375 in` | None numerically | Three-source consensus | High | CONFIRMED |
| `frame.gold-eh-a.increase.v1` | `D28:E28`; `A14:B14`; `AP20:AR20` | All | Gold EH A | Gold EH A | Gold EH A | `+1.6875 in` | Formula literals differ only | Three-source consensus | High | CONFIRMED |
| `frame.gold-reh-new.increase.v1` | `D29:E29`; `A29:B29`; `AP19:AR19` | All | Gold REH NEW | Gold REH NEW | Gold REH NEW | `+1.5625 in` | Formula literals differ only | Three-source consensus | High | CONFIRMED |
| `frame.picture-white.increase.v1` | `D30:E30`; `A30:B30`; `AP21:AR21` | Paper | Picture White | Picture White | Picture White | `+2.6875 in` | Formula literals differ only | Three-source consensus | High | CONFIRMED |
| `frame.picture-black.increase.v1` | `D31:E31`; `A31:B31`; `AP22:AR22` | Paper | Picture Black | Picture Black | Picture Black | `+2.6875 in` | Formula literals differ only | Three-source consensus | High | CONFIRMED |

## Conflicting Frame Allowances

No source is recommended as authoritative until operations resolves each row.

| Canonical rule ID | Source cells | Product type | Frame family | Imported frame name | Normalized production frame name | Production / tag / BP values (inches) | Competing/conflicting sources | Recommended authoritative source | Confidence | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `frame.black.increase.v1` | `D3:E3`; `A3:B3`; `AP7:AR7` | All | Black | Black | Black | `1.375 / 1.4375 / 1.3125` | All three differ | None pending decision | Low | CONFLICT |
| `frame.gold.increase.v1` | `D7:E7`; `A7:B7`; `AP5:AR5` | All | Gold | Gold | Gold | `1.375 / 1.3125 / 1.3125` | Production differs | None pending decision | Low | CONFLICT |
| `frame.white.increase.v1` | `D6:E6`; `A6:B6`; `AP8:AR8` | All | White | White | White | `1.375 / 1.3125 / 1.3125` | Production differs | None pending decision | Low | CONFLICT |
| `frame.silver.increase.v1` | `D4:E4`; `A4:B4`; `AP6:AR6` | All | Silver | Silver | Silver | `1.625 / 1.3125 / 1.3125` | Production differs | None pending decision | Low | CONFLICT |
| `frame.gold-plein.increase.v1` | `D16:E16`; `A16:B16`; `AP11:AR11` | All | Gold Plein | Gold Plein | Gold Plein | `7.625 / 7.625 / 7.5625` | BP differs | None pending decision | Low | CONFLICT |
| `frame.silver-plein.increase.v1` | `D18:E18`; `A18:B18`; `AP13:AR13` | All | Silver Plein | Silver Plein | Silver Plein | `7.625 / 7.625 / 7.5625` | BP differs | None pending decision | Low | CONFLICT |
| `frame.silver-plein-faux.increase.v1` | `D22:E22`; `A22:B22`; `AP14:AR14` | All | Silver Plein Faux | Silver Plein Faux | Silver Plein Faux | `9 / 8.5 / 8.5` | Production differs | None pending decision | Low | CONFLICT |
| `frame.gold-plein-faux.increase.v1` | `D23:E23`; `A23:B23`; `AP12:AR12` | All | Gold Plein Faux | Gold Plein Faux | Gold Plein Faux | `9 / 9 / 8.5` | BP differs | None pending decision | Low | CONFLICT |
| `frame.gold-reh.increase.v1` | `D24:E24`; `A24:B24`; `AP17:AR17` | All | Gold REH | Gold REH | Gold REH | `1.625 / 1.3125 / 1.3125` | Production differs | None pending decision | Low | CONFLICT |
| `frame.silver-reh.increase.v1` | `D25:E25`; `A25:B25`; `AP18:AR18` | All | Silver REH | Silver REH | Silver REH | `1.625 / 1.3125 / 1.3125` | Production differs | None pending decision | Low | CONFLICT |

## Unreconciled Frame Entries

| Canonical rule ID | Source workbook / worksheet / cells | Product type | Frame family | Imported frame name | Normalized production frame name | Adjustment/formula | Competing/conflicting sources | Recommended authoritative source | Confidence | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `frame.eh.increase.v1` | Production `Measurements!D2:E2`; tags `Measurements!A2:B2` | All | EH | EH | EH | `+1.5625` | No BP row | None pending corroboration | Medium | NEEDS_REVIEW |
| `frame.none.increase.v1` | Production `D9:E9`; tags `A9:B9` | All | None | None | None | `0` | No BP frame-cut value | None pending semantics | Medium | NEEDS_REVIEW |
| `frame.kof.increase.v1` | Production `D5:E5`; tags `A5:B5` | All | KoF | KoF | KoF | `+6` | Cost calculator also uses `+6`; no BP row | None pending source policy | Medium | NEEDS_REVIEW |
| `frame.gold-plein-air.increase.v1` | Production `D11:E11`; tags `A11:B11` | All | Gold Plein Air | Gold Plein Air | Gold Plein Air | `+7.625` | BP uses `Gold Plein`, not proven alias | None pending normalization | Medium | NEEDS_REVIEW |
| `frame.black-gold-plein-air.increase.v1` | Production `D12:E12`; tags `A12:B12` | All | Black & Gold Plein Air | Black & Gold Plein Air | Unresolved | `+5.875` | B&G aliases not formally mapped | None pending normalization | Low | NEEDS_REVIEW |
| `frame.silver-plein-air.increase.v1` | Production `D13:E13`; tags `A13:B13` | All | Silver Plein Air | Silver Plein Air | Silver Plein Air | `+7.625` | BP uses `Silver Plein`, not proven alias | None pending normalization | Medium | NEEDS_REVIEW |
| `frame.metro.increase.v1` | Production `D20:E20`; tags `A20:B20` | All | Metro | Metro | Metro | `+1.5625` | No BP row | None pending corroboration | Medium | NEEDS_REVIEW |
| `frame.light-gold.increase.v1` | Production `D27:E27`; tags `A27:B27` | All | Light Gold | Light Gold | Light Gold | `+1.4375` | No BP row | None pending corroboration | Medium | NEEDS_REVIEW |
| `frame.red-gold.increase.v1` | Production `D26:E26`; tags `A28:B28` | All | Red Gold | Red Gold | Red Gold | `+1.625 / +1.3125` | Production and tag tables conflict | None pending decision | Low | CONFLICT |
| `frame.rolled.increase.v1` | Tags `A26:B26`; production formulas special-case Roll/Rolled | All | Rolled | Rolled | Rolled | `0` or `N/A` | Measurement versus display semantics | None pending semantics | Low | NEEDS_REVIEW |
| `frame.picture-rolled.increase.v1` | Tags `A32:B32`; Workshop paper-prefix formulas | Paper | Rolled | Rolled | Picture Rolled | `0` | Missing from production Measurements | None pending missing lookup | Low | NEEDS_REVIEW |
| `frame.stretched.increase.v1` | Production `D8:E8`; tags `A8:B8`; BP `AP4` | Canvas | Stretched | Stretched | Stretched | `0`; BP frame cut blank | Blank versus zero semantics | None pending semantics | Medium | NEEDS_REVIEW |
| `frame.30x40.increase.v1` | Production `Measurements!D38` | Unknown | 30x40 | 30x40 | Unresolved | No adjustment present | Stray single-cell frame key | None | Low | NEEDS_REVIEW |
| `frame.cost-envelope.fallback.v1` | Production cost calculators documented cells | All | Fallback | Any other frame | Same input | `+2`; KoF `+6`; Stretched `0`; Roll `N/A` | Conflicts with detailed tables | None pending policy | Low | NEEDS_REVIEW |

## Base Adjustments

Tag values are signed adjustments added to dimensions. BP values are subtracted, so BP signs are inverted before comparison.

| Canonical rule ID | Source cells (tags; BP) | Product type | Frame family | Imported frame name | Normalized production frame name | Canonical adjustment | Competing/conflicting sources | Recommended authoritative source | Confidence | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `base.black.adjustment.v1` | `D7:E7`; `AP7:AQ7` | 3D | Black | Black | Black | `-0.25 in` | None after sign normalization | Two-source consensus | High | CONFIRMED |
| `base.b-and-g-plein-faux.adjustment.v1` | `D8:E8`; `AP15:AQ15` | 3D | B&G Plein Faux | B&G Plein Faux | B&G Plein Faux | `+1.0625 in` | None after sign normalization | Two-source consensus | High | CONFIRMED |
| `base.silver-plein-faux.adjustment.v1` | `D9:E9`; `AP14:AQ14` | 3D | Silver Plein Faux | Silver Plein Faux | Silver Plein Faux | `+1.0625 in` | None after sign normalization | Two-source consensus | High | CONFIRMED |
| `base.gold-plein-faux.adjustment.v1` | `D10:E10`; `AP12:AQ12` | 3D | Gold Plein Faux | Gold Plein Faux | Gold Plein Faux | `+1.0625 in` | None after sign normalization | Two-source consensus | High | CONFIRMED |
| `base.gold-reh.adjustment.v1` | `D12:E12`; `AP17:AQ17` | 3D | Gold REH | Gold REH | Gold REH | `-1.5 in` | None after sign normalization | Two-source consensus | High | CONFIRMED |
| `base.silver-reh.adjustment.v1` | `D13:E13`; `AP18:AQ18` | 3D | Silver REH | Silver REH | Silver REH | `-1.5 in` | None after sign normalization | Two-source consensus | High | CONFIRMED |
| `base.gold.adjustment.v1` | Tags `D4:E4`; BP `AP5:AQ5` | 3D | Gold | Gold | Gold | `-0.5 / -0.25` | Different results | None pending decision | Low | CONFLICT |
| `base.silver.adjustment.v1` | Tags `D5:E5`; BP `AP6:AQ6` | 3D | Silver | Silver | Silver | `-0.5 / -0.25` | Different results | None pending decision | Low | CONFLICT |
| `base.white.adjustment.v1` | Tags `D6:E6`; BP `AP8:AQ8` | 3D | White | White | White | `-0.5 / -0.25` | Different results | None pending decision | Low | CONFLICT |
| `base.silver-eh.adjustment.v1` | Tags `D3:E3`; BP `AP10:AQ10` | 3D | Silver EH | Silver EH | Silver EH | `-0.75 / -0.5` | Different results | None pending decision | Low | CONFLICT |
| `base.gold-eh-a.adjustment.v1` | Tags `D2:E2`; BP `AP20:AQ20` | 3D | Gold EH A | Gold EH A | Gold EH A | `-0.75 / 0` | Different results | None pending decision | Low | CONFLICT |
| `base.gold-reh-new.adjustment.v1` | Tags `D16:E16`; BP `AP19:AQ19` | 3D | Gold REH NEW | Gold REH NEW | Gold REH NEW | `-0.75 / -0.5` | Different results | None pending decision | Low | CONFLICT |
| `base.single-source-adjustments.v1` | Tags `D11:E16`; BP `AP21:AQ22` | 3D | None; Light Gold; Red Gold; Picture White; Picture Black | Same | Same pending validation | Source-specific values | No cross-source counterpart | None pending corroboration | Medium | NEEDS_REVIEW |

## Stretcher And Structural Rules

| Canonical rule ID | Source workbook / worksheet / cells | Product type | Frame family | Imported frame name | Normalized production frame name | Adjustment/formula | Competing/conflicting sources | Recommended authoritative source | Confidence | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `stretcher.canvas.cut-deduction.v1` | Production `BP!AL4,AN4`; `Helper BPs!A3:G32`; tags repeated cut blocks | Canvas | All | N/A | N/A | `dimension - 1/16 in` | Independently repeated | Repeated formula | High | CONFIRMED |
| `stretcher.canvas.strainer-threshold.v1` | Production `Helper BPs!F6:F32` | Canvas | All | N/A | N/A | `max(width,height) > 30` | Equality policy unresolved but formula exact | Helper BPs | High | CONFIRMED |
| `stretcher.canvas.corner-threshold.v1` | Production `Helper BPs!G6:G32` | Canvas | All | N/A | N/A | `max(width,height) > 45` | Equality policy unresolved but formula exact | Helper BPs | High | CONFIRMED |
| `stretcher.canvas.material-dimensions.v1` | Production Director clarification, 2026-08-03 | Canvas | All | N/A | N/A | Stretcher face `1 15/16`; specified thickness `1 2/32`, normalized `1 1/16`; strainer width `1 7/16`; thickness `3/4` | None | Production Director clarification | High | CONFIRMED |
| `stretcher.canvas.center-strainer.v1` | Production Director clarification, 2026-08-03 | Canvas | All | N/A | N/A | `perpendicularOuterDimension - (2 * 1.0625)`; quantity 1; centered | None | Production Director clarification | High | CONFIRMED |
| `stretcher.canvas.over-60-additional-strainers.v1` | Production Director clarification, 2026-08-03 | Canvas | All | N/A | N/A | If longest finished dimension `> 60`: `(longInteriorSpan - 1.4375) / 2`; quantity 2 | None | Production Director clarification | High | CONFIRMED |
| `stretcher.canvas.strainer-labor.v1` | Production Director clarification, 2026-08-03 | Canvas | All | N/A | N/A | `4 standard minutes * individual strainer quantity`; corners quantity 4 when required | None | Production Director clarification | High | CONFIRMED |
| `stretcher.canvas.named-range.v1` | Production `BP` named range `stretch` | Canvas | All | N/A | N/A | `#REF!` | Broken named range | None | Low | NEEDS_REVIEW |

## Petite Frame Lookups

| Canonical rule ID | Source workbook / worksheet / cells | Product type | Frame family | Imported frame name | Normalized production frame name | Adjustment/formula | Competing/conflicting sources | Recommended authoritative source | Confidence | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `petite.blk-gld-pa.length-add.v1` | Production `Petites List!N2:O2` | Petite | Plein Air | Blk/Gld PA | Unresolved | `+6.875 in` | Hidden specialized sheet; alias unresolved | None pending current-use confirmation | Medium | NEEDS_REVIEW |
| `petite.gold-pa.length-add.v1` | Production `Petites List!N3:O3` | Petite | Plein Air | Gold PA | Unresolved | `+8.5625 in` | Does not match general Gold Plein allowances | None pending current-use confirmation | Medium | NEEDS_REVIEW |
| `petite.sliver-pa.length-add.v1` | Production `Petites List!N4:O4` | Petite | Plein Air | Sliver PA | Unresolved | `+8.5625 in` | Apparent spelling error and specialized value | None pending naming confirmation | Low | NEEDS_REVIEW |

## Frame Name Normalization And Product Mapping

| Canonical rule ID | Source workbook / worksheet / cells | Product type | Frame family | Imported frame name | Normalized production frame name | Adjustment/formula | Competing/conflicting sources | Recommended authoritative source | Confidence | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `frame-normalization.paper-white.v1` | Workshop frame formulas; both `Measurements` sheets | Paper | White | White | Picture White | Prefix `Picture` plus a space for paper lookup | Both lookup tables contain target | Workshop product-specific formula | High | CONFIRMED |
| `frame-normalization.paper-black.v1` | Workshop frame formulas; both `Measurements` sheets | Paper | Black | Black | Picture Black | Prefix `Picture` plus a space for paper lookup | Both lookup tables contain target | Workshop product-specific formula | High | CONFIRMED |
| `frame-normalization.paper-rolled.v1` | Workshop frame formulas; tag `Measurements!A32:B32` | Paper | Rolled | Rolled | Picture Rolled | Prefix `Picture` plus a space | Target missing from production Measurements | None pending missing lookup | Medium | NEEDS_REVIEW |
| `frame-normalization.plein-aliases.v1` | Both Measurements sheets; BP; Petites List | All | Plein variants | Black & Gold / B&G / Blk-Gld / Sliver | Unresolved | No explicit normalization formula | Similar names cannot be assumed identical | None pending naming authority | Low | NEEDS_REVIEW |
| `tag-build-part.product-map.v1` | Tag workbook `Tags!AS2,AZ2` repeated | Canvas / other | N/A | N/A | N/A | `3 Canv -> STRETCHER; all else -> 3D BASE` | Paper, original, and blank fallback unresolved | None pending product mapping | Medium | NEEDS_REVIEW |

## Dibond Rules

| Canonical rule ID | Source workbook / worksheet / cells | Product type | Frame family | Imported frame name | Normalized production frame name | Adjustment/formula | Competing/conflicting sources | Recommended authoritative source | Confidence | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `dibond.exact-finished-dimensions.v1` | Production Director clarification, 2026-08-03 | 3D | All | N/A | N/A | `cutWidth = finishedPaintingWidth; cutHeight = finishedPaintingHeight`; workstation CNC | Historical workbook allowance is not active | Production Director clarification | High | CONFIRMED |
| `dibond.cut-millimeters.v1` | Production `Dibond Cutting!C2:C8,K2:K8,S7:S8`; `Dibond Pieces Cutting!C3:C26,K14:K77,AA25:AA26` | 3D | All | N/A | N/A | `ROUNDDOWN((inches + 9/32) * 25.4, 0)` | Repeated, but allowance rationale unresolved | None pending fabrication confirmation | High | NEEDS_REVIEW |
| `dibond.layout-spacing.v1` | Production documented layout ranges | 3D | All | N/A | N/A | `nextOrigin=max(lines)+13`; boundary `1525 mm` | Rotation/order/width policy absent | None pending layout policy | Medium | NEEDS_REVIEW |
| `dibond.inches-up-display.v1` | Production `Dibond Pieces Cutting` display helpers | 3D | All | N/A | N/A | Mixed `ROUND` / `ROUNDUP`, whole / one-decimal display | Formula blocks disagree | None pending operator standard | Medium | CONFLICT |

## Configuration Decision

- Active configuration contains 23 `CONFIRMED` entries: 7 frame allowances, 6 base adjustments, 7 stretcher rules, 2 paper-frame mappings, and 1 exact-dimension Dibond rule.
- Dibond runtime calculation is limited to exact finished width and height at the CNC workstation.
- CNC nesting, sheet layout, coordinates, kerf optimization, multi-piece placement, and sheet optimization belong to the future CNC Layout Tool and are not implemented here.
- Every `CONFLICT` and `NEEDS_REVIEW` entry is excluded from active arrays.
- No source supports an `OBSOLETE` decision, so obsolete count is zero.
- These drafts are not imported by production calculation services and do not change current behavior.
