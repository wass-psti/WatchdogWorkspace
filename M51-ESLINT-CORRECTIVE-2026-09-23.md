# M51 ESLint Corrective — 2026-09-23

## Originating failure

Local fail-closed verification of Continuation Candidate 02 reached the ESLint gate and failed in `scripts/verify-stage-g-m51-execution.mjs` with seven `no-promise-executor-return` violations at lines 104, 110, 117, 121, 129, 137, and 141.

## Root cause

The M51 execution verifier used compact Promise executors of the form:

```js
new Promise((resolve)=>setTimeout(resolve,0))
```

The concise arrow body returns the value of `setTimeout(...)`. ESLint rule `no-promise-executor-return` correctly rejects returning a value from a Promise executor because the return value is ignored and signals an invalid executor contract.

## Corrective implementation

All seven instances now use block-bodied executors:

```js
new Promise((resolve)=>{setTimeout(resolve,0);})
```

This preserves the asynchronous scheduling semantics while making the executor return `undefined`.

## Verification performed in the implementation environment

- `node --check scripts/verify-stage-g-m51-execution.mjs` — PASS
- Targeted scan for `new Promise((resolve)=>setTimeout` in M51/Boards verification surfaces — no remaining matches
- `npm run boards-realtime-concurrency:check` — PASS
- `npm run boards-realtime-concurrency:test` — PASS

Full ESLint execution could not be completed in this environment because the container dependency materialization is incomplete and `eslint` is not locally available. The user's macOS Candidate 02 run already demonstrated that exact dependency installation succeeds there, so Candidate 03 must rerun the fail-closed local sequence from ESLint forward.

## State transition

The Candidate 02 source defect is corrected. No additional source defect is currently identified by the deterministic M51 verification suite. Local static/build/database/browser/release/historical/certification gates remain required before M51 may be marked fully complete.
