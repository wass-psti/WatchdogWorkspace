# M29 Database/RLS Hardening Provenance

Original migration: `supabase/migrations/v1.43.2-stage-f-m29-database-rls-hardening.sql`
Corrective migration: `supabase/migrations/v1.43.2-stage-f-m29-database-rls-corrective.sql`

The original M29 migration is preserved byte-for-byte from the failed RC. It closes direct authenticated `profiles` UPDATE and `module_role_assignments` INSERT/UPDATE/DELETE bypasses and removes the legacy mutation policies.

The first real Docker-backed certification run then exposed three additional defects. The corrective migration:
- revokes EXECUTE on all existing `public` functions from `anon` and PUBLIC, and pins matching default privileges for future functions;
- retains the authenticated `is_platform_admin(uuid)` grant required by the Work Management authorization model;
- normalizes display names with the POSIX `[[:space:]]+` class;
- makes `work_board_access()` total and fail closed for missing membership and unknown requirements.

No production data rewrite is performed. Profile role/status changes continue through `admin_set_user_access()`, preserving bootstrap-admin, self-disable, last-admin, validation, and derived module-role synchronization safeguards.

## Migration-history compatibility

The repository's migration archive predates the current Supabase timestamp filename convention. M29 preserves that history unchanged. The local certification harness does not invoke `db reset` or `db push` over this directory; it bootstraps the authoritative schema snapshot into an isolated local Supabase database. Hosted deployment must use the project's governed forward-migration procedure.

Corrective certification provenance is recorded in `M29-DATABASE-RLS-CORRECTIVE-HOTFIX.md`.
