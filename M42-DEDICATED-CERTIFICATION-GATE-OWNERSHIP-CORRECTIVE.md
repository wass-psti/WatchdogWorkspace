# M42 Dedicated Certification Gate Ownership Corrective

Date: 2026-09-14
Milestone: Stage G — M42 Users / RBAC Functional Recovery
State: implementation-complete-pending-certification
Architecture: 50

## Problem isolated

The full M42 finalizer executed the six-scenario browser gate before invoking dedicated certification, but `scripts/certify-stage-g-m42.sh` itself did not execute that browser gate. A direct `npm run users-rbac-recovery:certify` invocation could therefore reach the release activation mutation after environment preflight and Database/RLS verification without independently proving the M42 browser contract. The finalizer also duplicated deterministic and Database/RLS work around certification.

That split ownership violated the fail-closed requirement that the dedicated certification path itself must be safe when invoked directly.

## Corrective implementation

`scripts/certify-stage-g-m42.sh` now owns the complete pre-activation sequence:

1. aggregate M42 environment preflight;
2. exact lockfile dependency restoration/verification;
3. M41 account-recovery prerequisite status;
4. M42 static verification;
5. M42 deterministic execution verification;
6. M42 six-scenario real-browser gate;
7. disposable Supabase pgTAP Database/RLS gate;
8. only then `users-rbac-recovery:activate:release`;
9. post-activation M42 static verification;
10. explicit `active-certified` state assertion.

`scripts/finalize-stage-g-m42.sh` retains the early aggregate preflight, delegates the pre-activation gates to dedicated certification, then continues with the post-certification historical, TypeScript, security, UI, checksum and package-hygiene gates. It no longer reruns browser, deterministic, or Database/RLS gates outside certification.

`verify-stage-g-m42-users-rbac-functional-recovery.mjs` now enforces both the dedicated certification order and the non-duplicative finalizer contract.

## Fail-closed status in this continuation

This corrective does not promote M42. The current sandbox still lacks registry/package-cache availability for exact dependency restoration and lacks a Docker-compatible runtime/Supabase CLI for the disposable Database/RLS gate. Direct certification and finalization must therefore continue to stop before any activation-state mutation. No certified baseline or PASS record may be created here.

## Verification after corrective

- Shell/JavaScript syntax verification: PASS.
- M42 static verification: PASS — 69 checks.
- M42 deterministic execution verification: PASS — 31 vectors.
- Stage A security baseline: PASS.
- Full UI verifier chain: PASS.
- Direct environment preflight: FAIL CLOSED exactly on the two known external blockers — npm registry DNS (`EAI_AGAIN`) and absent Docker-compatible runtime.
- Direct `users-rbac-recovery:certify`: FAIL CLOSED at preflight before dependency restoration, browser/database execution, or activation mutation.
- Full `finalize-stage-g-m42.sh`: FAIL CLOSED at preflight before certification or activation mutation.
- M42 activation target before/after blocked certification/finalization attempts: unchanged byte-for-byte at `implementation-complete-pending-certification`.
- Historical verifier collect-all: 152 total; 136 PASS; 16 dependency-resolution failures identical to the prior continuation (`zod`, `@tanstack/react-query`, `zustand` dependent paths); no new assertion-only regression.
- No certified baseline and no PASS record were created.


## Subsequent attestation hardening

The non-duplicative activation handoff is now strengthened by `M42-TREE-BOUND-CERTIFICATION-ATTESTATION-CORRECTIVE.md`. The dedicated certifier no longer relies on a caller-controlled boolean environment marker. It issues a short-lived one-time attestation bound to the exact target and project tree that passed the pre-activation gates; direct/manual activation without a valid attestation remains self-protecting.
