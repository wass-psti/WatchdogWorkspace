# M15 Historical Verifier Synchronization Hotfix

## Scope

This hotfix corrects historical architecture verifiers that still required the pre-M15 exact `BOARDS_FEATURE.architecture` metadata string after Stage D M15 intentionally changed route-level presentation ownership to the React Board presentation facade.

## Corrected verifiers

- `verify-v1250-architecture-phase4.mjs`
- `verify-v1260-architecture-phase5.mjs`
- `verify-v1270-domain-browser-quality.mjs`

## Preserved guarantees

The historical verifiers still require the original typed Board controller/service/view/workflow/interaction-controller boundaries. They now also accept the M15 architecture declaration only when all of the following are present:

- `architecture: 'react-route-facade-with-typed-compatibility-board-engine'`
- `presentation: 'react-board-presentation-facade-v1'`
- `presentationEngine: 'assets/js/boards-ui.ts'`
- `createBoardsController`
- `createBoardCommandService`

This prevents verifier weakening: the newer M15 facade is accepted only when it is demonstrably layered over the mature typed compatibility engine and command/controller authorities that the historical milestones established.

## No functional changes

No Board runtime behavior, persistence, RBAC, TanStack Query ownership, Supabase authority, schema, migration, or UI behavior is changed by this hotfix.

## Recurrence prevention

`verify-stage-d-m15-react-board-presentation-facade.mjs` now explicitly verifies that all three historical Board architecture verifiers recognize both the preserved pre-M15 guarantee and the M15 React facade metadata. Because `board-presentation:check` runs during M15 preflight, this verifier-drift class will fail before the full release gate rather than late inside aggregate verification.
