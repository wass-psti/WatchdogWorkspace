# Stage I M101 — Boards Import Preview, Correction Workflow, and Atomic Commit

M101 extends the M100 read-only parser with a mutation-gated review/commit boundary.

## Policy
- Parsing remains mutation-free.
- Preview classifies every nonblank source row as `valid`, `invalid`, `duplicate`, `conflict`, or `skipped` and exposes row diagnostics plus normalized values.
- Mapping corrections are applied by reparsing with `columnMapping`; validation is rerun from source data.
- User exclusions are explicit source-row IDs. Excluded rows become `skipped` and are never sent to persistence.
- Invalid and conflicting rows block commit unless explicitly excluded. Duplicate rows are non-committable and skipped by policy.
- Updates of existing items are not supported in M101; `updated` is always zero.
- Missing/ambiguous groups, missing columns, invalid values, stale board versions, authorization failures, and database failures fail closed.

## Atomicity
`public.wm_import_board_items_atomic` is the sole mutation authority. It verifies edit access, locks the board and relationships, compares the preview board version, and creates all reviewed rows in one PostgreSQL transaction. Any exception rolls back the entire RPC call. No client-side row-by-row fallback exists.

## Concurrent modification policy
A preview is bound to `work_boards.updated_at`. If the authoritative board version differs at commit time, the RPC raises SQLSTATE `40001`; the user must refresh and review again.

## Completion summary
Successful commit returns `{created, updated, skipped, rejected, affected}`. M101 supports create-only commits, so `updated=0`; excluded/duplicate/rejected preview rows are not sent to the RPC and remain represented in the preview summary.
