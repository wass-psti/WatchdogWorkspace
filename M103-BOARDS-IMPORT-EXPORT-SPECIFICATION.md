# M103 Work Management Boards Import/Export Specification

Version: 1.1

This specification is derived from the active Boards domain model, the M100 parser, the M103 preview validator, and the authoritative PostgreSQL `work_board_validate_column_value` / `wm_import_board_items_atomic` contracts.

## Canonical portable columns

| Column | Order | Required | Type | Null/blank | Unique | Max | Example | Rules |
|---|---:|---|---|---|---|---:|---|---|
| Item ID | 1 | No | UUID | Allowed for new ad-hoc rows | Yes within import | 36 | `11111111-1111-4111-8111-111111111111` | Existing ID selects an explicit update; globally unused ID is preserved on create; repeated imported IDs are blocking errors. |
| Item Name | 2 | Yes | UTF-8 text | Not allowed | No | 240 | `Prepare project brief` | Trim outer whitespace. Together with resolved Group it defines the name/group identity. |
| Item Updated At | 3 | Conditional | ISO-8601 timestamp with timezone | Allowed for creates; required for changed existing Item ID | No | — | `2026-10-05T08:00:00.000Z` | Compare-and-swap version token. A stale value blocks update before commit and is rechecked atomically by PostgreSQL. |
| Group ID | 4 | No | UUID | Allowed | No | 36 | `22222222-2222-4222-8222-222222222222` | Used when it belongs to target Board. If not, exact Group name may deterministically remap the relationship. |
| Group | 5 | No | Text | Blank selects first Board group | No | 120 | `Main Group` | Case-insensitive exact normalized lookup; must resolve to exactly one group. |

Dynamic Board columns follow in Board position order and use the stable `column_key` as the canonical header (column UUID is used only when a key is unavailable). The system `title` column is intentionally represented only by canonical `Item Name` and is not emitted as a second editable field. Visible display names remain accepted aliases during import.

## Dynamic data types

| Type | Portable representation | Accepted values / validation | Normalization |
|---|---|---|---|
| text | UTF-8 text | max 1000 characters | trim outer whitespace |
| long_text | UTF-8 text | max 5000 characters | normalize line endings during parsing; trim outer whitespace |
| number | decimal number | finite number only | numeric strings become numbers |
| status | label ID or exact label name | must resolve to a configured label | normalized to stable label ID |
| dropdown | exact option text | must equal a configured option when options exist | trim whitespace |
| date | `YYYY-MM-DD` | must be a real Gregorian calendar date | preserved canonical date string |
| people | UUID | must identify a current member of the target Board | preserved UUID |
| checkbox | `true`, `false`, `yes`, `no`, `1`, `0` | supported token only | normalized to boolean |
| timeline | `YYYY-MM-DD/YYYY-MM-DD` | both endpoints required when nonblank; both must be real dates; end >= start | normalized to `{start,end}` |
| email | email address | valid address, max 320 | normalized to lowercase to match database validator |
| url | absolute HTTP/HTTPS URL | max 2000, only HTTP(S) | normalized URL serialization |

For required dynamic columns, null or blank values are blocking validation errors. Optional null/blank values normalize to `null`.

## Duplicate, conflict, and update policy

1. Repeated `Item ID` within one import is invalid because Item ID is a unique portable field.
2. Repeated normalized `Item Name + resolved Group` within one file is a duplicate.
3. An unchanged existing Item ID is a duplicate and is not mutated.
4. A changed existing Item ID is eligible for update only when `Item Updated At` exactly matches the current item version captured by the export.
5. A stale version is a blocking conflict.
6. A name/group collision without the matching safe Item ID is a conflict; name-only overwrite is prohibited.
7. A new row with an unused Item ID is created with that exact identifier, enabling identifier-preserving reconstruction.
8. A target Board with remapped Group IDs can reconstruct relationships through the exact Group name when the exported Group ID is not present.
9. Duplicate rows are skipped. Invalid/conflicting rows block commit unless explicitly excluded and revalidated.

## Structured diagnostics

Row validation diagnostics expose, where applicable:

- `row`
- canonical `field`
- stable `rule`
- `importedValue`
- `expected`
- `acceptedValues`
- duplicate/conflict source metadata
- `blocking`
- human-readable `message`

No semantically invalid value is silently repaired. Only documented deterministic normalization is applied.

## Worksheet behavior

CSV has one logical worksheet (`CSV`). XLS/XLSX expose discovered worksheets. The Boards import review UI provides a worksheet selector when more than one worksheet exists; changing it invalidates the current preview and requires revalidation before commit.

## Atomic persistence and security

The final commit is owned by `public.wm_import_board_items_atomic(uuid,timestamptz,jsonb)` and remains `SECURITY DEFINER` with explicit `authenticated` execute authority. The RPC:

- requires authenticated Board edit access;
- serializes the Board with an advisory transaction lock;
- locks Board, relationship, member, and item state;
- verifies the reviewed Board `updated_at` version;
- rechecks per-item `Item Updated At` for updates;
- validates every cell through the authoritative `wm_set_board_cell` path;
- rejects relationship/identifier/name collisions deterministically;
- performs all creates and updates in one PostgreSQL transaction;
- rolls the complete import back on any failure.

## Export and templates

CSV and XLSX exports include the canonical portable columns, dynamic stable column keys, normalized values, identifiers, enumerations, dates, numbers, booleans and relationship references. Internal workspace IDs, ownership/audit internals, storage paths, credentials, security configuration, and implementation-only metadata are excluded.

The XLSX template contains `Data` and `Instructions` worksheets. Checked-in reusable templates are under `templates/boards/` and Board-specific templates are generated by the runtime export service.

## Round-trip contract

Supported round trips are:

- same-Board export/re-import unchanged → duplicate/no mutation;
- same-Board export/edit/re-import with current Item ID + Item Updated At → explicit compare-and-swap update;
- clean compatible target with unused exported Item ID → identifier-preserving create;
- equivalent target with different Group ID but same unambiguous Group name → deterministic relationship remap.

The M103 static verifier and database pgTAP suite protect these invariants.
