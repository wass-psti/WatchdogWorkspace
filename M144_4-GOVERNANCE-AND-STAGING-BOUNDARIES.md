# M144.4 — Governed source integrity and M143 staging preparation

**Checkpoint:** implementation review candidate; **NOT RELEASE CERTIFIED**.

## Provenance and exact delta

- Authoritative predecessor: `WatchdogWorkspace-M144_2_5-Source-Review-NOT-RELEASE-CERTIFIED.zip`.
- Required predecessor SHA-256: `78d6c4b35b2fea4a01aa1e0ff1485ee9de77d747db569bf4c61d786b603572e4`.
- Authorized additions: this document; `scripts/m1444_source_governance.py`.
- Authorized changes/deletions to predecessor: **none**. Preserve application behavior, historical manifest, source contracts and production configuration.
- Historical `CHECKSUMS.sha256`: deliberately unchanged. The M144.4 source-wide manifest is an **external companion** listing every current source archive member, including the historical manifest; it is not self-referential.

## Independent source verification

Use Python 3.9+ (stdlib) and invoke `scripts/m1444_source_governance.py verify --archive <successor.zip> --predecessor <pinned-predecessor.zip> --manifest <companion.json> [--tree <exact-unpacked-root>]`. The verifier checks full ZIP SHA-256, all member digests, member safety, predecessor equivalence, exact allowed additions, and the M143 SQL draft's unchanged security and conflict declarations. The SHA-256 of the companion manifest must be independently checked against its shipped `-SHA256SUMS.txt` before trusting it. Absence of credentials and external networking is intentional.

`create` is a deterministic generation operation and refuses overwrite; `stage` exports a **data-only** copy of the SQL draft to a new review directory outside the source tree. The exported SQL **is not** a Supabase migration and must not be treated as authorization to deploy.

## M143 nonproduction-only migration review

- Current SQL draft: `supabase/m143/board_import_wizard_atomic_DRAFT.sql`.
- Pinned SQL SHA-256: `b883b3c432ae5ebcadd9fda2f15b5bcdeb0cff9448ace4862c6fb88fd5fd37fc`.
- No M143 `wm_import_board_wizard_atomic` migration is installed in the application's `supabase/migrations` inventory by this checkpoint.
- Existing backend capability configuration and client calling semantics remain unchanged.
- Prerequisites to inspect against the target staging schema: `auth.uid`, `work_boards`, `work_board_access`, `work_board_groups`, `work_board_columns`, `work_board_items`, `work_board_item_values`, `work_board_members`, `wm_add_board_group`, `wm_add_board_column`, `wm_set_board_cell`, and `work_board_log`; all object owners, policies, and permissions need explicit confirmation.
- Staging execution is **not** performed by the M144.4 scripts. No staging project identifier, credentials, migration history or permission for hosted writes is assumed.
- Before any staging application, run exact schema-diff/owner/RLS/grant review; execute rollback and negative tests in disposable infrastructure; check HTTP 409 for conflicts, immutable production boundary, and real GoTrue token lifecycle. Independently approve the staging migration file, with a time-ordered migration version and rollback guard. Do not directly copy this SQL draft into production migrations.
- Rollback planning must account for any clients already using the RPC. Dropping the function without client coordination is not a safe unconditional rollback.

## Verification and release boundary

This checkpoint can statically validate its governance logic, archive provenance, draft SQL integrity, and preview artifacts in the current execution environment. The isolated GoTrue/PostgREST lifecycle previously passed on the user's Mac (M144.3.6), but was **not rerun** here. Hosted staging parity, full browser/E2E, migration rollback and release certification remain **pending**; an authenticated source archive alone does not clear those gates.

## Continuation state

**CONTINUE — IMPLEMENTATION REQUIRED**. Any application migration/promotion or release source changes must derive from this candidate or the authenticated M144.2.5 baseline with explicit regression and authorization controls. Never replace the baseline with a patch-only ZIP.
