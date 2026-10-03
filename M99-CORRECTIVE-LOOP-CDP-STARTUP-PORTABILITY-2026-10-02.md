# M99 Corrective Loop — Hosted CDP Startup Portability

## Origin
Stage I M99 v11 hosted post-publication validation.

## Failed gate
Service Worker Update Strategy #49 — `Verify production preview`.

## Reproduction
The gate failed on the original hosted attempt and again on rerun attempt 2 after all preceding M33, lint, typecheck, build, and service-worker artifact gates passed.

## Root-cause classification
Implementation / verification-harness portability.

## Corrective delta
- Default bounded DevTools process/endpoint startup budget increased to 45 seconds.
- Page-target acquisition receives its own bounded 10-second window after the endpoint becomes reachable.
- `/json/list` discovery and `/json/new?about%3Ablank` fallback are preserved.
- Browser failures remain fail-closed.
- Endpoint-startup and page-target-startup timeout diagnostics are distinct.
- Dedicated regression verification is added.
- The Service Worker Update Strategy production-preview gate remains mandatory.

## Exit criterion
Full local certification must pass, then the exact certified successor must be published and the complete required hosted matrix must complete successfully.


## 2026-10-03 — Certification-order successor v13
Local v12 certification proved the CDP correction effective: both the direct CDP vector and production preview passed. The browser/E2E stage then failed because `verify:preview` invoked `dependencies:ensure`, which restored the exact application lockfile tree and removed the isolated Playwright toolchain created earlier by the modern-test bootstrap. The certification harness now explicitly runs `npm run modern-tests:toolchain:ensure` immediately after every `verify:preview` that precedes Playwright-backed M99/M43 browser gates. This preserves exact application dependency restoration while deterministically re-materializing only the governed test-only toolchain.
