# M77 M47 Supabase Current-Working-Directory Isolation Corrective — 2026-09-28

## Trigger

Corrective-v3 proved that the disposable M47 database suite still changed the normalized M77 source tree even when Supabase CLI lifecycle commands received `--workdir`. The source SHA changed immediately after `boards-table-recovery:database`.

## Root cause

`--workdir` selects the Supabase project directory, but the Node subprocesses were still launched with the repository as their process current working directory. Supabase CLI runtime metadata could therefore still be materialized relative to the repository CWD.

## Corrective delta

- The M47 Supabase command wrapper now launches every project-bound Supabase CLI subprocess with both `--workdir <temp>` and `cwd: <temp>`.
- Both pre-start and cleanup `supabase stop` subprocesses also run with `cwd: <temp>`.
- The M47 static verifier now rejects recurrence of repository-CWD lifecycle invocations.
- Production schema, migrations, RLS, RPCs, grants, application logic, and browser behavior are unchanged.

## Certification requirement

The normalized M77 source SHA must remain byte-identical before and after the complete M47 disposable Supabase database lifecycle. Any change fails certification closed.
