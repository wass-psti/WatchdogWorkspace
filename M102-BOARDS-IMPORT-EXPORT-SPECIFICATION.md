# M102 Work Management Boards Import / Export Specification

Contract version: **1.0**

This specification is derived from the implemented M100-M102 parser, M101 preview/commit workflow, Board domain contracts, and Board editor limits. The runtime `createBoardPortableSpecification(board)` function is authoritative for board-specific dynamic columns and accepted values.

## Canonical core columns

| Order | Exact header | Required | Type | Null/blank | Max | Example | Normalization / relationship | Duplicate behavior |
|---:|---|---|---|---|---:|---|---|---|
| 1 | `Item ID` | No | UUID metadata | Blank allowed | 36 | `11111111-1111-4111-8111-111111111111` | Trimmed. Used only for reconciliation. Never assigns an imported record ID and never enables silent overwrite. | Item ID does not replace duplicate identity. |
| 2 | `Item Name` | **Yes** | UTF-8 text | Blank rejected | 240 | `Prepare project brief` | Outer whitespace trimmed. | Duplicate identity = normalized Item Name + resolved Group. |
| 3 | `Group ID` | No | UUID relationship hint | Blank allowed | 36 | `22222222-2222-4222-8222-222222222222` | If the ID belongs to the current Board it is used; otherwise import falls back to exact Group-name resolution. If ID and name both resolve on the current Board but disagree, validation fails. | Does not independently define duplicate identity. |
| 4 | `Group` | No | Group title | Blank allowed | 120 | `Main Group` | Trimmed and matched case-insensitively. Blank uses the first Board group. Must resolve unambiguously. | Combined with Item Name. |

## Dynamic Board columns

Every Board column follows the four core fields in Board position order. The **canonical export/import header is the stable `column_key`**, or the column UUID when no `column_key` exists. The display name remains an accepted import alias and is shown in the generated specification. Stable keys prevent ambiguous exports when display names are duplicated.

| Board type | Accepted file value | Null / blank | Maximum | Normalization and validation |
|---|---|---|---:|---|
| `text` | UTF-8 scalar text | Optional unless column is required | 1000 | CRLF/CR becomes LF in parsing; outer whitespace trimmed; values over 1000 characters rejected. |
| `long_text` | UTF-8 scalar text | Optional unless required | 5000 | Same text normalization; values over 5000 characters rejected. |
| `number` | Finite decimal number, `.` decimal separator | Optional unless required | — | Numeric strings normalize to a finite JavaScript number. NaN/infinity/non-numeric values rejected. |
| `status` | Stable status-label ID (preferred) or exact configured label name | Optional unless required | — | Names/IDs normalize to the stable label ID. Must resolve to the active column configuration. |
| `dropdown` | Exact configured option text | Optional unless required | 1000 | Trimmed. When options exist, the value must equal a configured option. |
| `date` | `YYYY-MM-DD` | Optional unless required | 10 | ISO calendar-date string preserved; other date formats rejected. |
| `people` | User UUID | Optional unless required | 36 | UUID preserved. Commit-time relationship validation remains authoritative. |
| `checkbox` | `true`, `false`, `yes`, `no`, `1`, or `0` | Optional unless required | 5 | `true/yes/1` → boolean `true`; `false/no/0` → boolean `false`. |
| `timeline` | `YYYY-MM-DD/YYYY-MM-DD` | Optional unless required; either endpoint may be blank, but not both when a value is supplied | 21 | Normalizes to `{start,end}` with ISO-date endpoints. |
| `email` | Valid email address | Optional unless required | 320 | Trimmed; invalid address structure or values over 320 characters rejected. |
| `url` | Absolute HTTP/HTTPS URL | Optional unless required | 2000 | Parsed and normalized with URL serialization; non-HTTP(S) and oversized values rejected. |

## CSV rules

- UTF-8 with BOM for Excel compatibility.
- Comma delimiter.
- RFC-style double-quote escaping: fields containing commas, quotes, CR, or LF are quoted and embedded quotes are doubled.
- Header row is row 1.
- Empty cells normalize to `null`.

## Excel `.xlsx` rules

- Office Open XML workbook.
- `Data` is the first worksheet and is the importable dataset.
- `Instructions` contains the board-specific specification and accepted-value guidance.
- Scalar numbers and booleans use native spreadsheet cell types; text uses inline strings.
- The existing importer accepts both stored and DEFLATE-compressed ZIP entries.

## Duplicate / conflict / update policy

- Duplicate rows inside one import are skipped by `Item Name + resolved Group` identity.
- Existing rows with identical mapped values are duplicates and are skipped.
- Existing rows with different mapped values are blocking conflicts until excluded/resolved.
- Imports remain **create-only**. `Item ID` is reconciliation metadata only; M102 does not silently update existing rows.
- Invalid/conflicting rows cannot be committed unless excluded.
- Atomic M101 commit behavior remains authoritative; no partial fallback exists.

## Sensitive / internal fields intentionally excluded

Exports do **not** expose authentication/session data, workspace membership internals, board-member authorization records, audit actors, storage paths, private file metadata, service credentials, database implementation columns, RLS state, internal transaction metadata, or infrastructure configuration. Only the supported portable item/group/column value contract is exported.
