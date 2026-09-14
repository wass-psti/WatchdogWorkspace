# M42 Caller-Mintable Attestation Bypass Retirement Corrective

Date: 2026-09-14
Milestone: Stage G — M42 Users / RBAC Functional Recovery
State after corrective: `implementation-complete-pending-certification`

## Root cause

The previous tree-bound certification attestation was cryptographically bound to the project tree and target, but its issuer was a standalone repository script. Any caller could therefore execute the issuer directly, obtain the emitted nonce, set the attestation environment variables, and invoke `users-rbac-recovery:activate:release` without first executing the certification gates.

This was proven against an isolated copy of the project: the standalone issuer plus release activation returned exit code 0 and changed the M42 target from `implementation-complete-pending-certification` to `active-certified` while the expensive certification gates were skipped.

Tree binding prevented post-gate tampering, but it did not prove that the gates had actually run. The issuer itself was therefore an authority bypass.

## Corrective

- Removed `scripts/issue-stage-g-m42-certification-attestation.mjs`.
- Removed `scripts/lib/stage-g-m42-certification-attestation.mjs`.
- `scripts/activate-stage-g-m42.mjs --release` now always owns the complete source-certification transaction itself:
  1. certification environment preflight;
  2. exact dependency restoration/verification;
  3. M41 account-recovery status prerequisite;
  4. M42 static verification;
  5. M42 deterministic verification;
  6. six-scenario M42 browser verification;
  7. disposable Supabase pgTAP Database/RLS verification;
  8. activation-state promotion;
  9. post-activation M42 static/state verification;
  10. explicit M42 status read;
  11. historical verifier sweep;
  12. complete `release:check`.
- Any failure restores the exact pre-activation M42 target.
- Caller-provided legacy variables (`M42_CERTIFICATION_GATES_COMPLETE`, `M42_CERTIFICATION_ATTESTATION`, and `M42_CERTIFICATION_ATTESTATION_NONCE`) are ignored and cannot skip gates.
- `scripts/certify-stage-g-m42.sh` is now a thin rollback-safe wrapper around the authoritative release-activation transaction plus explicit final-state verification.

## Deterministic proof

`scripts/verify-stage-g-m42-activation-gate-ownership.mjs` now proves:

- non-release activation cannot certify;
- direct release executes every pre/post source-certification gate;
- a Database/RLS failure restores the exact original target before activation;
- a post-activation historical failure restores the exact original target;
- a post-activation full release failure restores the exact original target;
- caller-controlled legacy attestation/boolean variables do not bypass any gate;
- the standalone attestation issuer/library remain absent.

`scripts/verify-stage-g-m42-certifier-rollback.mjs` proves the dedicated certifier delegates to the complete release-activation transaction and restores state if that transaction or final-state verification fails.

## Certification consequence

This corrective does **not** mark M42 certified. M42 remains fail-closed until the exact dependency tree can be restored and the disposable Supabase Database/RLS gate plus all downstream release gates execute successfully in a capable environment.
