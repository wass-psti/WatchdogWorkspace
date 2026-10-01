# M97 Implementation Report

## Milestone
Workspace-Wide Visual Regression & Functional Preservation.

## M96 prerequisite
- Certified ZIP SHA-256: `300d769769b27353cd08cf9e83ce2e96ab39ccb50c5e4940e0fb79ddee4701d2`
- Certified source SHA-256: `26d0d6e9950fbe71d45d1df244ad56975b4f3092354212fd66af70b7bc82062a`

## Implemented
- Fail-closed M97→M96 source guard.
- M96 predecessor source-guard delegation to M97 successor authority.
- Chromium/Firefox/WebKit × mobile/tablet/laptop/desktop workspace matrix.
- Authenticated host-route visual contracts: Account, Settings, Users, Boards.
- Embedded-module visual contracts: TimeTracker, FuelTrack+, TradeLink.
- 84 required screenshot evidence captures with SHA-256 manifest.
- Functional-preservation assertions and mandatory reuse of existing functional regression, cross-module RBAC, and module stabilization gates.
- Dedicated certification, post-certification, historical regression, package hygiene, final checkpoint, artifact publication, and Downloads handoff wiring.

## Explicit non-mutation boundary
M97 does not authorize application/runtime/domain/backend/schema/migration/persistence/RBAC/route/visual-feature mutations. The source guard restricts repository mutations to M97 governance/test/certification additions, `package.json` script wiring, and M96 predecessor-guard successor delegation.

## Execution boundary
The current execution environment could not complete `npm ci` within its transport window. No browser or screenshot runtime claim is made here. Local certification remains required.

## M97 v2 corrective — browser functional-preservation await synchronization

The first local M97 certification attempt reached the three-engine Playwright matrix and produced 24 passing tests plus one identical functional-preservation assertion failure in Chromium, Firefox, and WebKit. Root cause: the verifier compared the Promise returned by `locationHash(page)` directly with the expected hash string. The v2 corrective changes only the M97 test assertion to `expect(await locationHash(page)).toBe(...)`. No application, domain, backend, schema, migration, persistence, authorization, routing, or production runtime file is modified by this correction. Full fail-closed certification must be rerun; until then the authoritative state is IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS.

## Corrective implementation — historical successor authorization

The first full local certification attempt passed the M97 browser matrix, screenshot evidence verification, dedicated certification, and post-certification state validation, then failed closed in the historical M78 protected-presentation verifier. The M78 verifier contained explicit successor authorization through M96 but no M97 branch. The corrective implementation adds an M97 target-gated allowlist containing only `src/design-system/workspace-wide-visual-regression-functional-preservation.ts` and records the verifier mutation in the M97→M96 source-guard manifest. This preserves the historical baseline and does not authorize unrelated visual drift.

