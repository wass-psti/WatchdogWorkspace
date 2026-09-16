# Work Management Account / Settings / User Management — Stage C Milestone 13

Milestone 13 moves the authenticated **Account**, **Settings**, and **User Management** route presentation into React while preserving the production authorities established in Stages A/B and Stage C M10–M12.

## Authority model

- `src/app/management/AuthenticatedManagementUI.tsx` owns the three authenticated management route surfaces.
- `src/app/management/authenticated-management-ui-runtime.ts` owns safe transient presentation state, route visibility, busy state, storage-health/diagnostic results, and the bridge callbacks required to keep the shell synchronized.
- `assets/js/core/auth.ts` remains authoritative for Supabase session lifecycle, profile mutation, password mutation, session revocation, user-directory RPC access, and role/status mutation.
- `@tanstack/react-query` remains the user-directory server-state owner. M13 does not copy the directory into a second client-state store.
- `assets/js/core/platform.ts` remains authoritative for theme, density, storage-health, persistence requests, and platform diagnostics.
- `assets/js/core/backup.ts` remains authoritative for export, parsing, validation, migration, restore, rollback, and authentication/session exclusion.
- Supabase RLS and protected RPCs remain the authorization boundary for user administration.

## Account route

React now renders identity, platform role, module-role mapping, display-name updates, password changes, local/global sign-out, access refresh, and bootstrap-RBAC reconciliation guidance.

Password and confirmation values are read from the submitted React form and passed directly to the existing Auth authority. They are not represented in the M13 runtime snapshot, Zustand, TanStack Query, local storage, session storage, or diagnostics.

## Settings route

React now owns theme/density controls, module compatibility checks, storage-health/persistence controls, backend status, diagnostics, backup export/restore, and shell-preference reset. Existing platform and backup services remain unchanged authorities.

## User Management route

React now owns the administrator directory, search/filter presentation, protected bootstrap-administrator presentation, role/status forms, loading/error/retry states, and mutation feedback. The directory is fetched through TanStack Query and changes are invalidated/refetched after protected Supabase RPC mutations.

Non-administrators retain the explicit access-restricted presentation. Server authorization remains decisive even if client presentation is manipulated.

## Route composition

The M10 legacy route-content host remains page-lifetime mounted but becomes hidden and inert while an M13 management route is active. The M13 workspace is a React-owned sibling inside the existing React shell. M11 global overlays remain page-lifetime siblings and M12 standalone authentication remains mutually exclusive with M13 authenticated management presentation.

## Temporary compatibility boundaries (historical M13)

At M13, the M10 legacy route-content host remained mounted but hidden/inert while React owned Account, Settings, and Users; M11 global overlays remained page-lifetime siblings; and M12 standalone authentication remained mutually exclusive with authenticated management presentation. Password values remained ephemeral form input and were never copied into shared runtime state or persistence. M44 supersedes only the obsolete per-route management controller ownership described by that historical compatibility period; it does not weaken these state-security boundaries. M13 required **no Supabase migration**.

## M44 supersession — current management authority

M44 retires the former repository-compatibility Account, Settings, and User Management controllers. They are no longer shipped, exported by the public runtime gateway, cached as runtime assets, or registered as feature owners. `#/account`, `#/settings`, and `#/users` now share one feature/lifecycle owner, `management`, while the React runtime `view` continues to distinguish the three surfaces. Historical M13 details above remain an architecture record; they are not current ownership declarations.

Current retained boundaries:

- The M11 account/profile dropdown remains a shell-overlay authority hosted in the React-owned global overlay root; it is not an Account route controller.
- Account domain mutation remains delegated to `assets/js/features/account/account-service.ts` and core Auth.
- Settings domain/runtime behavior remains delegated to platform/backup/Auth plus `assets/js/features/settings/settings-recovery.ts`.
- Users server state remains TanStack Query-backed and protected role/status changes remain backend-authoritative.
- TimeTracker, FuelTrack+, and TradeLink remain isolated same-origin iframe runtimes under the retained M26 boundary.

## Database and dependencies

M13 adds no npm dependency and requires **no Supabase migration**. It consumes the already-certified React 19.2, TanStack Query 5.102.8, Supabase client/auth, and Stage C shell/overlay/authentication authorities.
