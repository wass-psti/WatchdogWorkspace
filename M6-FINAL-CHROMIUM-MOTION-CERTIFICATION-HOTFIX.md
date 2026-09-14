# Stage B Milestone 6 — Final Chromium Motion Certification Hotfix

This final corrective pass closes the legacy v1.28 motion-design certification boundary without weakening or removing the historical release assertion.

## Correction

The real Chromium CDP release harness now explicitly validates that `assets/js/runtime/motion-design.ts` is part of the browser runtime bundle and proves, inside the launched Chromium process, that the runtime publishes:

- a valid `data-wm-motion` preference state (`full` or `reduced`),
- `data-wm-motion-ready="true"`, and
- the expected `WorkManagementMotion.version` contract (`1.30.0`).

The historical `verify-v1280-motion-design.mjs` assertion remains intact and now recognizes the current Chromium release harness as the executable motion-runtime gate.

## Certification requirement

Milestone 6 is complete only when `npm run stage-b:certify` passes and `npm run runtime-schemas:status` reports `active-certified`.
