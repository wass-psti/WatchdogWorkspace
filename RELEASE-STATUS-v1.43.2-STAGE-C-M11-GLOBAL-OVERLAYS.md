# v1.43.2 — Stage C Milestone 11 Global Overlays

**State:** implementation-complete-pending-certification  
**Architecture Version:** 21  
**Prerequisite:** Stage C M10 React Shell `active-certified`

## Implemented

- Added a React-owned page-lifetime global overlay host with one interactive `#overlayRoot` and one `#toastRoot`.
- Added a typed global overlay runtime that owns cross-feature root-overlay exclusivity, preserves newest-claim-wins behavior under synchronous re-entrant replacement, and exposes observable ownership state.
- Converted the existing overlay manager into a scoped branch adapter over the global runtime rather than using independently coordinated document listeners.
- Added the command palette to the shared overlay lifecycle.
- Routed account menus, shell tooltips, Board popovers/dialogs/column pickers, the update banner, and Work Management toasts through the React-owned portal roots.
- Removed duplicate overlay/toast roots from standalone authentication route content.
- Removed the legacy secondary `#globalToastRoot` body-level notification root.
- Advanced application manifest/types/runtime schema enforcement to Architecture Version 21.
- Added M11 source verification, execution vectors, Chromium integration assertions, Vite dev/preview ownership checks, activation/status scripts, CI/deployment gates, and Stage C certification integration.

## Preserved authorities

- M10 React shell remains `active-certified` and owns persistent shell structure.
- M9 Zustand remains scoped shared client-state authority.
- M8 TanStack Query remains server-state authority.
- Supabase Auth remains session authority.
- Supabase Postgres/RPC/Storage and RLS remain persistent-domain and authorization authorities.

## Temporary compatibility boundaries

- Feature-specific overlay content remains imperative compatibility content inside the React-owned portal roots.
- Event-delegated Board floating menus remain in the Board route overlay layer to preserve existing Board action delegation; their open/close lifecycle still participates in the M11 global overlay authority.
- The M10 legacy route-content island remains in place.
- Dynamic resource-navigation markup remains temporarily bridged into the React shell.
- Embedded application overlays remain isolated inside TimeTracker, FuelTrack+, and TradeLink iframes.

## Database

No Supabase migration is required for M11.

## Governed bootstrap hotfix

Mac certification must enter through `bash scripts/certify-stage-c-m11.sh`. This prevents an ambient Node/npm installation from executing the initial dependency restoration outside the governed Node `22.16.0` / npm `10.9.2` toolchain. The engine policy remains strict and unchanged.
