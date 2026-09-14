# Work Management Performance Engineering — Stage F M31

M31 establishes measured performance governance. It adds deterministic production bundle budgets, warmup+p95 microbenchmarks for Board column virtualization and route-policy decisions, and startup Performance API marks. The Board column planner now computes normalized widths plus prefix sums in one pass and reuses those offsets instead of repeated slice/reduce passes. Route-policy decisions reuse immutable canonical results instead of allocating new frozen objects per decision.

The benchmark runner imports the authoritative TypeScript hot-path modules directly. Under the governed Node 22.16.0 runtime it therefore executes through Node's `--experimental-strip-types` path. This keeps benchmark measurements tied to the actual TypeScript source without adding a separate `tsx`/loader dependency or changing the M29-certified application lockfile. `verify-stage-f-m31-performance-engineering.mjs` enforces the exact governed launch contract.

Performance work does not change business rules. M29 pgTAP, M30 Vitest/coverage/Playwright, bounded-CDP parity, and embedded-module verifiers remain independent certification authorities.


## Corrective production bundle measurement

Production bundle governance is manifest-based. `initial` means the `index.html` Vite entry plus its recursive **static** `imports`; dynamic imports and secondary runtime entries are excluded from the initial-route measurement and are governed separately by total-manifest-JS and largest-any-JS-chunk ceilings. Whole `dist` bytes remain a separate deploy-output budget.

The first Mac production build exposed a stable ~1.246 MB `platform` chunk. Source inspection showed that FuelTrack analytics imported the complete ECharts package while the manual platform group recursively captured dependencies without entry awareness. The correction uses ECharts' tree-shakeable core with only BarChart, Grid, Tooltip, and CanvasRenderer, introduces an entry-aware ECharts/zrender vendor group, and makes the platform group entry-aware. The release ceiling for the largest emitted JS chunk is 600,000 raw bytes, so the previous 1.246 MB structure cannot pass unchanged. Initial CSS is capped at 590,000 raw bytes, anchored to the observed 566,180-byte certified-baseline-era artifact with modest regression headroom.
