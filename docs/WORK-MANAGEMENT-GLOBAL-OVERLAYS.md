# Work Management Global Overlays — Stage C Milestone 11

Milestone 11 consolidates page-level overlay ownership on top of the certified M10 React shell. The goal is not to rewrite every menu, popover, dialog, tooltip, or notification in React. The goal is to establish one page-lifetime host and one root-overlay lifecycle authority so later feature migrations do not compete for global DOM ownership.

## Authority model

- `src/app/overlays/GlobalOverlayHost.tsx` owns the persistent `#overlayRoot` and `#toastRoot` portal containers.
- `assets/js/platform/ui/global-overlay-runtime.ts` owns the current root-overlay branch across all feature-specific overlay managers.
- `assets/js/platform/ui/overlay-manager.ts` remains the feature-scoped adapter for parent/child overlay branches, Escape, outside-click dismissal, focus restoration, and click-through suppression.
- `src/platform/contracts/overlay.ts` defines the global/runtime and scoped-manager contracts.
- React does not reconcile imperative descendants inserted into the portal roots.

The global host is rendered in both authenticated shell mode and standalone authentication mode. Authentication route content no longer creates duplicate overlay/toast roots.

## Migrated host-level consumers

M11 routes the following host surfaces through the React-owned global roots:

- command palette;
- account/profile menu and Appearance submenu;
- shell tooltips;
- Board dialogs, inline-editor popovers, and column pickers;
- service-worker update banner;
- global Work Management toasts.

Opening a new root overlay through any `createOverlayManager()` instance claims the page-lifetime global authority and closes the previous root branch. Parent/child overlays within the same manager remain a single permitted branch.

## Accessibility and interaction guarantees

M11 preserves the established interaction contracts:

- Escape closes only the current top overlay;
- outside pointer dismissal does not leak a click into the underlying Board action;
- parent/child overlay branches are explicit;
- focus restoration occurs only when requested by the closing path;
- synchronous re-entrant overlay replacement preserves newest-claim-wins ownership;
- tooltips dismiss when a root overlay opens;
- toast announcements remain `aria-live="polite"` and `aria-atomic="true"`;
- reduced-motion behavior remains owned by existing overlay/component CSS.

## Temporary compatibility boundaries

The following are **temporary compatibility boundaries**, not unfinished M11 defects:

- overlay *content* for the command palette, account menus, Board dialogs/popovers, and shell tooltips remains imperative compatibility content;
- event-delegated Board floating menus remain physically mounted in the Board route overlay layer so existing Board action delegation is not severed; they still claim/release the M11 global lifecycle authority and remain mutually exclusive with other root overlays;
- the legacy TypeScript route-content island remains active from M10;
- dynamic Applications/Favorites/Boards navigation markup remains bridged into the React shell from M10;
- embedded TimeTracker, FuelTrack+, and TradeLink overlays remain internal to their same-origin iframe runtimes and are intentionally not pulled into the host overlay stack.

Later Stage C milestones can migrate overlay contents to React primitives independently because the page-level ownership contract is now stable.

## Database and dependencies

M11 adds no package dependency and requires no Supabase migration.
