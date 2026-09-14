# Stage F M35 — Final Legacy Deletion
State: implementation-complete-pending-certification
Architecture: 43
Deleted: expired M3 composition identity, dead imperative shell serializer, expired M33 SKIP_WAITING alias.
Retained by certification evidence: typed route-content runtime, M26 iframe islands, M34 backup read compatibility, historical audit evidence.
Historical verifier synchronization: M24 ECharts verifier now recognizes the M31-certified tree-shaken ECharts 6.1.0 authority at Architecture 39+.
Shell historical verifier synchronization: Shell M1/M2/M4/M7 and collapse-control verifiers now validate React-owned presentation in WorkManagementShell.tsx at Architecture 43+ while requiring deleted imperative helper/serializer code to remain absent.
Settings/backup historical verifier synchronization: verify-settings.mjs now recognizes the M34 guarded restore authority at Architecture 42+ (inspect/preflight/checkpoint/restoreWorkspaceBackupGuarded) while retaining historical direct restore expectations for older architectures.
M35 workflow hardening: final-legacy-deletion.yml now executes Settings/backup, M24/M31 ECharts, and complete Shell/UI historical authorities before the M35 deletion gates.


## Corrective-4 certification harness hardening
M35 now requires `npm run verify:historical-all` before fail-fast release certification. This collect-all preflight executes every root historical verifier and reports all failures together. `verify-settings.mjs` also supplies a complete event-dispatch browser stub and verifies the M34 `wm:backup-dr` import-preflight event. See `M35-CERTIFICATION-HARNESS-COLLECT-ALL-HOTFIX.md`.
