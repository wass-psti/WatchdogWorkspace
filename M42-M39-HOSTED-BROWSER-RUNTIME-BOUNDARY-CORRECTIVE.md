# M42 corrective action 2 — M39 hosted browser runtime boundary

## Hosted trigger

GitHub-hosted diagnostic revision `49d29c460015cb86db8ec168079e84a1cc21bc8c` reproduced four M39 browser failures after all static/deterministic authentication checks had passed:

- `@m39-admin-restore` and `@m39-employee-authorization` returned `undefined` from the second `identity.current` read after the readiness wait had already observed a hydrated identity;
- `@m39-refresh` observed zero refresh calls because the test proceeded before a coherent hosted runtime/identity boundary was consumed; and
- `@m39-account-status` attempted `WorkManagementRuntime.execute` after the global runtime authority was no longer present in that evaluation context.

The common failure shape proves a browser-harness TOCTOU boundary: readiness was established in one page evaluation and the authoritative value or command was consumed in a later evaluation. During hosted Vite/Playwright startup the main document can be replaced while boot ownership is still settling. A successful readiness evaluation therefore did not guarantee that the next evaluation belonged to the same document/runtime authority.

## Correction

The M39 browser fixture now centralizes hosted runtime access through `retryM39RuntimeBoundary`:

- `waitForM39Identity` obtains and validates the persisted identity and `identity.current` snapshot inside the same page evaluation;
- `waitForM39BackendPreflight` obtains capability readiness through the same atomic boundary;
- `executeM39Runtime` performs the idempotent `identity.revalidate` command in the same evaluation that proves `WorkManagementRuntime.execute` exists; and
- execution-context replacement or temporary runtime absence is retried against the current main document instead of allowing a stale readiness result to escape; non-navigation runtime/backend errors remain terminal and are surfaced immediately rather than being mislabeled as readiness noise.

The correction does not add arbitrary multi-second sleeps, weaken authentication/RBAC assertions, modify production authorization policy, or bypass M38/M40 ownership gates. It fixes the certification harness boundary only.

## Deterministic regression

`scripts/verify-m39-browser-runtime-boundary.mjs` proves that:

1. an execution-context replacement is retried;
2. identity readiness and identity value consumption cannot be split by `waitForFunction` plus a second read;
3. backend capability readiness is consumed through the same boundary; and
4. idempotent identity revalidation waits for executable runtime authority; and
5. non-navigation runtime errors fail immediately and are never retried as document-replacement noise.

The regression is part of `auth-stabilization:test`, so M39/M42 release checks cannot silently regress to the prior split-boundary behavior.

## Certification state

This corrective requires GitHub-hosted browser revalidation because the original defect was only reproduced on the hosted Vite/Playwright lifecycle. Until that run passes all six M39 scenarios, M42 remains `implementation-complete-pending-certification` and no certified ZIP/PASS record is authorized.

## Local verification completed

The corrected source state passed all locally executable gates relevant to this corrective:

- M39 static contract: **53/53 PASS**.
- Hosted runtime-boundary deterministic regression: **6/6 PASS**.
- M42 static contract: **148/148 PASS**.
- M42 Users/RBAC deterministic execution: **31/31 PASS**.
- M42 finalizer/activation/clean-dependency/governed-toolchain/certifier/package/workflow regressions: **PASS**.
- Stage A security baseline: **PASS**.
- Full UI verifier chain: **PASS**.
- High-confidence secret scan: **PASS**.
- Historical collect-all: **136/152 PASS** with M39 and M42 static verifiers both PASS; the same 16 dependency-execution verifiers remain unavailable without the exact installed application dependencies.

A real M39 Playwright run is intentionally not claimed from this sandbox because the complete npm dependency graph cannot be materialized here. The required acceptance proof is the GitHub-hosted `Stage G M39 Auth Session Access Context` run against the new pushed revision. It must pass all six scenarios before the final M42 certification workflow is authorized.
