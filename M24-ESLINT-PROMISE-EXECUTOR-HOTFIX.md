# Stage E M24 — ESLint Promise Executor Hotfix

## Trigger

Authoritative macOS certification reached the governed ESLint gate after passing RC integrity, M23 prerequisite verification, Architecture 32/M24 preflight, the exact ECharts lock graph, schema/module provenance, exact dependency installation, and the M24 execution verifier.

ESLint 10.9.1 reported one error in `scripts/verify-fueltrack-stabilization-execution.mjs`:

`no-promise-executor-return` at the `setImmediate` scheduling vector.

## Root cause

The verifier used a concise Promise executor:

```js
await new Promise(resolve => setImmediate(resolve));
```

`setImmediate()` returns an `Immediate` handle. A concise arrow executor therefore returns that value even though Promise executor return values are ignored, which violates the governed ESLint rule.

## Correction

The executor now uses a block body:

```js
await new Promise(resolve => { setImmediate(resolve); });
```

This preserves the asynchronous scheduling semantics while ensuring the executor itself returns `undefined`.

## Scope

This is a certification-verifier-only correction.

Unchanged from the prior M24 RC:

- FuelTrack+ production wm6 runtime
- FuelTrack+ stabilization runtime
- FuelTrack+ Analytics/ECharts TypeScript source
- Architecture 32 manifest
- package.json / package-lock dependency graph
- Supabase schema and migrations
- TimeTracker runtime
- TradeLink runtime

M24 remains `implementation-complete-pending-certification` until the corrected RC passes the authoritative Mac release workflow.
