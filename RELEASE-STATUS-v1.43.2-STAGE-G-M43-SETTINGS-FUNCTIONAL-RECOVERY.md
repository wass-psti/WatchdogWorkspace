# Work Management v1.43.2 — Stage G M43 Settings Functional Recovery

- **State:** implementation-complete-pending-certification
- **Architecture Version:** 51
- **Prerequisite:** M42 Users / RBAC Functional Recovery = active-certified
- **Scope:** theme, density, application compatibility, storage health, persistent storage, diagnostics, backup export/restore, preference reset, authentication/backend status, and reload persistence
- **Database migration required:** No
- **Existing authorities retained:** M34 backup/disaster recovery; M39 authentication/session/access context; M26 embedded application compatibility boundaries

## Recovery implementation

Settings now owns a reload-resilient control-plane presentation over the existing certified authorities. Theme and density remain in `wm.platform.preferences.v1`. Compatibility, diagnostics, and authentication/backend verification evidence use the bounded `wm.platform.settings.evidence.v1` record so completed checks remain visible after expected reloads without persisting credentials or server secrets. Storage health is intentionally re-queried because quota and persistence capability are browser-runtime facts.

The Authentication backend row now provides an explicit **Refresh backend status** operation backed by `auth.diagnostics()`. Entering Settings also refreshes storage health and backend status, preventing stale status presentation after route transitions.

Backup export/restore continues to use the M34 recovery package, integrity verification, pre-restore checkpoint, and transactional backend restore. M43 browser coverage performs an actual export → preference mutation → guarded restore → reload round trip.

## Required certification

M43 remains fail closed until the exact source revision passes static verification, deterministic Settings evidence tests, real-browser Settings action coverage, M34 backup/disaster-recovery regression, TypeScript, security, UI, historical project verification, and build gates. Only an `active-certified` source revision may produce the M43 certified baseline artifact and PASS record.

## Post-certification gate sequencing corrective — 2026-09-16

The M43 finalizer now runs historical regression verification and the production Vite build against the staged **active-certified** candidate before package hygiene and PASS-record publication. Repository source remains `implementation-complete-pending-certification` until a hosted artifact transaction succeeds; the staged candidate must remain source-digest-identical and `active-certified` after those post-state gates.

The finalizer also explicitly revalidates the pending authoritative target/status records after pre-certification gates and after active-candidate post-state gates, closing the intentional certification-digest exclusion boundary for those two mutable state records.
