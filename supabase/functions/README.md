# Work Management Edge Functions

Stage F M28 introduces a governed Edge Function boundary for operations that require trusted server execution.

## `admin-sync-auth-access`

Authenticated Admin/General Manager callers can synchronize a Work Management profile status with the corresponding Supabase Auth ban state. The browser sends only its user JWT and public project key. Server credentials are read only inside the Edge Function.

Required deployment secrets/configuration:

- `WM_SUPABASE_PUBLISHABLE_KEY` — the project's public publishable key used for caller verification.
- `WM_SUPABASE_SECRET_KEY` — a Supabase secret/service credential used only by the function for Auth Admin operations.
- `WM_EDGE_ALLOWED_ORIGINS` — comma-separated exact browser origins allowed to invoke the function.

The function also supports provider-supplied `SUPABASE_PUBLISHABLE_KEYS` / `SUPABASE_SECRET_KEYS` only when each dictionary resolves to exactly one key, plus the legacy `SUPABASE_SERVICE_ROLE_KEY` fallback. Explicit `WM_*` values are recommended for deterministic production selection. None of those values may appear in browser configuration.

The existing `profiles.status` plus RLS policy remains the immediate Work Management data-access authority. Auth ban synchronization prevents subsequent successful sign-in/refresh while a user is disabled, but already-issued stateless access JWTs remain valid until expiry. Sensitive server operations must continue to check live authorization state.
