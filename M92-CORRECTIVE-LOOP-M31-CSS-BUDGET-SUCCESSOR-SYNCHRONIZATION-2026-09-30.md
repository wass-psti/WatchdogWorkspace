# M92 Corrective Loop — M31 CSS Budget Successor Synchronization

## Origin
The M92 dedicated certification reached `release:check` and failed in the historical M31 performance verifier at the `corrective budget ceilings` assertion.

## Exact condition
The current production bundle measured `initialCssRawBytes = 619218` and passed the active bundle budget configured at `621000`, but `verify-stage-f-m31-performance-engineering.mjs` still resolved the newest authority only through M91 (`619000`).

## Root cause
Historical-verifier successor synchronization defect. M92 legitimately raised the adaptive CSS ceiling to `621000`, but historical verifiers that interpret the active CSS budget had not all been updated to recognize the M92 authority.

## Corrective delta
- Add a dedicated M92 adaptive CSS authority document.
- Synchronize M31 and all Stage-I historical verifiers that compute the active CSS ceiling so M92 (`621000`) is preferred when its authority is present.
- Preserve each predecessor milestone's own measured evidence and original ceiling checks.
- Extend the M92 source guard allowed-mutation manifest only for the verifier files required by this successor synchronization.

## Exit criterion
The full fail-closed M92 certification must pass static checks, deterministic tests, browser/E2E, dedicated certification, historical regression, package hygiene, final checkpoint, and certified publication.

## Subsequent packaging correction
A later certification run exposed that the v4 canonical ZIP did not contain the intended M92 browser-harness Promise-executor correction: `const delay=ms=>new Promise(r=>setTimeout(r,ms));` remained present. The source-state handoff was therefore stale relative to the prior corrective analysis. The canonical successor tree now changes this to `const delay=ms=>new Promise(r=>{setTimeout(r,ms);});`, eliminating the implicit timer-handle return while preserving timing behavior. This packaging/source-state mismatch requires a new RC and a full certification restart.
