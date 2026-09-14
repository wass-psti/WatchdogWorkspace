# Work Management — Stage F M29 Database/RLS Test Suite

M29 makes database authorization executable and regression-tested. The authoritative suite uses **pgTAP** files under `supabase/tests/database` and the pinned **Supabase CLI 2.117.0**.

## Safety boundary

The production database is never reset, linked, or mutated by M29 certification. The governed runner creates a disposable local Supabase project in a temporary work directory, starts its Docker-backed local services, bootstraps the database from the authoritative `supabase/schema.sql`, executes `supabase test db --local`, and removes only that M29 test stack afterward. The runner never uses `--linked`, `db reset --linked`, or a production database URL.

## Why the test harness uses the schema snapshot

The Work Management repository predates the current Supabase CLI migration naming convention: its historical migration files use semantic `v1.x.x-...sql` names rather than CLI timestamp prefixes. M29 therefore does **not** rename historical migration provenance or rely on `supabase db reset` to replay it. The disposable test stack disables migration/seed replay and loads `supabase/schema.sql`, which is the repository's authoritative current database definition. The M29 forward hardening SQL remains preserved under `supabase/migrations` for deployment/provenance review.

## Coverage

The suite verifies all 16 public RLS-enabled tables structurally and exercises behavioral positive/negative paths for anonymous/authenticated users, active/disabled accounts, platform administration safeguards, derived module roles, module-state ownership, Board owner/editor/viewer/non-member authorization, and Board Realtime topic access. Storage and Realtime managed schemas are structurally checked while Work Management authorization helpers are tested behaviorally. Every suite uses `BEGIN ... ROLLBACK`, so fixture rows do not survive a test file.

## Authorization hardening discovered by M29

The suite identified two direct-table mutation paths that could bypass already-established server safeguards. M29 therefore revokes authenticated direct `UPDATE` on `public.profiles` and direct `INSERT/UPDATE/DELETE` on `public.module_role_assignments`. `admin_set_user_access()` remains the profile role/status mutation authority, and `sync_module_roles()` remains the derived module-role authority. Anonymous execution of `is_platform_admin(uuid)` is also retired while authenticated execution remains available for RLS policy evaluation.

## Local execution

1. Start Docker Desktop (or another Docker-compatible runtime).
2. From the repository root, run `npm run database-rls:test:local`.

The runner uses a globally installed Supabase CLI only when it is exactly **2.117.0**; otherwise it resolves `supabase@2.117.0` through `npx`. It owns startup and cleanup of its isolated M29 test stack. Set `WM_M29_KEEP_LOCAL_STACK=1` only for diagnostics; normal certification always cleans it up.

## Corrective M29 authorization invariants

The Docker-backed first certification run exposed three real defects. Corrective M29 explicitly revokes `is_platform_admin(uuid)` from `anon`, uses POSIX whitespace normalization in `update_own_profile()`, and makes `work_board_access()` a total fail-closed boolean function. The Board suite directly asserts outsider denial for `view`, `edit`, `manage`, and unsupported access requirements.

The corrective suite also requires zero effective `anon` EXECUTE privileges across non-trigger `public` SECURITY DEFINER functions, matching the platform's authenticated-only database RPC model.
