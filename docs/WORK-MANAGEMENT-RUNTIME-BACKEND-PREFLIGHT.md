# Stage G M38 — Runtime Configuration & Backend Capability Preflight

## Purpose
M38 prevents environment/configuration/backend drift from presenting as a blank or nonfunctional module. Account, Users, Settings, Boards, TimeTracker, FuelTrack+, and TradeLink are exposed only after their required backend capabilities are proven for the authenticated session.

## Environment contract
Public browser configuration is supplied by `VITE_RUNTIME_ENV`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`. Supported runtime environments are `local`, `development`, `ci`, and `production`. URL/key values are an atomic pair: M38 never combines one Vite-provided value with one checked-in fallback value. `config/backend-config.js` is intentionally unconfigured.

Production deployment must provide an HTTPS `*.supabase.co` URL plus a browser-safe publishable/anon key. `sb_secret_*` and service-role credentials remain forbidden in the browser.

## Backend capability authority
After Supabase Auth health and authenticated token availability are established, the client calls the non-destructive `public.wm_runtime_capabilities()` RPC. The function reports only capability names/availability. It does not mutate application data.

It verifies:
- required public tables;
- required RPC functions with `authenticated` EXECUTE privilege;
- private `work-board-files` Storage bucket;
- Realtime `messages` relation;
- Board receive and Presence tracking authorization policies;
- authenticated board-topic authorization function;
- all eight canonical Board change broadcast triggers plus `realtime.send`.

The client requires capability schema `1.43.2-m38-v2`; an older/newer incompatible report is blocked explicitly.

## Module-specific gating
A valid preflight report can expose modules whose requirements are complete while keeping an unrelated module gated. Example: an absent Board Storage bucket blocks Boards but does not block Account if Account's profile/RPC requirements are complete.

Explicit diagnostic codes include:
- `WM_BACKEND_CONFIG_MISSING`
- `WM_BACKEND_CONFIG_INCOMPLETE`
- `WM_BACKEND_CONFIG_INVALID`
- `WM_BACKEND_AUTH_HEALTH_FAILED`
- `WM_BACKEND_AUTH_REQUIRED`
- `WM_BACKEND_AUTH_TOKEN_UNAVAILABLE`
- `WM_BACKEND_PREFLIGHT_CONTRACT_MISSING`
- `WM_BACKEND_PREFLIGHT_AUTHORIZATION_FAILED`
- `WM_BACKEND_CAPABILITY_SCHEMA_MISMATCH`
- `WM_BACKEND_CAPABILITY_MISMATCH`
- `WM_BACKEND_PREFLIGHT_UNAVAILABLE`

The route shows an M38 diagnostic surface with runtime environment, configuration source, project host, diagnostic code, missing module capabilities, and an explicit retry control. Dependent module content is not rendered until that module is ready.

## Verification
`npm run backend-preflight:config` validates environment syntax and optional public configuration.
`npm run backend-preflight:check` verifies source/database/governance integration.
`npm run backend-preflight:test` executes deterministic fail-closed vectors.
`npm run backend-preflight:browser` verifies ready, missing-capability, schema-mismatch, and missing-contract browser behavior.

For production configuration validation:

```bash
VITE_RUNTIME_ENV=production VITE_SUPABASE_URL="https://PROJECT.supabase.co" VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..." npm run backend-preflight:config:production
```

## Boundaries after M38
M38 does not claim that the M37-characterized route/presentation defects are repaired. M39+ owns auth/session/access-context stabilization and subsequent Account/Users/Settings/Boards recovery. M26 embedded iframe islands, M28 protected RPC authority, M30 bounded-CDP parity, and M34 external backup/PITR controls remain retained boundaries.
