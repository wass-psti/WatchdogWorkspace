# Conversion Notes

## Source inspected

The supplied ZIP contained `src/generated/*` React components, hooks, helpers, styling, and persistence audit notes. It did not include a complete Vite/CRA project scaffold, package manifest, reusable UI primitives, monday runtime API implementations, or the monday board's actual data rows.

## Standalone strategy

Rather than replacing the generated UI wholesale, this build uses a compatibility boundary. Existing calls such as `board.items()`, `board.item(id).update(...)`, `board.aggregate()`, and versioned storage calls are mapped to a local REST backend. This minimizes regression risk in the React layer and provides a future seam for Supabase.

## Data ownership

During local testing, `server/data/db.json` is the authoritative datastore. Browser `localStorage` is still used only by parts of the original UI that intentionally kept a local backup/theme state; material records themselves are stored through the Node backend.

## Future migration

When real records are exported from monday.com, build a one-time importer that maps the board columns to the item schema already used by the UI. After that, replace JSON persistence with Supabase while keeping the REST/client contract stable.

## 20261003080739 — material_tracker_notification_write_guard
Tightens `material_tracker_create_notification` to require a write-capable Material Tracker role (`ADMIN` or `USER`) rather than generic module access. This keeps VIEWER read-only at the server boundary and preserves authenticated-only RPC execution.

## 20261003115017 — Material Tracker atomic file import

Adds `material_tracker_materials_workspace_active_name_uidx`, `material_tracker_import_preflight`, and `material_tracker_import_commit`. Preflight is read-only and returns row classifications plus a fingerprint of relevant active database state. Commit requires that fingerprint, re-validates all selected rows, rejects stale/conflicting previews, and executes all selected creates/updates in one PostgreSQL transaction. RPC execution is granted to `authenticated` and denied to `anon`; module write authorization remains enforced by `private.material_tracker_can_write`.


## 20261003115954 — Material Tracker import payload bounds

Hardens server-side import row size and relationship-reference limits. A row is capped at 64 KiB; Account and Supplier PO linked-item arrays are capped at 50 entries with bounded identifier/display-name lengths.
