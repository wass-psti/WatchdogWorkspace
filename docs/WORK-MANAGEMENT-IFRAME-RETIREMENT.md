# Stage E M26 — Iframe retirement governance

M26 changes module isolation from a platform-wide assumption into an explicit per-module presentation decision. The Work Management shell now supports two presentation modes:

- `same-origin-iframe` — retained compatibility isolation for full-document module runtimes;
- `native-host` — direct host mounting through a registered native adapter after every retirement gate passes.

## Retirement gates

A module may be changed to `native-host` only when all of the following are true:

1. a typed native mount/unmount contract exists;
2. DOM ownership is root-scoped and does not depend on the module owning `document`/`body`;
3. styles are scoped and cannot leak into or be overwritten by the Work Management shell;
4. module execution no longer depends on collision-prone page-global runtime state;
5. Work Management identity is consumed directly by the native adapter rather than iframe `postMessage` bootstrap;
6. normalized module data is consumed directly through host services rather than the iframe module-store bridge;
7. browser permissions used by the module are explicitly integrated into the host-native path;
8. disposal, refresh, BFCache, overlay and focus lifecycle behavior has parity with the isolated runtime;
9. native regression coverage demonstrates feature/RBAC/persistence/accessibility parity.

A full-document module must never be retired by injecting its HTML/CSS/classic scripts into the shell DOM. That would remove isolation without establishing native ownership.

## M26 decisions

No current embedded module satisfies all nine gates:

| Module | M26 decision | Primary evidence |
| --- | --- | --- |
| TimeTracker | retain iframe | full-document DOM/CSS/classic runtime; geolocation; no native mount/data/identity parity |
| FuelTrack+ | retain iframe | full-document DOM/CSS/classic runtime; clipboard integration; no native mount/data/identity parity |
| TradeLink | retain iframe | full-document DOM/CSS/classic runtime; clipboard integration; no native mount/data/identity parity |

The stabilized M23/M24/M25 runtimes remain the certified production authorities. M26 does not reverse those stabilization milestones.

## Hybrid host

`assets/js/runtime/module-presentation-host.ts` is the Architecture 34 route-level host. Retained modules delegate to the existing same-origin iframe host. Future native adapters register through `assets/js/features/modules/native-module-registry.ts`; a native mount is rejected unless the module definition is explicitly `retire-iframe`, has zero blockers, declares a matching native boundary, and the adapter consumes Work Management identity directly.

M26 adds no dependency and no Supabase migration.


## Final native-host hardening

- Future native adapters receive a module-scoped normalized-data port; they cannot select another module ID through the host service.
- Native mount failures publish the existing `module:error` lifecycle event and release presentation ownership with `module:disposed`.
