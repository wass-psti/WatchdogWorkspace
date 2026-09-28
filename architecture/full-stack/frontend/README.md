# Frontend Boundary

Canonical production paths:

- `src/app/` — React composition, shell, route presentation, overlays, authenticated management UI.
- `src/features/` — typed host feature boundaries.
- `src/design-system/` — React design-system primitives and interaction abstractions.
- `assets/js/` — established typed browser runtime, platform adapters, and feature runtimes retained for certified compatibility.
- `assets/css/` — global foundation, shell, feature, and compatibility styling.
- `apps/` — isolated TimeTracker, FuelTrack+, and TradeLink module runtimes.
- `public/` — static public assets copied by Vite.

No backend migration, schema, RLS test, or server-only implementation belongs in this boundary.
