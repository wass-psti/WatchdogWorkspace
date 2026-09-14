# Stage F M31 — Performance Engineering
State: implementation-complete-pending-certification
Architecture: 39
Prerequisite: M30 active-certified
Scope: measured budgets, startup instrumentation, Board virtualization hot-path optimization, route-policy allocation reduction, CI/release performance gates.
Corrective status: the first Mac certification run exposed a benchmark launcher mismatch (`ERR_UNKNOWN_FILE_EXTENSION` for authoritative `.ts` hot paths). The governed benchmark now uses Node 22.16.0 `--experimental-strip-types`; static verification rejects removal of that execution contract. Full release certification remains required before `active-certified`.

Budget-corrective status: the subsequent Mac run proved the benchmark, modern tests, coverage, Playwright, lint, TypeScript, M29 pgTAP, bounded-CDP, dev verification, and production build, then exposed an invalid URL/path implementation in the bundle verifier. The same build showed the original budget semantics were incorrect: all emitted assets were being treated as `initial`, and a stable ~1.246 MB platform chunk was present. This revision replaces that layer with Vite-manifest entry-closure measurement, adds fixture-level verifier coverage, tree-shakes FuelTrack ECharts, and adds entry-aware analytics/platform splitting. Full release certification remains required before `active-certified`.
