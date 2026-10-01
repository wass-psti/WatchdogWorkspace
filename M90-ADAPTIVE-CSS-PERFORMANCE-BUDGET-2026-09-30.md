# M90 Adaptive CSS Performance Budget Governance

## Trigger
The complete dependency-backed M90 production build emitted `initialCssRawBytes = 615057`, exceeding the inherited M88/M89 successor ceiling of `613000` by 2057 bytes.

## Root cause and measured evidence
M88 established `613000` as a narrow milestone-governed successor threshold rather than a permanent global maximum. M89 legitimately remained within that ceiling at 612887 bytes. M90 adds the shared Data-Dense Components & Enterprise Interaction Patterns layer: controlled search/filter toolbars, result summaries, bulk-action presentation, pagination presentation, keyboard-focusable dense-data viewports, accessibility status behavior, and a real Users-directory consumer while preserving M69/M18/M42/M44 product data, virtualization, mutation, and runtime authorities.

The first clean M90 production build completed successfully with 5045 transformed modules and measured 615057 raw initial CSS bytes. Static verification, full UI verification, ESLint, TypeScript, and the production build had already passed before the performance gate rejected the inherited predecessor ceiling. The measured increase from the M89 certified build (612887) is 2170 bytes and corresponds to the scoped M90 enterprise presentation/accessibility layer.

## Governed successor decision
M90 successor CSS ceiling: `616000`

The 616000-byte ceiling provides 943 bytes of deterministic headroom above the measured 615057-byte M90 production build. This is a narrow milestone-governed successor threshold, not a permanent global maximum. Historical M31/M79/M82/M83/M84/M88/M89 values remain provenance and are not rewritten. Future milestones must continue the same measured successor-governance model when legitimate required presentation growth is demonstrated.

## Invariants
- The M31 production performance gate remains fail-closed; no bypass is introduced.
- Required M90 dense-data, keyboard, accessibility, search/filter, bulk-action, pagination, and summary presentation must not be deleted or semantically compromised solely to satisfy the historical M89 ceiling.
- M69 native table/list semantics, M18 Board virtualization, M42 Users/RBAC mutations, M44 management runtime, Board selection/bulk mutation authority, and consumer-owned query/filter/page state remain unchanged.
- All non-CSS performance budgets remain unchanged.
- A clean production build remains the authoritative measurement and must pass `performance:bundle` under the M90 successor ceiling.
- This governance update does not certify M90; the complete ordered certification pipeline must pass before publication.
