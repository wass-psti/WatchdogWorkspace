# M54 Hosted M45/M49/M50 CI Harness Corrective — 2026-09-25

## Scope

Corrects three hosted-only certification failures observed after Candidate 06 was published to `main` at `0fd2d74e24e79b72464898fdf6838723be1aa846`.

## Corrections

- M45 collection browser verification now polls for the asynchronous `wm_duplicate_board` RPC observation before asserting exact call count.
- M49 structure keyboard verification explicitly waits for drag-handle focus, dispatches `Home` through the focused locator, and uses a bounded 10-second RPC observation window for group and column moves.
- M50 finalizer fail-closed verification now reconstructs the historical pending certification state inside its isolated fixture before exercising finalization failure paths, while preserving the separate active-certified staged static-verifier check.

No production runtime, database schema, RLS policy, module authorization, or certified `v1.43.2-m54` release-tag semantics are changed.
