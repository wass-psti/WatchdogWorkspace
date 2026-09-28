# M62 Responsive Architecture & Adaptive Primitives

M62 owns the shared responsive contract layered above the certified M61 spatial system. The canonical shared breakpoints remain the already-certified `narrow=640px`, `tablet=840px`, `laptop=1120px`, and `wide=1440px` values. Shared CSS queries use their rem equivalents so browser text scaling and zoom remain compatible.

## Adaptive primitives

- `WMGrid collapseAt` explicitly collapses a configured grid to one column at a named breakpoint.
- `WMCluster stackAt` explicitly converts a wrapping cluster to a vertical stack at a named breakpoint.
- `WMPage` retains its pre-M62 tablet gutter behavior, but the media query is now owned by `responsive-system.css`.

No adaptive behavior is implied when an opt-in prop is absent. M62 does not add implicit hiding, reorder content, or change existing primitive defaults.

## Compatibility boundary

The host shell, Boards, TimeTracker, FuelTrack+, and TradeLink contain established feature-specific media queries. M62 inventories but does not mass-normalize them. Their behavior remains authoritative until the staged M72–M76 migrations, where each consumer can be moved with browser evidence rather than breakpoint substitution by assumption.

M63 owns accessibility/interaction semantics. M64 owns broader component consolidation.
