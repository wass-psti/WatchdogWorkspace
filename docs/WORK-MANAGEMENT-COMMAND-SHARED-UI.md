# Work Management — Stage C M14 Command Palette and Shared Application UI

Stage C Milestone 14 establishes a **React-owned command palette and shared application UI** boundary without changing command semantics, authentication policy, persistence, or business-domain behavior.

## Ownership

- React presentation: `src/app/shared-ui/SharedApplicationUI.tsx`
- Shared UI state/lifecycle bridge: `src/app/shared-ui/shared-application-ui-runtime.ts`
- React external-store hook: `src/app/shared-ui/useSharedApplicationUiRuntime.ts`
- Typed command registry authority: `assets/js/features/commands/command-registry.ts`
- Thin command trigger/registry adapter: `assets/js/features/commands/index.ts`
- Cross-feature overlay exclusivity: M11 `global-overlay-runtime.ts` + `overlay-manager.ts`

React now owns the command dialog, search/result rendering, keyboard selection, focus containment, global toast presentation, and the service-worker update banner. The existing typed command registry still owns command registration, visibility predicates, and execution callbacks.

## Shared surfaces migrated

1. Command palette (`Mod+K` and shell Search actions).
2. Global toast queue used by shell and feature adapters.
3. The service-worker update banner and its apply/dismiss presentation.

The M14 runtime stores only transient presentation state. It does not store passwords, Supabase sessions, server records, or domain data.

## Compatibility boundaries

- M13 Account / Settings / User Management remains React-owned and unchanged.
- Supabase Auth/RPC/RLS remains authoritative for identity and authorization.
- M11 remains the global root-overlay exclusivity authority.
- Account/profile menu, shell tooltip, Board overlays, and other not-yet-migrated overlay contents remain imperative M11 compatibility content.
- Home, Boards, and other unmigrated route content remain in the M10 legacy route-content island.
- TimeTracker, FuelTrack+, and TradeLink remain same-origin iframe compatibility islands.

## Database impact

**No Supabase migration is required.** M14 changes browser presentation ownership and lifecycle only.
