# Host-Level UI Migration Architecture — M72

M72 is the first Stage H consumer-migration milestone. It migrates React-owned host presentation onto the certified M57–M71 design-system contracts while preserving runtime, route, authentication, authorization, persistence, and module ownership.

## Migrated host owners
- React shell composition marker and host bridge surface
- Authentication UI
- Account, Settings, and Users management UI
- Shared command palette, update banner, and toast presentation

## Preserved authorities
- M40 route ownership and lifecycle
- M12 authentication runtime
- M13 management runtime
- M14 shared application UI runtime
- M66 overlay lifecycle
- M68 shell navigation mechanics and imperative navigation markup
- M71 motion orchestrator and continuity runtime
- Boards and embedded application presentation until M73–M76

## Migration rules
1. Prefer certified shared primitives over parallel host-only components when semantics are equivalent.
2. Preserve existing data attributes and CSS/event hooks that remain runtime contracts.
3. No business, RPC, persistence, authorization, or Supabase behavior changes in M72.
4. Host visual consolidation is scoped through `data-wm-host-migrated` and `host-ui-migration.css`.
5. Consumer migrations for Boards, TimeTracker, FuelTrack+, and TradeLink remain separate successor milestones.
