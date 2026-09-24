# M54 Production Required-RPC Parity Corrective — 2026-09-24

## Originating live failure

After Candidate 07 passed local certification and deployed the forward M38/M51 capability inventory corrective, production `wm_runtime_capabilities()` returned M38 schema `1.43.2-m38-v2` but correctly reported two required RPC implementations as missing:

- `update_own_profile`
- `wm_set_board_cell_if_current`

This proved the capability authority itself was functioning and exposed a remaining production schema-deployment gap.

## Correction

This checkpoint adds a new forward-only migration:

`supabase/migrations/v1.43.2-stage-g-m54-production-required-rpc-parity-corrective.sql`

The migration restores the already-certified definitions of:

- `public.update_own_profile(text)` from the account architecture authority.
- `public.wm_set_board_cell_if_current(uuid,uuid,jsonb,jsonb)` from M51 concurrency authority.

Historical migrations are not rewritten. The canonical schema already contained both implementations and therefore required no semantic modification.

The migration preserves authenticated-only execution and reloads PostgREST schema metadata.

## Verification boundary

M54 static authority now requires the forward production corrective to contain both RPC implementations and their authenticated execution grants. Production deployment remains fail-closed and must be dry-run before application.

No application routing, authentication, RBAC, Board UI, or client capability-manifest behavior is changed by this corrective.
