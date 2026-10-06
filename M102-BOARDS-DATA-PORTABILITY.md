# Stage I M102 — Boards Data Portability

M102 completes the Work Management Boards import/export subsystem with production-ready CSV and XLSX export, board-derived import specifications, reusable templates, and deterministic round-trip compatibility.

## Scope

- CSV export using stable canonical headers and Excel-compatible UTF-8 BOM.
- XLSX export using a standards-compatible OOXML workbook with `Data` and `Instructions` worksheets.
- Runtime board-specific import specification derived from actual Board columns/configuration.
- Reusable CSV/XLSX templates.
- Safe metadata preservation for `Item ID` and `Group ID` without enabling silent updates.
- Timeline scalar serialization (`YYYY-MM-DD/YYYY-MM-DD`) and import normalization to `{start,end}`.
- Round-trip verification through the existing parser and M101 preview rules.
- Explicit exclusion of authentication, membership, storage, audit, and infrastructure internals.

Imports remain create-only. Existing matching records are duplicates or conflicts according to M101 policy; exported identifiers are reconciliation metadata and never authorize implicit overwrite.
