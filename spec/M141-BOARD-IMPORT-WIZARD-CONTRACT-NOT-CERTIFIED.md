# M141 — Board Import wizard scope and implementation handoff

Status: SOURCE-ONLY REVIEW CANDIDATE — NOT CERTIFIED / NO BACKEND CHANGE.

Base main: `ed390940b56be6c4495347aae37593e9a34b4446` (source tree `f2385208e85182702e875b26ef95fcf14fc7f6c4`).

## Reference screenshots (9 views)

1. Full-width dark, three-step header: Upload → Map columns → Handle matches.
2. Upload accepts `.csv`, `.xlsx`, `.xls`, drag/drop and Browse affordance.
3. Column mapping: map one source to primary Item, map to existing target columns, create new columns, skip columns; group selection and bulk-unmapped policy.
4. Mapping counts recalculate; a matching column chooser is required for Skip/Update; disabled Import Now until configured.
5. Match policy: Add as new, Skip matched, Update matched using one selected column.

## What is not proven by screenshots

- Drag-and-drop implementation, parser behavior, type inference and custom status option creation.
- Nested subitem reconstruction and true hierarchical persistence.
- Transactional semantics, source match normalization, item version checks, RLS and audit.
- Whether unmatched entries in update mode should be created: **M141 proposes skip unmatched**.
- Whether existing target board creation is supported: **M141 assumes existing Board first**.

## Current source constraints confirmed

- `assets/js/features/boards/controllers/board-import-workflow.ts` has an existing-board dialog, mapping, validation, preview, and item-only atomic commit; it must remain unchanged in this milestone.
- `src/features/boards/import/board-import-parser.ts` recognizes CSV/XLS/XLSX and stores source `raw` cells by worksheet header.
- `src/features/boards/import/board-import-preview.ts` resolves existing groups/columns and versions existing IDs.
- Latest M103 Supabase `wm_import_board_items_atomic` may create/update items, not create groups/columns; duplicate title conflicts are checked.
- `src/features/boards/contracts/domain.ts` enumerates supported column types, no native `subitems` column type.

## M141 new read-only source files

- `src/features/boards/contracts/import-wizard.ts`: typed wizard mapping, group and match-policy contracts.
- `src/features/boards/import/board-import-wizard-plan.ts`: deterministic source-only planner, errors, row decisions and live mapping counts.
- `tests/modern/board-import/m141-wizard-plan.verify.mjs`: 13 deterministic regression cases against the new planner.

## M142 frontend design boundary

Add a three-step wizard within existing Board overlay framework, with upload, mapper and duplicate-policy steps. Consume M141 planner output. Enforce explicit confirmation of source column data types; use existing parser for actual file parsing. Do not mutate on mapping/preview. Keep existing import dialog available until fully certified. Reuse Board RBAC and app identity. Do not infer true subitem relationship from a `Subitems` column header alone.

## M143 backend design boundary

Design **new** authenticated transactional RPC for schema+item operations. Validate Board edit and schema permissions on server. Lock Board/groups/columns/items as required. Recheck board version, item compare-and-swap, duplicate key uniqueness, relationships and status/dropdown configuration. Write one audit entry. Roll back all mutations on failure. Retain existing M103 importer unchanged for historical compatibility. Explicitly analyze whether database unique indexes conflict with screenshot `Add as new items` policy; DO NOT remove uniqueness safeguards without an approved alternative identity policy.

## M144 certification requirements

Static source/type checks; focused planner tests; existing M100–M103 historical guards; modern unit/browser; RLS negative cases; realtime/reload; failure rollback; large files; keyboard/focus/a11y; branch CI; independent human review; governed artifact checksums and source provenance.

## Dependencies and open requirements

- Representative real Monday.com export to validate group rows, status/dropdown values, dates, and subitem formatting.
- Explicit policy for duplicate title/identity conflicts and update matching.
- Schema changes require separate authorization and independent approval; no production data write is authorized at M141.
- Two prior PR historical governance exceptions and authenticated acceptance remain outside this source-only checkpoint.

## Continuation state

CONTINUE — IMPLEMENTATION REQUIRED. M141 planner is implemented and locally testable; frontend integration, backend migration, browser acceptance and full repository certification remain.
