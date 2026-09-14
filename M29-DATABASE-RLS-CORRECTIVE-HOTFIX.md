# M29 Database/RLS Corrective Hotfix

State: `implementation-complete-pending-certification`

The first Docker-backed M29 certification executed all 82 original pgTAP assertions and returned **78 / 82 passing**. The four failures reduced to **three root causes**. No failing assertion was weakened or removed.

## Root cause 1 — anonymous helper EXECUTE privilege

`public.is_platform_admin(uuid)` remained effectively executable by `anon` in the real Supabase local role topology even after revocation from `PUBLIC`. M29 now explicitly revokes the helper from both `anon` and `PUBLIC`, while retaining the `authenticated` EXECUTE grant required by RLS evaluation.

## Root cause 2 — display-name whitespace normalization

`update_own_profile()` used a backslash escape form that did not collapse whitespace under the certified PostgreSQL configuration. It now uses the POSIX `[[:space:]]+` class so profile normalization is deterministic under `standard_conforming_strings`.

## Root cause 3 — Board authorization three-valued logic

`work_board_access()` returned SQL `NULL` when no membership row existed. Callers commonly use `IF NOT work_board_access(...)`; `NOT NULL` is still `NULL`, so the PL/pgSQL branch was not entered. This created a fail-open authorization path for same-workspace non-members and also propagated `NULL` into Realtime topic authorization.

The helper now **fails closed** and is total:
- `manage` returns an explicit boolean;
- `edit` returns an explicit boolean;
- `view` returns an explicit boolean;
- missing membership returns `FALSE`;
- unknown access requirements return `FALSE`.

The Board pgTAP suite adds four direct helper assertions for outsider `view`, `edit`, `manage`, and an unsupported requirement, adding four Board helper assertions plus one class-wide anonymous SECURITY DEFINER ACL assertion and raising the M29 contract from 82 to **87 assertions**.

## Compatibility

No browser API is removed. Existing safeguarded RPC authorities remain unchanged. The correction changes only authorization/normalization semantics that were already intended by the certified architecture. M28 remains `active-certified`, Architecture remains 37, and M29 remains pending until the complete Docker-backed 86-assertion suite and release gate pass.

The original M29 hardening migration remains unchanged; the correction is delivered as a distinct forward migration so environments that already evaluated the failed RC have an unambiguous remediation path.
