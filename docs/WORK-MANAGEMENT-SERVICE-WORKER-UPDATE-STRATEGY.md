# Work Management Service Worker / Update Strategy — Stage F M33

M33 replaces the legacy single-cache service worker behavior with an explicit, build-scoped update strategy suitable for GitHub Pages deployment.

## Authority

- `service-worker.js` owns fetch/cache/activation behavior.
- `config/runtime-assets.js` carries the build-generated runtime asset list and deterministic release metadata.
- `scripts/lib/service-worker-build-manifest.mjs` is the dependency-free deterministic build-id/release-manifest authority consumed by Vite.
- `assets/js/platform/update/service-worker-update.ts` owns browser registration, throttled update checks, explicit activation, and multi-tab convergence.
- `scripts/verify-service-worker-update-execution.mjs` executes the actual service-worker source against a bounded in-memory browser/cache harness.

## Update lifecycle

A newly discovered worker is allowed to enter the normal waiting state. M33 never calls `skipWaiting()` during installation. The existing shared update banner remains the user-facing activation surface. Selecting **Update now** posts `WM_ACTIVATE_UPDATE` to the waiting worker. The worker also accepts the historical `SKIP_WAITING` message for one migration cycle so an already-running M32 page can activate M33.

Registration uses `updateViaCache: 'none'` so the service worker script and its imported build manifest are not allowed to remain stale behind the HTTP cache. Update checks are additionally requested when a controlled page returns to the foreground or regains connectivity, with a five-minute in-memory throttle.

## Cache identity and cleanup

Vite generates a deterministic build id from the strategy revision and emitted runtime asset paths. The active shell cache is therefore build-scoped instead of using one permanent `work-management-v1.43.2` cache. Activation deletes other Work Management v1.43.2 caches only after the new precache installation succeeds.

Every fetch strategy reads from the current build cache rather than global `caches.match()`, preventing an obsolete cache from satisfying a current-build request.

## Fetch policies

- Credential-bearing/sensitive GETs: network-only with `cache: 'no-store'`.
- Embedded application requests under `/apps/`: network-authoritative with `cache: 'no-store'`; offline returns explicit HTTP 503.
- Navigations: network-first with best-effort Navigation Preload; query-bearing navigations are not cached; offline host fallback is the current build `index.html`.
- Hashed `/build/` assets: current-build cache-first.
- Mutable shared compatibility runtimes: network-first with current-build cache fallback.
- Other static same-origin assets: current-build cache-first with bounded opportunistic fill.

## Multi-tab convergence

`clients.claim()` remains enabled after an explicitly activated replacement worker. Every controlled host tab listens for `controllerchange`; when a page already had a controller, that event triggers one reload. First installation does not reload. This prevents long-lived old and new shell bundles from coexisting after an accepted update.

## Compatibility boundaries

1. The legacy `SKIP_WAITING` message remains accepted for one migration cycle only.
2. Embedded business applications remain network-authoritative compatibility islands from M26.
3. Update activation can reload other controlled tabs. M33 therefore keeps activation explicit rather than automatic.

M33 adds no dependency, database migration, schema change, or telemetry vendor requirement.
