# Work Management App v1.43.2 — Stage I M97

**Milestone:** Workspace-Wide Visual Regression & Functional Preservation  
**State:** active-certified  
**Continuation:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE

M97 adds certification-only visual-regression and functional-preservation proof over the immutable M96 certified application baseline. Three browser engines, four viewport classes, seven workspace surfaces, screenshot evidence, functional regression, RBAC preservation, module stabilization, historical regression, artifact integrity, and final publication are fail-closed requirements.

## M97 v2 corrective — browser functional-preservation await synchronization

The first local M97 certification attempt reached the three-engine Playwright matrix and produced 24 passing tests plus one identical functional-preservation assertion failure in Chromium, Firefox, and WebKit. Root cause: the verifier compared the Promise returned by `locationHash(page)` directly with the expected hash string. The v2 corrective changes only the M97 test assertion to `expect(await locationHash(page)).toBe(...)`. No application, domain, backend, schema, migration, persistence, authorization, routing, or production runtime file is modified by this correction. Full fail-closed certification must be rerun; until then the authoritative state is IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS.
