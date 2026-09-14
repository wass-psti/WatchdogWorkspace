# Stage B M6 Browser ESM Harness Hotfix

## Failure corrected

During the M6 release gate, the browser integration harness failed with:

`SyntaxError: Cannot use import statement outside a module`

The application and M6 runtime schema code had already passed strict TypeScript, ESLint,
runtime-schema execution vectors, Vite build, dist validation, and preview smoke. The failure
was isolated to the CDP test harness, which historically removed import declarations and then
evaluated TypeScript modules as classic scripts.

M6 legitimately introduces runtime imports for the Work Management schema authority. Stripping
those imports is no longer semantically valid because the imported schema values are required at
runtime.

## Corrective architecture

The browser integration harness now builds `tests/browser/runtime-globals-entry.ts` through Vite
as a self-contained IIFE before CDP evaluation. This means:

- the real ES-module dependency graph is followed;
- Zod is bundled through the same governed dependency graph;
- runtime-schema imports remain executable rather than being deleted;
- CDP still receives one deterministic classic-script payload for the existing integration tests;
- the emitted browser-test runtime is rejected if ESM import/export syntax remains;
- a readiness sentinel proves the runtime global boundary initialized before test execution.

A dedicated `browser-harness:check` gate builds this bundle before the long release/browser suite,
so module-resolution or export regressions fail early.

## Compatibility

The production application bundle is unchanged by this test-harness correction. The change is
limited to the release/integration verification path plus formatting of the M6 route-controller
imports. M4 and M5 remain active-certified, and M6 remains pending release certification until the
full dependency-backed release gate passes.

## Follow-up verifier correction

The original lexical post-build check for the words `import`/`export` was subsequently replaced because valid IIFE output can contain those words in strings or comments. The current verifier uses Vite/Rollup chunk dependency metadata to prove that no external static or dynamic chunks remain. See `M6-BROWSER-HARNESS-VERIFIER-HOTFIX.md`.
