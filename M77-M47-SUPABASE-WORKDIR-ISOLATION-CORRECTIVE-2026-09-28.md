# M77 Corrective v3 — M47 Disposable Supabase Workdir Isolation

## Trigger
During M77 corrective certification, `scripts/lib/stage-h-m77-certification-tree.mjs` repeatedly changed from the canonical corrective-v2 source identity after the M47 release regression executed. The drift recurred deterministically after the disposable M47 database gate.

## Root cause
`scripts/run-stage-g-m47-database-tests.mjs` created its disposable Supabase project under a temporary `workdir`, but its pre-start and cleanup `supabase stop` commands were invoked without `--workdir`. Those stop commands therefore inherited the repository working directory and could create/update Supabase CLI runtime metadata under the repository (for example `supabase/.temp`), changing the M77 normalized source-tree identity even though application source was unchanged.

## Corrective delta
Both `supabase stop` invocations now include `--workdir <temporary-workdir>`, keeping every lifecycle command for the disposable M47 stack inside the same temporary project boundary. The M47 static verifier now fails closed if either stop operation loses that isolation or if the old repository-cwd stop form returns.

## Invariants preserved
- No production application logic changed.
- No database schema, migration, RLS, grant, RPC, or production Supabase contract changed.
- M47 still starts, tests, and stops an isolated disposable Supabase stack.
- Repository source identity must remain unchanged across the M47 disposable database gate.
