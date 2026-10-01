# M97 Local Certification

Run the complete fail-closed pipeline with:

```bash
npm run workspace-regression:local-certify
```

The certifier enforces environment preparation → repository/source guard → dependency integrity → static verification → deterministic tests → three-engine browser/screenshot matrix → dedicated certification → post-certification state → historical regression/release gate → checksum/package hygiene → final checkpoint → certified publication and Downloads handoff.

## M97 v2 corrective — browser functional-preservation await synchronization

The first local M97 certification attempt reached the three-engine Playwright matrix and produced 24 passing tests plus one identical functional-preservation assertion failure in Chromium, Firefox, and WebKit. Root cause: the verifier compared the Promise returned by `locationHash(page)` directly with the expected hash string. The v2 corrective changes only the M97 test assertion to `expect(await locationHash(page)).toBe(...)`. No application, domain, backend, schema, migration, persistence, authorization, routing, or production runtime file is modified by this correction. Full fail-closed certification must be rerun; until then the authoritative state is IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS.

## M97 v3 corrective — historical protected-presentation successor synchronization

The subsequent full certification attempt passed the M97 browser matrix, screenshot evidence verification, dedicated certification, and post-certification validation, then failed closed at the aggregate historical regression gate because the M78 protected-presentation verifier did not yet authorize the legitimate M97 design-system successor file. The repository now adds a target-gated M97 authorization for only `src/design-system/workspace-wide-visual-regression-functional-preservation.ts`; all other M78 protected-presentation restrictions remain unchanged.

Re-run the complete pipeline from the repository root with the single command above. A valid certified artifact must not be accepted unless the run reaches the final success banner, publishes the M97 certified ZIP/PASS/checksum artifacts, and independently verifies the checksum in `~/Downloads`.

