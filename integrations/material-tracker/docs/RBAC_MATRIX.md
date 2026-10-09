# Material Tracker RBAC Matrix

Material Tracker roles are application-scoped and are not inferred at runtime from a user's global Workspace platform role.

| Capability | ADMIN | USER | VIEWER |
| --- | --- | --- | --- |
| Open Material Tracker | Yes | Yes | Yes |
| View materials/details/KPIs | Yes | Yes | Yes |
| Search/filter/sort | Yes | Yes | Yes |
| Personal saved views/star/column state | Yes | Yes | Yes |
| Export PDF/XLSX | Yes | Yes | Yes |
| Create/edit/move/archive/duplicate materials | Yes | Yes | No |
| Bulk material mutations/import | Yes | Yes | No |
| Create/update tasks | Yes | Yes | No |
| Add/edit/delete own comments | Yes | Yes | No |
| Create mention notifications | Yes | Yes | No |
| Update forex rates | Yes | No | No |
| Administer Material Tracker role assignment | Yes | No | No |

## Enforcement layers
1. UI presentation suppresses mutation controls when `canWrite` is false.
2. The compatibility transport rejects write/admin calls before network execution.
3. Protected Supabase RPCs enforce the authoritative role checks using `auth.uid()` and the active workspace.
4. Direct Material Tracker table access remains protected by RLS/revoked client table privileges.

Personal user-state writes are intentionally allowed to VIEWER because they affect only the authenticated user's workspace-scoped preferences and do not mutate shared Material Tracker domain records.
