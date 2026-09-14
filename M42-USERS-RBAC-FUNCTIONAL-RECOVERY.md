# M42 — Users / RBAC Functional Recovery

Architecture Version 50 restores administrative user-management behavior around server-authoritative, serialized Supabase RPCs.

## Implemented
- Directory loading, search, refresh, empty/error/retry states.
- Role and status mutations through `admin_set_user_access`.
- Transaction-wide advisory serialization before caller-authority and last-admin checks.
- Backend-provided bootstrap/self/last-admin policy flags consumed by the React Users UI.
- Bootstrap-admin, self-disable, and last-active-admin safeguards.
- Self-role demotion with immediate access-context reconciliation when another active admin exists.
- Mutation-success/directory-refresh-failure outcome separation.
- Unauthorized role denial in both client and server authority.
- pgTAP and Playwright coverage for normal, failure, and recovery paths.

## Boundaries
M26 iframe compatibility remains where certified; M43 Settings recovery and M54 final production-readiness certification remain outside M42.

## Browser corrective synchronization

- Forced post-self-mutation access reconciliation now waits for any older in-flight access-context transaction to settle and then performs a new authoritative read.
- Unauthorized and self-demoted Users routes are verified against the M40-certified shell-owned forbidden presentation rather than the management React denied view.

- Self-role form submission now preserves authoritative values for disabled protected controls because HTML FormData omits disabled inputs; this prevents valid self-demotion from being rejected before the backend mutation RPC.

## Certification environment preflight corrective

- Added a single aggregate M42 certification-environment preflight that validates governed Node/npm, M41/M42 state, exact dependency availability or registry reachability, a Chromium-based browser, a running Docker-compatible runtime, pinned Supabase CLI resolvability, and packaging tools before certification proceeds.
- Direct M42 certification and finalization now invoke this preflight before the disposable database gate or any activation-state mutation, preventing late environment discovery and repeated partial certification attempts.
- The M42 CI workflow executes the same preflight immediately after `npm ci`, keeping local/target-machine and CI prerequisite semantics synchronized.

## Certification dependency-byte integrity corrective — 2026-09-14

The M42 certification path now requires a clean governed `npm ci` and binds all release evidence to the resulting installed-dependency content digest. This closes the gap where modified package files could retain expected package metadata and influence evidence while remaining outside the repository source digest. See `M42-INSTALLED-DEPENDENCY-CONTENT-BINDING-CORRECTIVE.md`.

## Governed modern test-toolchain preservation corrective — 2026-09-14

A certification success-path audit found that the installed-dependency digest was captured after clean application `npm ci` but before the exact no-save Vitest/Testing Library/Playwright/jsdom toolchain required by M42 browser/release gates was installed. That made healthy browser execution mutate the very dependency tree M42 had already certified, while nested ordinary dependency checks could subsequently remove those governed tools as extraneous. The corrected M42 transaction now clean-installs the application graph, materializes and verifies the exact governed modern test-toolchain extension, verifies the application lockfile packages remain exact, and only then captures one full installed-byte digest. Nested dependency checks preserve that extension only while they match the owning certification digest. Preflight and CI now use the same topology. See `M42-GOVERNED-MODERN-TEST-TOOLCHAIN-PRESERVATION-CORRECTIVE.md`.

## Hosted certification provenance boundary

The final hosted certification workflow requires an explicit expected Git commit SHA and rejects any run whose actual `GITHUB_SHA` differs. The certification PASS record binds the certified ZIP, certified source-tree digest, and source commit. This requirement is verified by the M42 static contract and deterministic hosted-workflow verifier.
