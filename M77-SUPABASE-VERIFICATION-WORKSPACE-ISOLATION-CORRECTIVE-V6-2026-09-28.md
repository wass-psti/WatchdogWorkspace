# M77 Supabase Verification Workspace Isolation Corrective v6 — 2026-09-28

## Origin

Corrective-v5 proved that the dedicated M47 database runner no longer mutated the repository source tree: the pre-M47 and post-M47 normalized source hashes matched. The subsequent M49/M50 release-regression chain then completed its functional/database checks, but the fail-closed post-release source-stability checkpoint terminated before certification because predecessor Supabase database runners still executed CLI probes and/or stop lifecycle calls from the repository process working directory.

## Root cause

The repository contained multiple historical disposable-Supabase runners with inconsistent process isolation. M47 had been corrected, but M46, M50, M51, M52, and the M29 database/RLS runner still had one or more of the following repository-CWD behaviors:

- `supabase --version` probe before a disposable workdir existed;
- pinned `npx supabase@2.117.0 --version` probe from repository CWD;
- `supabase stop` without the disposable `--workdir`;
- project-bound Supabase lifecycle command without `cwd` bound to the disposable workdir;
- Docker/bootstrap subprocesses inheriting repository CWD.

The M42 environment preflight also probed the global Supabase CLI from repository CWD.

## Corrective delta

This checkpoint applies the same full-isolation contract across every retained disposable database runner used by the release/certification lineage:

- M29 Database/RLS runner;
- M46 Boards backend/data-contract runner;
- M47 Boards table/group/item runner (retained from v5); 
- M50 Rich Item Workspace/File runner;
- M51 Boards realtime/concurrency runner;
- M52 Cross-module RBAC runner.

For the newly corrected runners, disposable workdirs are created before Supabase CLI probing. Global and pinned CLI version probes execute with `cwd` set to the disposable workdir. Project-bound lifecycle calls bind both `--workdir` and process `cwd`. Pre-start and cleanup stop operations are scoped to the same disposable project. Docker/bootstrap subprocesses use the neutral disposable cwd. The M42 global CLI version probe uses the OS temporary directory rather than repository CWD.

Static regression guards were added to the M29, M46, M50, M51, and M52 milestone verifiers so recurrence fails closed.

## Scope boundary

No production application behavior, production schema, migration semantics, RPC contract, RLS policy, grant, module authorization model, UI behavior, deployment definition, or package dependency was intentionally changed. The delta is confined to verification-harness workspace isolation, its static regression protection, and corrective provenance/state documentation.

## Exit criterion

The corrective loop can exit only when the complete v6 fail-closed certification pipeline proves all of the following from one canonical source state:

1. normalized source hash is stable before and after the standalone M47 database gate;
2. normalized source hash is stable before and after the complete predecessor release-regression chain;
3. dedicated M77 certification passes;
4. post-certification validation passes;
5. historical regression passes;
6. checksum/package hygiene passes;
7. final checkpoint passes;
8. the resulting active-certified baseline is published and required hosted workflows pass.
