# M81 Corrective Loop — Shell M2 Successor Ownership

- Loop origin: M81 corrective-v1 local certification, Stage 4 `verify:ui`.
- Failed verifier: `verify-v1432-shell-primary-sidebar-sm2.mjs`.
- Exact condition: the historical verifier required the literal `className="shell-navigation-scroll"` to remain in `WorkManagementShell.tsx`.
- Root-cause class: verification / successor-governance.
- M81 ownership change: `WorkManagementShell` now composes `WMShellNavigationScroll`; that primitive owns the unchanged `shell-navigation-scroll` runtime class.
- Corrective delta: preserve the legacy literal assertion when M81 is absent; when the M81 successor authority is present, verify import/composition, primitive class ownership, and that the primary navigation landmark remains nested inside the scroll region.
- Regression protection: M81 source guard explicitly authorizes only this historical verifier synchronization, and the M81 architecture verifier requires the successor-aware checks.
- Exit criterion: complete `verify:ui`, then the full ordered fail-closed M81 certification pipeline.
