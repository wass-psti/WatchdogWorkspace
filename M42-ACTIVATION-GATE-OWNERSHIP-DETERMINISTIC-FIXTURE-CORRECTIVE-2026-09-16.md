# M42 Activation Gate-Ownership Deterministic Fixture Corrective — 2026-09-16

## Hosted failure evidence

The exact-revision `Stage G M42 Certified Baseline` workflow run `35044563541` executed on commit `4bdd1ac82c5c4dc963e3812bac39a3add2ea32ae`. Hosted capability checks, clean dependency materialization, the governed modern test toolchain, M42 static/deterministic gates, all 6 M42 browser scenarios, all 96 Database/RLS tests, the active-certified post-state check, and all 152 historical verifiers passed before the complete `release:check` reran the M42 deterministic suite.

The run then failed inside `scripts/verify-stage-g-m42-activation-gate-ownership.mjs` at the authority-mismatch vector. The regression copied the live activation target and release-status records after the real certification transaction had legitimately moved both to `active-certified`, then attempted a literal replacement that only matched `implementation-complete-pending-certification`. Because the replacement matched nothing, the sandbox authorities remained synchronized as `active-certified`; activation therefore succeeded and the regression incorrectly expected a failure.

The finalizer correctly rolled back the real activation target and release-status record and uploaded no certified artifact.

## Root cause

The regression fixture inherited the live milestone lifecycle state. Its mismatch setup therefore depended on whether the suite ran before or after real M42 activation. This made a deterministic certification regression state-dependent.

## Corrective

`scripts/verify-stage-g-m42-activation-gate-ownership.mjs` now:

- normalizes each sandbox target and release-status authority to the deterministic `implementation-complete-pending-certification` fixture state before any vector runs;
- validates that both copied authorities expose replaceable state fields before normalization;
- explicitly seeds the mismatch vector from a simulated `active-certified` source snapshot, then proves normalization back to the deterministic pending fixture; and
- creates the intentional authority mismatch through the same guarded state-normalization helper instead of a state-specific literal replacement.

The production activation/finalization implementation is unchanged. Users/RBAC UI, RPC, RLS, migrations, browser behavior, dependency materialization, and evidence-digest policy are unchanged.

## Verification requirement

The activation-gate-ownership regression must pass both when the live project is pending certification and when its copied source authorities represent `active-certified`. The exact-revision hosted automatic M42 workflow must be rerun after this corrective, followed by a new `Stage G M42 Certified Baseline` run on the same new commit SHA. No M42 certified ZIP or PASS record is authorized until that hosted transaction succeeds.
