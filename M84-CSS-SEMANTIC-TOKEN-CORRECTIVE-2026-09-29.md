# M84 CSS Semantic Token Corrective — 2026-09-29

## Root cause
The M84 Boards presentation stylesheet referenced four custom properties that are not defined by the certified foundation token/theme authorities: `--wm-color-page`, `--wm-space-2`, `--wm-space-3`, and `--wm-space-4`. Because `--m84-board-surface` depended on the undefined `--wm-color-page`, its computed value became invalid and the real-browser M84 runtime-marker assertion failed.

## Corrective delta
- `--wm-color-page` → `--wm-color-canvas`
- `--wm-space-2` → `--wm-board-space-compact`
- `--wm-space-3` → `--wm-board-space-control`
- `--wm-space-4` → `--wm-board-space-standard`

All replacements use pre-existing certified semantic/foundation tokens. No Board persistence, realtime, RBAC, drag/drop, backend, schema, or status semantics are changed.

## Regression prevention
M84 static and deterministic verifiers now enumerate every `var(--wm-...)` dependency in the M84 stylesheet and require a corresponding definition in the foundation CSS authority set. This prevents unresolved foundation-token dependencies from re-entering the M84 presentation layer.
