# Backend Boundary

Canonical production paths:

- `supabase/functions/` — trusted Edge Function/server-only execution.
- `supabase/migrations/` — ordered database migrations.
- `supabase/schema.sql` — consolidated schema authority/snapshot.
- `supabase/tests/` — database/RLS certification tests.
- `supabase/config.toml` — local Supabase project configuration.

The backend owns persistent authorization enforcement through database/RLS/RPC/Edge Function contracts. Browser RBAC remains a presentation/interaction guard and is not a substitute for server authorization.
