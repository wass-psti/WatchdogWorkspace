# Stage B M6 Browser Harness Toolchain Dispatch Hotfix

## Defect

The public `browser-harness:check` script invoked the governed implementation directly. When the caller shell was on Node 24/npm 11, `dependencies:ensure:governed` correctly rejected the mismatched toolchain before the browser harness could run.

## Correction

`browser-harness:check` is now a public self-healing entry point and dispatches through `scripts/run-governed-toolchain.sh` before invoking `browser-harness:check:governed`.

The governed-toolchain regression verifier now requires both the public browser-harness dispatcher and its governed implementation, preventing recurrence.

## Contract

Users may run `npm run browser-harness:check` from a shell using a different Node/npm version. The command must transition to Node v22.16.0/npm 10.9.2 before dependency verification or browser-runtime bundling.
