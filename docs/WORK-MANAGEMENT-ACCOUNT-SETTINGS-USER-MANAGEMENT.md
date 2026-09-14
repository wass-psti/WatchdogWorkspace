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

## Temporary compatibility boundaries

- `assets/js/features/account/index.ts`, `assets/js/features/settings/index.ts`, and `assets/js/features/user-management/index.ts` remain repository compatibility artifacts for historical verification and downstream references, but `assets/js/app.ts` no longer constructs or delegates active route presentation/actions/forms to those controllers.
- The M11 account/profile dropdown remains imperative overlay content hosted in the React-owned global overlay root.
- Home, Boards, module launch/error pages, and other not-yet-migrated authenticated route content remain in the M10 legacy route-content island.
- TimeTracker, FuelTrack+, and TradeLink remain isolated same-origin iframe runtimes.

## Database and dependencies

M13 adds no npm dependency and requires **no Supabase migration**. It consumes the already-certified React 19.2, TanStack Query 5.102.8, Supabase client/auth, and Stage C shell/overlay/authentication authorities.
