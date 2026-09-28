# M76 PASS Record Milestone Label Corrective — 2026-09-28

## Originating failure
The outer fail-closed M76 certification wrapper exited after package hygiene and before the final checkpoint because the generated PASS record retained two M75 labels.

## Root cause
`scripts/finalize-stage-h-m76.sh` was cloned from M75 and still emitted `Stage H — Milestone 75` and `Milestone 75 certification: PASS`. The M76 certified-artifact verifier validated result/state/hash integrity but did not validate milestone identity or bind the PASS-record source digest back to the extracted certified payload.

## Correction
- Emit the correct M76 milestone heading and certification line.
- Require exact M76 identity/semantics fields in the certified-artifact verifier.
- Bind the PASS-record certified source-tree SHA-256 to the extracted certified payload's normalized M76 certification-tree digest.
- Add deterministic source assertions preventing stale M75 labels from reappearing.

## Scope
Certification metadata and verification only. TradeLink runtime, document workflows, calculations, PDF generation, recovery/import/export, RBAC, and persistence are unchanged.
