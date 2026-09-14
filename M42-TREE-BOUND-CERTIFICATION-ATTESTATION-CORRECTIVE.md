# M42 Tree-Bound Certification Attestation Corrective

Date: 2026-09-14
Milestone: Stage G — M42 Users / RBAC Functional Recovery
State: `implementation-complete-pending-certification`
Architecture: 50

## Defect isolated

The previous dedicated-certification optimization used the caller-controlled environment variable `M42_CERTIFICATION_GATES_COMPLETE=1` to tell release activation that static, deterministic, browser, and Database/RLS gates had already passed. Although the certifier set that value legitimately, the activation entrypoint could not distinguish it from the same value supplied manually. That made the documented “direct/manual release remains self-protecting” contract bypassable by a plain environment variable.

A second integrity gap followed from the same design: the marker was not bound to the exact source tree that passed the pre-activation gates. A concurrent or accidental project edit between the final gate and activation could therefore be promoted without proving that the activated tree was the tree that was tested.

## Corrective implementation

- Added `scripts/lib/stage-g-m42-certification-attestation.mjs`.
  - Computes a deterministic SHA-256 digest over the complete project tree while excluding only generated/runtime directories (`node_modules`, test reports, coverage, dist, `.vite`, `.git`) and `.DS_Store`.
  - Rejects symbolic links during attestation hashing.
  - Binds the attestation to the exact M42 activation target SHA-256, project-tree SHA-256, file count, milestone identity, purpose, short lifetime, and a cryptographically random nonce.
  - Requires the attestation file to be owner-only (`0600`) and, on POSIX systems, owned by the current user.
  - Consumes the attestation exactly once on every validation attempt, including invalid/tampered attempts.
- Added `scripts/issue-stage-g-m42-certification-attestation.mjs`.
  - The dedicated certifier creates the attestation only after every pre-activation gate succeeds.
  - The issuer returns the nonce to the same certification process; activation requires both the one-time file and matching nonce.
- Updated `scripts/certify-stage-g-m42.sh`.
  - Replaced the boolean bypass marker with a temporary one-time attestation stored outside the project tree.
  - Uses an EXIT trap to remove any unconsumed attestation.
- Updated `scripts/activate-stage-g-m42.mjs`.
  - Ignores the legacy `M42_CERTIFICATION_GATES_COMPLETE` marker.
  - Skips duplicate release gates only after consuming a valid, fresh, nonce-matched, target-bound, project-tree-bound attestation.
  - If no attestation is supplied, direct/manual release activation retains the complete self-protecting gate sequence.
  - If an attestation is supplied but invalid, stale, nonce-mismatched, or tree-mismatched, activation fails before mutating the target.

## Deterministic verification

`scripts/verify-stage-g-m42-activation-gate-ownership.mjs` now proves four independent cases against the real activation script:

1. Direct/manual release executes the self-protecting gate sequence.
2. The legacy caller-controlled boolean marker cannot bypass those gates.
3. A valid one-time tree-bound attestation suppresses only duplicate expensive gates and reaches `active-certified` in the isolated simulation.
4. Any project-tree change after attestation issuance causes activation to fail before any npm gate or activation-state mutation; the invalid attestation is consumed and cannot be replayed.

## Certification state

This corrective strengthens certification orchestration only. It does not promote M42 and does not replace any required real gate. M42 remains `implementation-complete-pending-certification` until exact dependencies, the six-scenario real-browser gate, disposable Supabase pgTAP Database/RLS verification, all downstream regressions, checksum/package hygiene, and certified-baseline creation succeed in one fail-closed finalization.

## Superseded — 2026-09-14

This mechanism is retained only as historical provenance. The standalone attestation issuer was later proven to be caller-mintable: a caller could mint a valid tree-bound attestation without executing certification gates and then promote M42 through release activation. The executable issuer/library have therefore been removed. Current authority is defined by `M42-CALLER-MINTABLE-ATTESTATION-BYPASS-RETIREMENT-CORRECTIVE.md`: release activation itself executes the complete pre/post source-certification transaction and accepts no attestation bypass.
