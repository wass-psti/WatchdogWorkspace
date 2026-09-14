# M42 Certified Artifact Transaction Corrective

Date: 2026-09-14
Milestone: Stage G — M42 Users / RBAC Functional Recovery
State: `implementation-complete-pending-certification`
Architecture: 50

## Defect isolated

The M42 finalizer previously used the fixed certified output paths directly. Before rebuilding, it removed any existing certified baseline directory, ZIP, and PASS record. If a re-finalization attempt failed during checksum generation, ZIP creation, ZIP integrity verification, or a later artifact operation, an older known-good certified package at those fixed paths could be destroyed even though the new certification never committed.

That behavior violated fail-closed artifact preservation: a failed attempt must not erase the last valid certified baseline.

## Corrective implementation

`scripts/finalize-stage-g-m42.sh` now treats certified output publication as a recoverable artifact transaction:

1. Dedicated certification owns the aggregate preflight and all pre-activation gates; the finalizer no longer repeats the preflight.
2. New certified artifacts are built under a unique sibling staging directory created with `mktemp -d`.
3. The staged baseline receives a freshly generated `CHECKSUMS.sha256` and must verify it successfully.
4. The ZIP is created from the staged baseline and must pass `unzip -t` before publication is attempted.
5. The staged PASS record includes the certified ZIP SHA-256.
6. Existing certified directory/ZIP/PASS artifacts are moved to a staging backup only at the final publication step.
7. New staged artifacts are then moved into the fixed certified paths.
8. If any backup or publication move fails, the EXIT rollback removes only newly installed artifacts and restores every successfully backed-up prior artifact.
9. Any failure before commit also restores the exact pre-certification M42 activation target and removes the staging directory.
10. The commit flag is set only after all three new certified artifacts are installed successfully.

## Deterministic regression verification

`scripts/verify-stage-g-m42-finalizer-rollback.mjs` now executes two real finalizer simulations:

- **Downstream gate failure:** dedicated certification is simulated as successful, the next required node gate fails, and the exact pending target is restored with no certified artifacts created.
- **Staged ZIP integrity failure with existing certification:** prior certified directory, ZIP, and PASS artifacts are seeded with sentinel content, staged ZIP validation is forced to fail, and all prior artifacts are proven byte-for-byte unchanged while the activation target is restored and staging residue is removed.

## Certification state

This corrective changes certification orchestration and artifact safety only. It does not promote M42. The milestone remains `implementation-complete-pending-certification` until every real fail-closed gate succeeds in an environment with the exact dependency tree and disposable Supabase pgTAP capability.
