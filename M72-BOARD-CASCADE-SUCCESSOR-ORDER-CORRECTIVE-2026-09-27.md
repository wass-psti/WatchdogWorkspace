# M72 Board Cascade Successor-Order Corrective — 2026-09-27

## Originating gate

`npm run verify:ui` → `verify-v1432-board-monday-integration.mjs`.

## Root cause

M72 intentionally inserted `assets/css/foundation/host-ui-migration.css` after the certified shared host/shell layers and before `assets/css/boards-monday.css`. The legacy Board Monday integration verifier encoded an adjacency regex that predated M72 and therefore rejected the authorized host migration layer even though Board presentation still loaded after all host layers.

## Correction

The verifier now accepts exactly one optional M72 host migration layer in the established pre-Board cascade. M72 deterministic verification requires that successor-aware assertion to remain present. Board-specific CSS remains last among these presentation layers, and no Board runtime or business behavior changed.

## Full UI-chain audit

The complete `verify:ui` chain contains two adjacency-style cascade assertions that predate M72 and therefore require successor awareness: `verify-v1432-board-monday-integration.mjs` and `verify-v1432-shell-navigation-foundation-sm1.mjs`. Shell M5–M8 use relative order checks and require no modification. Both adjacency assertions now permit exactly the M72 host migration layer before `boards-monday.css`, preserving the intended order.
