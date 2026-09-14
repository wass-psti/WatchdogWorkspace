# M42 Finalization Transactional Rollback Corrective

State: `implementation-complete-pending-certification`

## Defect isolated

The dedicated M42 certification command correctly promoted the target to `active-certified` only after its pre-activation gates, but the full finalizer still had required downstream gates after that promotion: historical regression, TypeScript, security, UI, checksum generation, and ZIP integrity. A downstream failure could therefore leave the source target marked `active-certified` even though the complete milestone finalization had failed and no certified baseline should exist.

A second orchestration inefficiency remained inside release activation. Dedicated certification already executed static, deterministic, browser, and Database/RLS gates, but `activate:release` repeated browser/historical/release gates. That duplicated expensive browser work and blurred gate ownership.

## Corrective implementation

- `scripts/finalize-stage-g-m42.sh` now snapshots the exact pre-certification M42 target before certification and installs an EXIT rollback trap.
- Any non-zero finalizer exit before the final ZIP passes integrity verification restores that exact target byte-for-byte and removes partial certified directory, ZIP, and PASS-record artifacts.
- The rollback is disabled only after the certified ZIP passes `unzip -t` and the finalizer reaches its commit point.
- `scripts/certify-stage-g-m42.sh` now issues a short-lived, one-time certification attestation after its pre-activation gates complete.
- `scripts/activate-stage-g-m42.mjs` consumes that nonce-bound, target-bound, project-tree-bound attestation only to avoid duplicate expensive gates in the dedicated certifier path. Direct/manual `activate:release` without a valid attestation retains its self-protecting check/test/browser/historical/release gate sequence. The former caller-controlled boolean marker is ignored.
- The PASS record explicitly includes the Database/RLS verification gate.

## Deterministic regression verification

Two dependency-independent orchestration tests were added:

1. `scripts/verify-stage-g-m42-finalizer-rollback.mjs`
   - simulates successful dedicated certification followed by a downstream historical-gate failure;
   - proves the actual finalizer restores the exact original M42 target;
   - proves partial certified baseline, ZIP, and PASS-record artifacts are removed.
2. `scripts/verify-stage-g-m42-activation-gate-ownership.mjs`
   - proves a valid tree-bound certifier attestation executes only the post-transition M42 check rather than duplicating browser/historical/release gates;
   - proves direct/manual release activation still executes the self-protecting gate sequence;
   - proves the legacy boolean marker cannot bypass release gates;
   - proves a project-tree change after attestation issuance fails closed before target mutation.

The M42 deterministic package command now runs both orchestration regressions in addition to the existing 31 RBAC execution vectors.

## Certification state

This corrective does not promote M42. The target remains `implementation-complete-pending-certification`. Full certification still requires an exact dependency tree, the real six-scenario browser gate, disposable Supabase pgTAP Database/RLS execution, all post-certification regression gates, checksum/package hygiene, and final certified-baseline creation.

## Superseded attestation handoff — 2026-09-14

The one-time attestation handoff described above has been retired because its standalone issuer could be invoked without running certification gates. Finalization still remains transactional, but dedicated certification now delegates to release activation, which always runs the complete source-certification transaction and performs its own target rollback. See `M42-CALLER-MINTABLE-ATTESTATION-BYPASS-RETIREMENT-CORRECTIVE.md`.
