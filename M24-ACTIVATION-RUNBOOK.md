# M24 Activation Runbook

Prerequisite: Stage E M23 must be `active-certified`.

Run the governed M24 certification script. It installs the exact lockfile, verifies M23/M24, runs ESLint and strict TypeScript, executes FuelTrack+ regressions, browser/CDP/dev/build/dist/preview gates, and delegates final promotion to the Stage E certifier. M24 moves through `implementation-complete-pending-certification` → `active-pending-release-certification` → `active-certified` only if the complete production release gate passes.

M24 has no Supabase migration. Apache ECharts is exact-pinned at 6.1.0 and is loaded through a dedicated Analytics-only Vite entry.
