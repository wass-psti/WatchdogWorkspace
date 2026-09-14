# Work Management Edge Functions architecture

Stage F Milestone 28 introduces the Work Management trusted server-execution boundary for operations that cannot safely execute in the GitHub Pages browser client.

## Authority

Architecture 36 adds:

- `src/platform/contracts/edge-functions.ts` — typed browser-facing function contract and allowlisted function names.
- `assets/js/platform/data/edge-function-client.ts` — authenticated invocation authority with normalized diagnostics/errors and bounded request timeout.
- `supabase/functions` — server-only Edge Function source root.
- `supabase/config.toml` — function-level JWT verification policy.

The browser may send only the user's access JWT and the public publishable key. Supabase secret/service credentials remain server-side environment values and must never be serialized into the SPA, backend config, build output, or logs.

## Production function: `admin-sync-auth-access`

The function is intentionally narrow. It synchronizes Work Management account status with Supabase Auth administrative ban state:

- `disabled` -> long-duration Auth ban;
- `active` -> lift Auth ban (`ban_duration: none`).

The request is accepted only when all of these checks pass:

1. Supabase's function gateway JWT verification is enabled.
2. The request contains a user bearer JWT.
3. The JWT resolves to a live Supabase Auth user.
4. The caller's current `profiles` row is `admin_general_manager` and `active`.
5. The request origin is on `WM_EDGE_ALLOWED_ORIGINS` when an Origin header is present.
6. The target user id and requested status satisfy the server contract.

Only after those checks does the function use the server-only Supabase secret credential to call the Auth Admin update-user endpoint. Modern `sb_secret_*` credentials are sent as API keys rather than incorrectly treated as bearer JWTs; legacy JWT-shaped service-role credentials remain compatible.

## Rollout boundary

M28 composes the typed Edge Function client into `PlatformServices`, but it does not automatically replace the certified user-management RPC path. The server function must first be deployed with the correct secrets and exact production origin allowlist. A later cutover may call `platformServices.edgeFunctions.invoke('admin-sync-auth-access', ...)` after the existing role/status mutation.

This preserves the certified M13/M27 client behavior while making the trusted server boundary available without exposing privileged credentials.

## JWT limitation

Supabase access JWTs are stateless. Banning a user prevents new sign-ins/refreshes, but an already-issued access token remains cryptographically valid until its expiry. Work Management therefore continues to use `profiles.status` plus RLS as the immediate application data-access denial authority. Sensitive Edge Functions must always perform live authorization checks rather than trusting stale client state.

## Deployment requirements

The target Supabase project must be linked through the Supabase CLI, then configure:

- `WM_SUPABASE_PUBLISHABLE_KEY`;
- `WM_SUPABASE_SECRET_KEY`;
- `WM_EDGE_ALLOWED_ORIGINS`.

Deploy `admin-sync-auth-access` with JWT verification enabled. Do not commit production secret values.
