# M54 Post-Release CI / Historical Harness Synchronization Corrective — 2026-09-25

## Origin

The already-certified M54 source commit `c1a3811783ab9f44260171297d2c797d559ec90d` passed its dedicated production certification, but its `main` push exposed five historical recovery workflow failures and publishing tag `v1.43.2-m54` duplicated those historical push workflows on the tag.

## Root causes corrected

- GitHub Actions workflows with unrestricted `push` events are now branch-governed to `main`, preventing release tags from fanning out branch certification workflows.
- The historical M37/M46 Supabase capability fixture now advertises the M51 `wm_set_board_cell_if_current` RPC required by current M38 fail-closed capability preflight.
- The M47 deterministic item-edit regression now tests the current field-scoped title CAS contract and verifies a failed field CAS prevents cross-group movement before authoritative reload.
- M47 and M48 browser fixtures now model `wm_set_board_cell_if_current`; M48 CAS writes mutate authoritative fixture state and reject stale expected values.
- M48 E2E call accounting follows the CAS RPC while legacy `wm_set_board_cell` compatibility remains modeled.
- The M50 historical M49-certified provenance regression now constructs staged M49/M50 states deterministically instead of depending on today's already-certified M50 source state.
- M54 now contains a dedicated workflow-trigger governance verifier and requires it in `production-readiness:check`.

## Boundary

This corrective changes CI/historical verification authority only. It does not alter the production database migration ledger, the already-deployed application runtime contract, or the frozen M54 production/rollback release artifacts. A new continuation artifact is therefore a post-release corrective candidate, not a replacement declaration for the previously frozen production release until all required local and hosted regression gates pass.

## Dedicated corrective certification

`scripts/certify-stage-g-m54-post-release-ci-corrective.sh` is the fail-closed dedicated corrective gate. It replays M46 through M50 static/deterministic/workflow/browser authorities, the M50 provenance-context regression, and M54 static/deterministic authority before emitting PASS.
