# M142 — Board Import Wizard: UI implementation (not release-certified)

## Scope
- Full viewport three-step overlay: Upload → Map columns → Handle matches.
- CSV/XLS/XLSX file picker, drag-and-drop, worksheet selection and re-parse.
- Existing/new destination group, map to Item/existing column/create new column/skip.
- Mapping counts; column type editing; Add/Skip/Update matching policies; match-column selection; read-only row decision counts and diagnostics.
- Escape, keyboard focus wrapping, close/focus restoration, and responsive/reduced-motion styling.
- Delegates overlay lifecycle to existing Boards coordinator; existing reviewed importer remains accessible from the wizard.

## Safety boundary
- M141 non-mutating planner is authoritative for preview decisions.
- The new Import Now control remains **disabled**. The M143 backend for atomic new-group/new-column and duplicate policy does not exist yet.
- No Supabase schema, RLS, RPC, identity, deploy, or CI configuration changes.
- Existing legacy importer continues its independently authenticated and version-guarded commit path.

## Unresolved acceptance
- M143 transactional schema and item mutations.
- Authenticated, role-specific production acceptance; dedicated wizard E2E flows for keyboard, upload/worksheet, and match selections.
- Real exported workbooks and special cases (subitems, status configuration, date/boolean conversions) must be validated before production rollout.
- Independent review, PR governance exception disposition, and complete final release certification.

## Source governance
- Source applies only to the locally verified M141.3 six-file candidate pinned to `ed390940b56be6c4495347aae37593e9a34b4446`.
- Historical M108 archive identity stays pinned. The successor verification adds exact file SHA-256 pins; no wildcard allowlists.
- No automatic deployment, merge, production write, or GitHub mutation.
