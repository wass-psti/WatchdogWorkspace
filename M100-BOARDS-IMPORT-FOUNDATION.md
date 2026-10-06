# M100 — Boards Import Foundation, Parsing, and File Validation

## Active scope
This checkpoint adds a read-only ingestion/parsing boundary for Work Management Boards imports. It accepts `.csv`, `.xls`, and `.xlsx`, validates extension/MIME/size/container structure, discovers worksheets, resolves a selected worksheet, detects or accepts a header row, extracts headers, maps source columns to a supplied Boards import schema, reports missing required and unsupported columns, removes blank/trailing rows, normalizes raw cells into a deterministic intermediate primitive representation, and emits structured diagnostics.

## Mutation boundary
The subsystem intentionally has no repository/database mutation dependency and exposes `mutationAllowed: false` on every successful dataset. It does not call Board repository commands, Supabase transports, RPCs, persistence adapters, authentication services, or RBAC mutation paths. Database commit behavior is deferred to a later phase.

## Architecture
- Contracts: `src/features/boards/contracts/import.ts`
- Parser: `src/features/boards/import/board-import-parser.ts`
- Boards feature-boundary exports: `assets/js/features/boards/index.ts`
- Verification: `verify-v1432-m100-board-import-foundation.mjs`
- Representative fixtures: `tests/fixtures/board-import/`

## Formats
- CSV: deterministic RFC4180-style quoted-field parser with BOM, blank/trailing row, binary/null-byte, and unclosed-quote handling.
- XLSX: ZIP central-directory validation, deflate/store handling, workbook/relationship/shared-string discovery, multi-sheet enumeration, inline/shared/boolean/numeric/string cell extraction, and corruption diagnostics.
- XLS: Compound Binary File sector/FAT/miniFAT extraction plus BIFF worksheet discovery and common cell records (`LABELSST`, `LABEL`, `NUMBER`, `RK`, `MULRK`, `BOOLERR`).

## Deferred scope
This phase does not perform schema/data-type validation of mapped values, duplicate/conflict classification, database mutation, transactional commit, import preview UI, correction UI, or final import execution. Those are downstream phases.
