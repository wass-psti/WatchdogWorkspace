# M91 Adaptive CSS Performance Budget Governance

## Trigger
The complete dependency-backed M91 production build emitted `initialCssRawBytes = 617965`, exceeding the inherited M90 successor ceiling of `616000` by 1965 bytes.

## Root cause and measured evidence
M90 established `616000` as a narrow milestone-governed successor threshold rather than a permanent global maximum. M91 adds the Dialog, Drawer, Overlay & Feedback successor presentation layer: drawer and confirmation compositions, persistent notification-stack presentation, overlay hierarchy styling, responsive bottom-sheet adaptation, forced-colors support, and reduced-motion handling while preserving M63 accessibility, M66 overlay/focus/Escape authority, M67 feedback/toast semantics, M80 shared primitives, and product-owned feature state/mutations.

The first clean M91 production build completed successfully with 5049 transformed modules and measured 617965 raw initial CSS bytes. Static verification, full UI verification, ESLint, TypeScript, and the production build passed before the inherited M90 threshold failed closed. The measured increase from M90 (615057) is 2908 bytes and corresponds to the scoped M91 overlay/feedback presentation and accessibility layer.

## Governed successor decision
M91 successor CSS ceiling: `619000`

The 619000-byte ceiling provides 1035 bytes of deterministic headroom above the measured 617965-byte M91 production build. This is a narrow milestone-governed successor threshold, not a permanent global maximum. Historical M31/M79/M82/M83/M84/M88/M89/M90 values remain provenance and are not rewritten. Future milestones must continue the same measured successor-governance model when legitimate required presentation growth is demonstrated.

## Invariants
- The M31 production performance gate remains fail-closed; no bypass is introduced.
- Required M91 drawer, confirmation, notification, responsive, focus-visible, forced-colors, and reduced-motion presentation must not be removed or semantically compromised solely to satisfy the historical M90 ceiling.
- M63 accessibility, M66 overlay/focus/Escape hierarchy, M67 feedback/toast semantics, M80 shared primitive behavior, M81 shell overlay ownership, and product feature state/mutations remain unchanged.
- All non-CSS performance budgets remain unchanged.
- A clean production build remains the authoritative measurement and must pass `performance:bundle` under the M91 successor ceiling.
- This governance update does not certify M91; the complete ordered certification pipeline must pass before publication.
