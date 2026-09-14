# Stage B M8 — Architecture Verifier Synchronization Hotfix

The first M8 release-candidate certification completed the TanStack Query implementation verifier, then failed when the inherited Milestone 4 React Design System verifier still treated `@tanstack/react-query` as an unconditional later-milestone prohibition.

## Corrected verifier ownership

- `verify-stage-b-m4-react-design-system.mjs` no longer rejects `@tanstack/react-query` unconditionally after M8.
- M4 now permits TanStack Query only when `config/stage-b-m8-tanstack-query-target.ts` exists and governs the exact runtime package/version.
- The package must remain a runtime dependency, the package-lock root must match the M8 target, and the resolved lockfile package entry must match the exact M8 version.
- `verify-stage-b-m8-tanstack-query.mjs` now contains regression assertions that reject restoration of the stale M4 denylist behavior.

## Scope

This hotfix synchronizes inherited architecture verification with the implemented M8 ownership boundary. It does not change query behavior, cache semantics, Supabase transport behavior, authentication/session authority, RLS/RPC authorization, Board behavior, UI behavior, database schema, or dependency versions.

## Certification requirement

The package remains an RC until `npm run stage-b:certify` completes successfully and `npm run tanstack-query:status` reports `active-certified` on the governed Node/npm toolchain.
