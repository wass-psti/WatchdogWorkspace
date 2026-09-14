# Stage B M6 Browser Harness Verifier Hotfix

This corrective release fixes two certification-only defects discovered during real macOS Stage B certification.

## Corrected contracts

1. The M6 verifier now validates the browser harness through the same governed dispatcher architecture used by the public command:
   `browser-harness:check -> run-governed-toolchain.sh -> browser-harness:check:governed -> verify-browser-harness-bundle.mjs`.
2. The browser runtime IIFE validator no longer scans arbitrary emitted text for the words `import` or `export`. Vite/Rollup output metadata (`imports` and `dynamicImports`) is used instead, so comments and string literals cannot cause false ESM failures.
3. The generated browser runtime remains an isolated Vite `iife` build with `configFile: false`, no emitted external chunk dependencies, and the runtime readiness sentinel.

These changes do not weaken the browser integration boundary; they make the verifier test executable module structure instead of lexical text.
