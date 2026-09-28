# M66 Overlay, Dialog, Menu & Floating-Surface Architecture

M66 consolidates ownership around already-certified Ark dialog/menu/popover/tooltip implementations, the M11 page-lifetime global overlay roots, and the compatibility overlay coordinator. It is additive: the certified interaction implementations remain byte-identical.

## Ownership
- Ark primitives own dialog/menu/popover/tooltip keyboard, ARIA, focus and dismissal semantics.
- `global-overlay-runtime.ts` owns page-lifetime root-overlay exclusivity.
- `overlay-manager.ts` remains the compatibility coordinator for imperative consumers and explicit parent/child branches.
- Floating UI owns anchored geometry only; semantic ownership stays with the calling primitive.
- `WMFloatingSurface` standardizes the visual floating-surface boundary without inventing interaction semantics.
- Custom choice/select surfaces are classified as anchored interactive overlays; existing product implementations migrate later.
- Toast/feedback announcement behavior remains M67-owned.

## Migration boundary
M66 does not rewrite shell, Boards, TimeTracker, FuelTrack+, or TradeLink consumers. Those migrations remain M72–M76.
