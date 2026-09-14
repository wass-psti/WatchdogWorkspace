# M21 Historical Board Architecture Verifier Synchronization Hotfix

## Scope

Milestone 21 refines the Boards feature metadata from the M15 compatibility marker
`react-route-facade-with-typed-compatibility-board-engine` to
`react-route-facade-with-typed-rich-item-workspace-v1` while preserving the certified
M15 React facade, `assets/js/boards-ui.ts` presentation engine, Boards controller,
command service, workflow controllers, and interaction extraction boundaries.

The historical v1.25 Phase Four, v1.26 Phase Five, and v1.27 domain/browser-quality
verifiers previously accepted only the exact M15 metadata string. That implementation-
shape assertion became stale once M21 layered the Rich Item Workspace over the same
certified Board engine.

## Correction

The historical verifiers now accept either:

- the original M15 typed compatibility metadata, or
- the M21 typed Rich Item Workspace refinement,

while continuing to require the same React facade, compatibility presentation engine,
Boards controller, Board command service, and pre-M15 architecture fallback guarantees.

M15 governance now requires those historical verifiers to retain both old compatibility
markers and recognize the M21 refinement. M21 governance independently asserts the same
historical synchronization.

## Runtime impact

None. This hotfix changes certification assertions only. Board persistence, Realtime,
Item Workspace behavior, Supabase contracts, dependencies, and runtime composition are
unchanged.
