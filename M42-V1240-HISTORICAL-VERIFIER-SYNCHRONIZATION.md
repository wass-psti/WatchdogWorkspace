# M42 — v1.24.0 Historical Verifier Synchronization

## Evidence

The active Users surface in `src/app/management/AuthenticatedManagementUI.tsx` delegates directory loading to TanStack Query via `useQuery`. After a successful access mutation it writes the authoritative mutation result into the existing directory cache with `queryClient.setQueryData(USER_DIRECTORY_QUERY_KEY, ...)`, then reconciles with the server using `directory.refetch()` while authorization remains available. If a self-role mutation removes `canManageUsers`, the UI deliberately skips a now-unauthorized directory refetch.

The historical `verify-v1240-architecture-phase3.mjs` verifier still required the literal `queryClient.invalidateQueries`, which no longer describes the Architecture 50/M42 ownership contract and caused the only failure in the 152-verifier historical sweep.

## Corrective change

For Architecture 50+, the historical verifier now requires all of the current TanStack Query ownership signals:

- `useQuery({` for directory loading/stale-response ownership;
- `queryClient.setQueryData(USER_DIRECTORY_QUERY_KEY` for immediate authoritative mutation-cache reconciliation;
- `const refreshed = await directory.refetch()` for server reconciliation;
- `if (!auth.canManageUsers)` for the self-demotion authorization boundary.

Older architecture versions retain the original `queryClient.invalidateQueries` assertion.

No production Users/RBAC behavior was changed by this corrective synchronization.
