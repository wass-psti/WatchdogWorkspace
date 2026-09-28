# M77 Corrective v5 — M47 Supabase CLI Version-Probe Isolation

## Defect
The corrective-v4 database runner isolated project-bound Supabase commands with both `--workdir` and `cwd: workdir`, but it still executed the preliminary `supabase --version` probe from the repository current working directory. Supabase CLI update/version probing can materialize runtime metadata under `supabase/.temp`, changing the M77 normalized source identity even though application source is unchanged.

## Correction
- Create the disposable M47 workdir before any Supabase CLI invocation.
- Execute the global `supabase --version` probe from the disposable workdir.
- Execute the pinned `npx supabase@2.117.0 --version` resolution probe from the disposable workdir.
- Execute the Docker readiness probe from the same disposable workdir for consistent non-repository process isolation.
- Retain v4 `--workdir` plus `cwd: workdir` isolation for start/test/stop lifecycle commands.
- Extend the M47 static verifier to fail closed if an unisolated Supabase version probe is reintroduced.

## Production boundary
No production application source, schema, migration, RPC, RLS policy, grant, UI behavior, or deployment contract is changed. This is verification-harness process isolation only.
