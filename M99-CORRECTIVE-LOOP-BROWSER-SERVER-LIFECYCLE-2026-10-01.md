# M99 Corrective Loop — Browser Server Lifecycle

## Origin

The corrected M99 v2 local certification progressed through environment preparation, repository validation, dependency integrity, static/type/lint/build verification, deterministic modern tests, and the complete `verify:ui` chain. Stage 6 then failed before either M99 sidebar assertion could execute because Playwright navigated to `http://127.0.0.1:5173/#/` while no application server was listening.

## Failure condition

Both M99 Playwright tests failed at the bootstrap `page.goto('/#/')` call with `net::ERR_CONNECTION_REFUSED`.

## Root-cause classification

Verification/certification harness implementation. The M99 Playwright command assumed an externally running Vite server, violating deterministic self-contained certification.

## Corrective delta

- Added `scripts/run-stage-i-m99-sidebar-browser.mjs`.
- The runner validates that the governed Playwright toolchain is available.
- It starts the repository-owned Vite executable on `127.0.0.1:5173` with `--strictPort`.
- It polls the exact browser base URL until the server is reachable or fails closed after a bounded timeout.
- It executes only the M99 Playwright specification with `WM_PLAYWRIGHT_BASE_URL` bound to the managed server.
- It terminates the Vite process in a `finally` block on PASS or failure, with bounded SIGTERM-to-SIGKILL cleanup.
- `test:m99:sidebar` now invokes the managed runner, so both Stage 6 and final checkpoint browser execution are self-hosting.

## Exit criterion

Restart the entire ordered local certification pipeline from Stage 1 against the corrected v3 repository state and obtain PASS through all 11 required stages, including creation and verification of the final certified ZIP, checksum companion, and PASS record.
