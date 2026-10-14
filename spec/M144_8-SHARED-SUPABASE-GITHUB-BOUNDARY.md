# WatchdogWorkspace M144.8 — Shared Supabase Hosted RPC and GitHub Source Parity

**Scope:** Reconcile M144.7 source with metadata *observed on 2026-10-14* on the existing shared WatchdogWorkspace Supabase project and public GitHub `main`. This is non-mutating governance. No separate staging Supabase project is required, designated, or authorized.

**Supabase:** `jtlusodorfnyzgyuewkz` (WatchdogWorkspace). `public.wm_import_board_wizard_atomic` is installed. Stored function `prosrc` SHA-256 exactly matches M143 source dollar-quoted function body: `e193008098c5b0aac663dc14cd1276c72d7b0f88980970dc530d385683cc3eed` (15,871 bytes). Owner `postgres`, SECURITY DEFINER, `search_path=pg_catalog, public`, `authenticated` EXECUTE, no `anon` EXECUTE, and nine PT409 branches. The migration ledger lacks an M143-named entry; do not automatically redeploy or falsify history. Source is unchanged. This is code parity, not a hosted end-to-end test or RLS policy proof.

**Shared modules:** Boards, Fueltrans, Fund Released, Materials, and Tool Traceability/Toolbox all have public tables with RLS enabled in the limited observed categories. Tool Traceability has existing migration history in the same project; never blindly merge, replace, or delete its data. Future modules use shared Supabase Auth with isolated application-specific RBAC/RLS and storage grants. This does not authorize copying records from or deleting another Supabase project.

**GitHub:** public `wass-psti/WatchdogWorkspace` `main` was observed at `ed390940b56be6c4495347aae37593e9a34b4446`. Key package/config files match M144.7, but the Board repository differs, and the M141/M142 wizard UI/planner/commit files are missing from current main. `main` triggers Pages deployment; DO NOT push a wholesale source ZIP or replace/force-push `main`. A safe test branch needs a new fresh `main` fetch and 3-way file-level reconciliation, preserving intervening changes, then CI and authorized live test board acceptance.

**Next execution:** Use the separately supplied fail-closed M144.8 Mac verification script. The observation JSON is a point-in-time record, not proof of present freshness. Hosted write tests require explicit test-board authorization; GitHub commits require a separate branch/reconciliation gate. No database or GitHub writes were performed in this checkpoint.

**Continuation state:** CONTINUE — IMPLEMENTATION REQUIRED. **Release certification:** WITHHELD.
