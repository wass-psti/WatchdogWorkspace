# M40 Historical Same-URL Guard Synchronization

Two historical verifiers encoded the superseded hash-only deferred shell guard introduced before M40 lifecycle generations. The M40 same-URL corrective replaces that contract with a stronger route + lifecycle revision + owner guard.

- `verify-stage-g-m39-auth-session-access-context.mjs` now requires all deferred shell callbacks to use `ShellFrameOwnershipToken` and validates revision and owner matching.
- `verify-ui-stability-v1176.mjs` now recognizes the route key captured by `captureShellFrameOwnership()` while preserving its route-scoped motion requirement.

No historical behavioral requirement was removed. Both assertions were tightened to the current Architecture 48 lifecycle authority.
