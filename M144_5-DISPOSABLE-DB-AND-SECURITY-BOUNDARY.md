# M144.5 — Disposable PostgreSQL migration, security and rollback QA (NON-RELEASE)

This checkpoint adds **verification tooling only** to the exact M144.4 implementation-continuation candidate; no existing source file, historical manifest, application runtime, deployment config, database schema or normal migration directory is changed.

## Integrity and provenance

- Immediate predecessor: `WatchdogWorkspace-M144_4-Governance-Review-NOT-RELEASE-CERTIFIED.zip`, SHA-256 `40a9047817608408d4fa706ac6fc4145acaf560d9e07cedad006460005203adc`.
- Original preserved M144.2.5 predecessor: SHA-256 `78d6c4b35b2fea4a01aa1e0ff1485ee9de77d747db569bf4c61d786b603572e4`.
- Allowlisted additions: this document, `scripts/m1445_source_governance.py`, `scripts/m1445_disposable_pg_qa.sh`. No modifications/removals to any previous file.
- Complete current-source inventory is a separately shipped SHA-256 JSON companion, not a replacement for the historical `CHECKSUMS.sha256`.
- M143 draft SQL SHA-256 `b883b3c432ae5ebcadd9fda2f15b5bcdeb0cff9448ace4862c6fb88fd5fd37fc`; source migration stays in `supabase/m143/`, **not** `supabase/migrations/`.

## Disposable local execution

The runner `scripts/m1445_disposable_pg_qa.sh <unpacked-repository-root> <new-external-evidence-directory>` creates a uniquely named disposable `postgres:16-alpine` container using a **local Unix Docker context**, `--network none`, no published ports, and no host binds. Credentials are temporary. It validates the source-pinned M143 fixture and test suite, checks DDL transaction rollback, installs the RPC in the container only, checks `SECURITY DEFINER`, server-side RLS fixture and grants, runs the existing 11-scenario PostgreSQL behavior suite, confirms atomic row rollback and audit integrity, and tests safe rollback/removal of the new function. It removes its container on both success and failure, preserving evidence on disk.

The tag `postgres:16-alpine` identifies the compatible PostgreSQL major version but is not a digest-pinned Docker image; the exact image ID and PostgreSQL server version are recorded for reproducibility. Reproduction across machine/image updates requires retaining the reported image ID. The fixture is a **contract fixture**, not the current hosted production schema. Superuser ownership in the fixture cannot establish real hosted definer and RLS parity.

The prior M144.3.6 disposable GoTrue/PostgREST/Playwright suite, when rerun by the outer local handoff, remains a **separate evidence line**. Its source baseline M144.2.5 is separately authenticated and reconciled byte-for-byte with this checkpoint (except governance-only additions). It does not test a hosted Supabase project or staging migration parity.

## Hard boundaries

- No hosted Supabase connections, migration push, SQL editor actions, GitHub operations, or production publishing in this checkpoint.
- No `supabase db push` and no migration is added to the production migration chain.
- A successful local SQL contract suite **does not authorize** staging deployment or production release.
- Real hosted nonproduction schema ownership, RLS policies, role grants, migration history, PostgREST, auth tokens, and operational rollback all remain for a separately authorized staging acceptance run.
- Never drop a deployed RPC while active clients require it. Rollback removal is permitted only inside the disposable test container.
- The non-release QA PASS artifact is written only if every required executed local gate succeeds; missing Docker or predecessors leaves a BLOCKED state without issuing PASS.

## Continuation

**CONTINUE — IMPLEMENTATION REQUIRED** for hosted staging-parity, migration promotion review, full acceptance and release certification. Preserve M144.4 and M144.2.5 as immutable predecessors.
