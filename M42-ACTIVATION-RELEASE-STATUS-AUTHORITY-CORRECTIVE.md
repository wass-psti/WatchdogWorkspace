# M42 Activation / Release-Status Authority Corrective

## Problem

The M42 activation target and the M42 release-status document are both authoritative certification-state records, but activation previously mutated only the target. A successful non-release activation or standalone source certification could therefore leave the target at `active-pending-browser-certification` or `active-certified` while the release-status record still declared `implementation-complete-pending-certification`. The dedicated certifier also snapshotted/restored only the target, so a wrapper-level post-transaction status failure could restore the target while leaving the release-status record certified.

## Corrective

- `scripts/activate-stage-g-m42.mjs` now reads both records and fails before any gate execution if their state values disagree.
- Every M42 activation-state transition updates the target and release-status state together.
- Any activation failure restores both records to their exact pre-invocation contents.
- `scripts/certify-stage-g-m42.sh` snapshots and restores both records if delegated source certification or the final state check fails.
- Deterministic orchestration tests now cover authority mismatch rejection, pending-state synchronization, certified-state synchronization, and dual-record rollback after pre- and post-activation failures.
- Final artifact publication remains responsible for adding the final certified-baseline evidence section and PASS/digest binding; this corrective only keeps the two source-state authorities consistent.

## Certification state

This corrective does not declare M42 complete. M42 remains fail-closed until exact dependencies can be restored and the disposable Supabase pgTAP Database/RLS gate plus all governed certification/finalization gates pass.

## Additional evidence hardening

The aggregate M42 certification preflight now includes the release-status record as a required artifact and validates target/release-status state equality before dependency, browser, or database probes. The finalizer regression also covers staged symbolic-link rejection and simulates certifier mutation of both state records before downstream rollback.
