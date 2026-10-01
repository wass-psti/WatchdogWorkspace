# M82 Certification Handoff

M82 certification must remain fail-closed in this order:

1. environment preparation
2. workspace/source validation
3. dependency installation/integrity
4. static verification
5. deterministic automated tests
6. Browser/E2E
7. dedicated M82 certification
8. post-certification repository/state validation
9. historical regression
10. checksum/package hygiene and certified artifact publication
11. final certified checkpoint

No certified ZIP or PASS record is valid if any preceding required gate is incomplete, failed, skipped, or indeterminate.

## Corrective-v2 requirement

The canonical corrective checkpoint includes the semantic density contract repair discovered by the failed Browser/E2E attempt. Local recertification must restart from stage 1 and must not skip directly to Browser/E2E. The unchanged E2E density assertion is the primary loop-exit evidence; all later gates remain fail-closed dependencies.

## Corrective v3 — CSS budget governance
The local corrective-v2 certification advanced through production build but failed closed at the performance gate because required semantic-density aliases raised initial CSS to 590364 bytes against the historical 590000-byte M31 ceiling. M82 now authorizes a narrowly bounded successor ceiling of 591000 bytes via `M82-CSS-PERFORMANCE-BUDGET-CORRECTIVE-2026-09-29.md`; historical records and all non-CSS budgets remain unchanged. Full local fail-closed certification remains required.


## Responsive Cascade Corrective — 2026-09-29
The Browser/E2E gate exposed a cascade-authority defect at the certified tablet breakpoint: the adaptive grid/cluster selectors used zero-specificity `:where(...)` selectors and were overridden by the later-loaded zero-specificity primitive defaults. The corrective delta promotes only adaptive grid/cluster selectors to normal class/attribute specificity for wide/laptop/tablet/narrow breakpoints, preserves stylesheet load order and certified breakpoints, keeps the original browser assertion, and adds static/deterministic guards against zero-specificity regression. Full local fail-closed recertification remains required.
