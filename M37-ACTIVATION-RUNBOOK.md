# M37 Activation Runbook — Functional Regression Baseline

Prerequisite: Stage F M36 must be `active-certified`.

M37 activation is fail-closed. It first moves to `active-pending-browser-certification`, verifies the static/source characterization, executes the two-mode Playwright characterization and generates redacted evidence, then runs the historical/release gates, and only after all of those pass writes `active-certified`. Running the browser characterization before the expensive historical/release gates makes fixture defects fail fast without weakening certification.

M37 certification does not close the reported functional regressions; it certifies the baseline used by M38+ to repair them.


## Corrective browser-harness requirements

- Each authenticated fixture boots at `/#/`, proves the expected Admin/General Manager identity, and only then navigates to Account, Users, Settings, or Boards.
- Backend failures are opt-in per scenario; Account does not inherit Users/Boards/health failures, and so on.
- Evidence is written in `finally` paths so an unexpected mount/action failure still produces a diagnostic record.
- The M30 generic Playwright smoke runs only `tests/modern/e2e/application-smoke.spec.mjs`; M37 characterization runs only through `scripts/run-functional-regression-browser.mjs` under its required Vite environments.
- Certification requires all eight exact M37 evidence files and rejects evidence containing credential material.
