# Stage E M25 — TradeLink stabilization

M25 stabilizes the existing same-origin TradeLink compatibility runtime before any later iframe retirement. It does not redesign TradeLink authentication, RBAC, document workflow, numbering format, persistence keys, or Supabase schema.

## Authorities

- Production application: `apps/tradelink/app.v1.42.0-wm1.js`
- Stability pre-bootstrap: `apps/tradelink/stability-runtime.js`
- Domain configuration: `apps/tradelink/domain-config.js`
- Shared persistence: existing authorized Supabase module-state RPCs via `WMModuleStore`
- Distributed mutation serialization: `WMModuleLocks`

## Stabilization contract

Critical shared workspace changes acquire a module-scoped distributed lock, refresh authoritative module state after lock acquisition, re-resolve the affected entity, then commit and verify the exact stored value before reporting success. New document numbers are allocated only after that authoritative refresh. Existing document edits compare the captured `updatedAt` value with the authoritative record and refuse stale overwrites.

Document saves, workflow changes, quotation status, comments, deletes, counter/template changes, recovery operations, and vendor assets use confirmed persistence. Vendor asset changes are rolled back if the associated shared business-state/audit commit fails.
Snapshot restore also captures the previous vendor-asset set and restores it if the shared restore commit cannot be confirmed. A successful shared business commit is not downgraded to failure merely because the separate user-scoped UI write subsequently fails.

Export and activity-audit paths no longer call the legacy fire-and-forget whole-workspace persistence function. Audit events are serialized through the TradeLink workspace lock, refresh authoritative state first, and use the confirmed shared-state commit boundary. The legacy whole-workspace `persist()` authority is removed from the active runtime.

Startup backup recovery no longer writes the shared workspace synchronously. If the primary state is absent but the backup is available, recovery is completed behind the distributed workspace lock and confirmed cloud persistence. Historical embedded vendor logo/QR migration follows the same lock/refresh/confirmed-write path and rolls assets back if the normalized shared-state migration cannot be committed.

Active company selection, document page size, and normal draft/view state are user-scoped and no longer publish personal navigation preferences into the shared TradeLink business blob.

The runtime observes both native `storage` and `wm:module-store-change` synchronization and keeps the bridge valid across BFCache restores. Active forms/modals are not replaced by an external re-render.

The sole remaining direct `WMModuleStore.setItem()` call is the existing `beforeunload` write of the user-scoped autosave draft. It is retained only as a best-effort browser-exit fallback; normal draft persistence is serialized and confirmed during the page lifetime.

## Compatibility boundaries

The TradeLink iframe, existing workflow/RBAC rules, normalized module-state keys, document types, and Work Management authenticated identity remain intact. M25 introduces no external dependency and no Supabase migration.
