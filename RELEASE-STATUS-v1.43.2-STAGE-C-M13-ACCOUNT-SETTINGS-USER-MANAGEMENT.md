# Work Management v1.43.2 — Stage C M13 Account / Settings / User Management

**Milestone state:** `implementation-complete-pending-certification`  
**Architecture Version:** 23  
**Prerequisite:** M12 `active-certified`

## Implemented

- React-owned Account route presentation and account-security/session actions.
- React-owned Settings route presentation and existing preference/storage/diagnostic/backup operations.
- React-owned User Management route with TanStack Query directory ownership and protected Supabase RPC mutations.
- Hidden/inert M10 legacy route-content host while M13 routes are active.
- M12 authentication and M11 global-overlay ownership preserved.
- Architecture manifest/type/runtime-schema enforcement advanced to Architecture Version 23.
- M13 verifier, execution vectors, governed activation, release certification entrypoint, CI/deploy gates, browser integration coverage, documentation, and aggregate verification wiring.

## Compatibility boundaries

Historical Account/Settings/User Management controller files remain in the source tree as inert compatibility artifacts. The active route render table and event/form wiring no longer delegate to them. The account/profile dropdown remains an M11 imperative overlay compatibility surface. Home, Boards, and embedded module route content retain their established compatibility boundaries.

## Database

No Supabase migration is required.

## Certification TypeScript-loader hotfix

The first user-Mac certification attempt passed ZIP integrity, governed Node/npm handoff, dependency installation, M10-M13 architecture preflight, and strict TypeScript, then failed in the historical Settings regression launcher with `ERR_UNKNOWN_FILE_EXTENSION` for `assets/js/core/platform.ts`. The M13 certifier now executes all three direct historical regression verifiers with `--experimental-strip-types --disable-warning=ExperimentalWarning`. No application runtime, dependency, database, or authority-model change is included in this hotfix.

## Certification requirement

M13 must complete the governed Node 22.16.0/npm 10.9.2 certification entrypoint, full release gate, browser integration, production build/dist/preview verification, and final `active-certified` state before this milestone is closed.
