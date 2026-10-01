# M81 Corrective Loop — M68 Deterministic Successor Synchronization

## Origin
After synchronizing the M78 protected-presentation verifier, proactive deterministic execution reached `shell-ia:test` and the M68 verifier rejected `assets/js/app.ts` as immutable M67 drift.

## Root cause
Verification / successor-governance synchronization. M81 intentionally adds shell page-header/global-frame semantics in `assets/js/app.ts`, while the M68 verifier only recognized its older M72 migration allowlist.

## Corrective delta
- Keep the M68 certified M67 hashes strict by default.
- When the M81 application-shell authority exists, authorize only `assets/js/app.ts` as an M81 M68-authority mutation.
- Preserve all existing M68 semantic assertions for route-aware navigation, capability gating, resource sections, desktop/mobile state, accessibility, and CSS behavior.
- Require this synchronization in the M81 verifier and source-guard allowlist.

## Exit criterion
Full M81 fail-closed certification through the final checkpoint.
