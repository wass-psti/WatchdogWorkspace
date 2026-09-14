# M20 corrective hotfix — M12 dev-browser bounded CDP verifier

## Scope

This corrective work changes the release-verification harness only. It does not change Board Realtime, Supabase authentication behavior, Board state authority, virtualization, drag-and-drop, or application UI behavior.

## Failure observed during M20 certification

The historical `scripts/verify-vite-server.mjs` launched Chromium with `--dump-dom` and awaited the child-process `close` event without a real wall-clock timeout. `--virtual-time-budget` controls page virtual time; it is not a process deadline. A wedged Chromium process could therefore stall `verify:dev` indefinitely. The browser-profile hotfix also left cleanup ownership structurally fragile.

## Corrective architecture

The Vite smoke now uses the bounded CDP driver in `scripts/lib/browser-cdp-smoke.mjs`. The driver:

- allocates a dedicated loopback DevTools port;
- creates a unique temporary Chromium profile for each smoke;
- connects through the Chrome DevTools Protocol;
- uses `Page.navigate` and `Runtime.evaluate` to observe the actual rendered DOM;
- polls for the required terminal DOM condition instead of taking one arbitrary serialized snapshot;
- enforces a real wall-clock timeout;
- requests `Browser.close`, then escalates to `SIGTERM` / `SIGKILL` if necessary;
- removes the temporary profile deterministically; and
- bypasses ambient proxy state for browser-smoke isolation.

The dev Vite process is also started with empty `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` values so the historical M12 login smoke validates a deterministic anonymous/setup-required route instead of depending on a developer machine's live Supabase session or network state. This is a verifier-only deterministic anonymous boundary.

## Executable regression proof

`scripts/verify-vite-browser-cdp-execution.mjs` exercises the driver against real Chromium without application dependencies. It proves both successful DOM-settle detection and rejection/cleanup of a never-ready page under a bounded wall-clock timeout.

## Compatibility boundary

Production runtime behavior is unchanged. The correction is confined to certification tooling and historical M12 browser-contract determinism.
