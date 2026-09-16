# Stage G — Milestone 44: Management Authority Consolidation

M44 removes the obsolete imperative Account, Settings, and User Management presentation controllers left behind after Stage C M13 and the M41–M43 functional recovery milestones. The React management UI now has one lifecycle/feature owner: `management`.

## Consolidated ownership

- `src/app/management/AuthenticatedManagementUI.tsx` is the only authenticated management presentation boundary.
- `src/app/management/authenticated-management-ui-runtime.ts` is the only route/UI runtime authority for Account, Settings, and Users.
- `config/application-manifest.ts` maps `#/account`, `#/settings`, and `#/users` to the single `management` feature owner.
- `assets/js/app.ts` registers `authenticatedManagementUiRuntime` exactly once as the `management` feature.
- Presentation readiness acknowledges only the `management` owner while the runtime `view` distinguishes Account, Settings, and Users.
- The manifest ownership identity is `react-management-v1`, and shell route-focus targeting is keyed by the same `management` owner instead of legacy per-route feature IDs.

## Retired implementations

The following obsolete imperative controllers are removed from the shipped source tree and are no longer exported or cached:

- `assets/js/features/account/index.ts`
- `assets/js/features/settings/index.ts`
- `assets/js/features/user-management/index.ts`

Their former domain responsibilities remain behind explicit non-presentation authorities: Account mutations use `assets/js/features/account/account-service.ts` and `assets/js/core/auth.ts`; Settings uses core platform/backup/auth plus the bounded M43 evidence helper; Users uses TanStack Query and protected backend RPC authority.

## Historical synchronization

M37 recorded the duplicate management implementations as `M37-TECHDEBT-001`. M44 marks that debt resolved and updates historical verification to require the obsolete constructors to remain absent at Architecture 52+. M40 lifecycle tests are synchronized so all three management routes use one owner while still treating route identity changes as distinct transitions.

## Compatibility boundaries

The shell account/profile menu remains a separate overlay controller because it is shell chrome rather than Account-route presentation. M26 embedded same-origin iframe compatibility is unchanged. No Supabase migration is introduced by M44.


## Certification state-record integrity

The M44 certification-tree digest excludes the M44 target/release-state records to permit isolated promotion from pending source to an active-certified package. The finalizer therefore separately SHA-256 binds both mutable records before pre-certification gates and requires byte-for-byte identity after pre-gates and again after the staged active-candidate historical/build gate. Any unexpected mutation fails closed before PASS publication.
