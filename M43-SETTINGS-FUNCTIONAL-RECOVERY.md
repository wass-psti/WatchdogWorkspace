# M43 — Settings Functional Recovery

M43 restores Settings as an operational control plane instead of a presentation-only page. The milestone deliberately reuses the established preference, M34 backup/disaster-recovery, M39 authentication, module registry, and browser Storage API authorities.

## Browser-required actions

The dedicated M43 Playwright suite exercises theme selection, density toggling, compatibility scanning, storage-health refresh, persistent-storage request, authentication/backend refresh, platform diagnostics, backup export, guarded backup restore, and scoped preference reset. Reload assertions are mandatory for theme/density, diagnostic evidence, persistent-storage status, and the backup/restore round trip.

## Persistence boundary

`wm.platform.settings.evidence.v1` stores only bounded diagnostic results: check identifiers, labels, details, pass/fail values, and timestamps. Authentication sessions and derived identity remain excluded from workspace backup by the existing backup authority.

## Post-certification active-candidate gate corrective — 2026-09-16

The finalizer now performs the historical regression suite and production Vite build against the isolated **active-certified** staged candidate itself, rather than relying on the still-pending repository source for those two post-state gates. The staged candidate temporarily links to the already-governed dependency tree, executes `verify-project.sh` plus the production Vite build, removes the dependency bridge and all generated outputs, rechecks the active-certified state and certification-tree digest, and only then proceeds to secret scanning, checksums, ZIP creation and PASS-record publication. This preserves the pending source authority while making the PASS record's post-certification historical/build claims directly evidenced by the package candidate that is ultimately published.

### Certification-state blind-spot closure

Because the M43 certification-tree digest deliberately excludes the mutable M43 target and release-status records, the finalizer now asserts that the authoritative repository copies remain `implementation-complete-pending-certification` after all pre-certification gates and again after the staged active-certified post-state historical/build gates. This prevents a state-record mutation from being hidden by the intentional digest exclusion.
