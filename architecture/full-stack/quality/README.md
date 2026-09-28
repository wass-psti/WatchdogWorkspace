# Quality Boundary

Canonical production paths:

- `tests/` — browser, modern unit/component/E2E, and type tests.
- `supabase/tests/` — database/RLS tests.
- root `verify-*.mjs` and `verify-project.sh` — historical and milestone verification authorities.
- `scripts/verify-*.mjs`, `scripts/run-*.mjs`, and certification scripts — execution and fail-closed release gates.

Folder-structure changes are incomplete until the applicable static, deterministic, browser/E2E, historical-regression, and packaging gates remain green.
