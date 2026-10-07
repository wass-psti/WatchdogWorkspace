# M106 Hosted PR Corrective — M49 Supabase Stack Cleanup Isolation

## Originating checkpoint
Stage I M106 hosted pull-request validation on PR #12 (`stage-i-m106-deploy-pages-v5-compatibility`, original head `fb86804dc2468109ad03b6f0f9bc2cb2d60590dc`).

## Failed gate
GitHub Actions workflow **Boards Kanban Drag Drop Recovery**, run `37456512036`, job `112245337293`, step **Verify M49 candidate without publication**.

## Observed failure
The M49 candidate successfully completed its earlier M47 and M46 local Supabase database suites. The subsequent M29 Database/RLS suite then failed while starting `supabase_db_work-management-m29-tests` because host port `54322` remained occupied:

`failed to bind host port for 0.0.0.0:54322 ... address already in use`

This was a hosted CI container-lifecycle failure, not an application schema/RLS assertion failure. The M47 and M46 pgTAP suites had already passed in the same job before the port collision.

## Root-cause classification
**Environment / certification-harness cleanup defect.** The disposable Supabase runners relied on `supabase stop` but did not independently verify that project-scoped Docker containers were actually gone before the next stack attempted to bind the default local Supabase ports. The cleanup call's result was not sufficient to guarantee host-port release.

## Corrective delta
A governed project-scoped residual-container cleanup helper was added at:

- `scripts/lib/supabase-local-stack-cleanup.mjs`

The helper:

- inspects Docker only for containers whose names contain the exact disposable Supabase project ID;
- force-removes only those residual project containers when CLI stop leaves any behind;
- rechecks the project scope and fails closed if residual containers still remain;
- never performs global Docker cleanup, `docker system prune`, or `supabase stop --all`.

The helper is now invoked before stack start and after CLI stop by:

- `scripts/run-stage-g-m46-database-contract-tests.mjs`
- `scripts/run-stage-g-m47-database-tests.mjs`
- `scripts/run-database-rls-tests.mjs` (M29)

Before M29 starts, it also performs bounded residual cleanup for the two immediately preceding disposable Supabase project IDs used by the M49 candidate sequence (M47 and M46). This closes the observed serial-suite port-reuse boundary without touching unrelated Docker containers.

M49 static recovery verification now asserts that this cleanup authority exists and is wired into all three database runners used by the M49 candidate gate.

## Local evidence available in this checkpoint
- Node syntax validation: PASS for the cleanup helper and all three modified database runners.
- M49 static recovery verifier: PASS, 217 checks.
- Full dependency installation / Docker-backed Supabase execution: not completed in the current assistant container.
- GitHub branch update / workflow re-run: BLOCKED by the connected GitHub integration, which returned HTTP 403 `Resource not accessible by integration` for both Actions rerun and Git-object write operations.

## Exit criteria
The corrective loop is exited only when the corrected repository state is pushed to PR #12 and the current-head hosted **Boards Kanban Drag Drop Recovery** workflow passes, followed by the remaining M106 hosted/final certification requirements.
