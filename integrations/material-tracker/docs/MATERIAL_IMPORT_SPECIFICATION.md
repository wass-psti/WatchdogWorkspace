# Material Tracker Import/Export Specification v1.0

## Purpose

This is the canonical interchange contract for Material Tracker CSV and Excel imports/exports. Files exported by Material Tracker use this schema and are intended to be editable and safely re-importable.

## Supported files

- CSV: `.csv` (UTF-8; RFC-4180-style quoted fields supported)
- Excel 97-2003: `.xls` (BIFF/OLE, SpreadsheetML XML, or HTML-table workbook)
- Excel Open XML: `.xlsx`
- Maximum file size: 10 MB
- Maximum parsed data rows: 5,000
- Maximum rows per atomic commit: 1,000

Extension and MIME type are both validated. Spreadsheet content is parsed locally for preview; no database mutation occurs during file selection, parsing, mapping, or validation.

## Header detection and mapping

Material Tracker scans the first 25 non-empty rows and selects the row with the strongest recognized-header score. Users can override every mapping before validation. Every required field must be mapped exactly once.

## Canonical columns

| # | Column | Key | Required | Type / accepted values | Null/blank rule | Maximum | Unique | Example |
|---:|---|---|:---:|---|---|---|:---:|---|
| 1 | Material ID | `id` | No | Identifier `[A-Za-z0-9._:-]` | Blank = create a new ID | 128 chars | Yes when present | `mt-550e8400-e29b-41d4-a716-446655440000` |
| 2 | Part Number | `name` | Yes | String | Blank rejected | 200 chars | Yes per active workspace | `ABC-1234` |
| 3 | Group | `groupId` | Yes | `new_group`, `topics`, `Engineering Services`, `Items for Quotation` | Blank rejected | 80 chars | No | `topics` |
| 4 | Source Type | `sourceType` | Yes | `Local`, `Import` | Blank rejected | 20 chars | No | `Local` |
| 5 | Material Description | `materialDescription` | Yes | String | Blank rejected | 4,000 chars | No | `Industrial pressure transmitter, 4-20mA` |
| 6 | Brand | `brand` | Yes | String | Blank rejected | 200 chars | No | `Acme` |
| 7 | Quantity | `quantity` | Yes | Positive decimal number | Blank rejected | `<= 1,000,000,000` | No | `5` |
| 8 | Buying Price | `buyingPrice` | Yes | Positive decimal number | Blank rejected | `<= 1e15` | No | `1250.50` |
| 9 | Currency | `currency` | Yes | `PHP`, `USD`, `EUR` | Blank rejected | 3 chars | No | `PHP` |
| 10 | Shipping Cost | `shippingCost` | No | Non-negative decimal | Blank = null | `<= 1e15` | No | `250.00` |
| 11 | Shipping Currency | `shippingCostCurrency` | No | `PHP`, `USD`, `EUR` | Blank = `PHP` when shipping cost is present | 3 chars | No | `PHP` |
| 12 | Lead Time (Weeks) | `leadtimeInWeeks` | No | Whole number `0..5200` | Blank = null | 5,200 | No | `4` |
| 13 | Date Required | `dateRequired` | No | `YYYY-MM-DD` preferred; recognized Excel dates and common date strings accepted | Blank = null | Calendar-valid date | No | `2026-12-31` |
| 14 | RFQ Ref No | `rfqRefNo` | No | String | Blank = null | 200 chars | No | `RFQ-2026-001` |
| 15 | Vendor Details | `vendorDetails` | No | String | Blank = null | 500 chars | No | `Supplier Company` |
| 16 | Account References | `accountRefs` | No | Semicolon list; each item `name` or `id|name` | Blank = no links | 50 refs; 200 chars/ref | No | `ACC-001|Main Account` |
| 17 | Supplier PO References | `supplierPoRefs` | No | Semicolon list; each item `name` or `id|name` | Blank = no links | 50 refs; 200 chars/ref | No | `PO-001|PO 001` |

Column order is canonical for templates and exports but imports may use any order when columns are mapped correctly.

## Numeric rules

- Decimal point is `.`.
- Thousands separators in standard comma grouping are normalized (for example `1,250.50`).
- Parenthesized numbers are interpreted as negative and rejected when the field requires non-negative/positive values.
- NaN, Infinity, malformed exponent forms, and currency symbols in numeric cells are rejected.

## Date/time rules

Canonical export is `YYYY-MM-DD`. XLS/XLSX date cells and recognized date strings are normalized to that form. Time components are discarded for `Date Required` because it is a date-only Material Tracker field.

## Boolean representations

The current Material Tracker material schema has no Boolean import field. The interchange convention reserved for future Boolean fields is case-insensitive `true/false`, `yes/no`, `y/n`, and `1/0`. Producers should export canonical `TRUE` or `FALSE` if Boolean fields are added later.

## Relationships

Account and Supplier PO relationships are preserved as semicolon-delimited references. `id|name` is preferred because it preserves both a stable identifier and display label. Import does not create external account/PO entities; it preserves the supplied relationship references in the material payload.

## Duplicate and conflict rules

- Duplicate rows inside the same file are detected by normalized Part Number and by Material ID when present.
- An exact pre-existing active Part Number without a matching Material ID is a duplicate/conflict and is never silently overwritten.
- In **Create only** mode, any existing Material ID or Part Number is a conflict.
- In **Update by Material ID** mode, an existing Material ID may be updated only if the resulting Part Number does not collide with another active material.
- A preview fingerprint is generated from the relevant current database state. Commit fails atomically if that state changes before confirmation.

## Commit semantics

No database write occurs until preview is complete and the user confirms. Invalid, duplicate, conflicting, and skipped rows are not eligible for commit. The server re-validates the selected canonical rows, rechecks conflicts and the preview fingerprint, and commits the entire selected batch in one PostgreSQL transaction. Any failure rolls back the whole batch.

## Templates

Use the in-app **Download CSV template** and **Download Excel template** actions. Templates contain the exact canonical header row without seeded/sample production records.


## System-owned fields

Workspace ID, creator identity, created/updated timestamps, archive metadata, audit events and current forex snapshot values are system-owned provenance. They are intentionally not importable and are regenerated/preserved by the authenticated Material Tracker backend. Material ID is the only system identifier included in the editable interchange format because it is required for unambiguous update/re-import behavior.
