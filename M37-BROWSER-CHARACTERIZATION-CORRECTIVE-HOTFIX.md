# M37 Browser Characterization Corrective Hotfix

## Trigger

The first operator certification run did not reach `active-certified`. The M37-specific authenticated fixture run reported missing Account/Users/Settings management views in one execution, and another execution showed the Settings diagnostics button repeatedly detaching. The later generic M30 Playwright run also executed the M37 fixture suite without the dedicated fixture Vite environment, causing M37 tests to fail inside `release:check`.

## Corrective scope

This hotfix changes the M37 characterization/certification harness only. It does not claim to repair Boards, Users, Settings, or Account product functionality.

- Authenticate and hydrate the fixture at `/#/` before entering a protected target route.
- Make all injected backend failures opt-in per scenario.
- Navigate to the target module only after the fixture identity is proven active and `admin_general_manager`.
- Write evidence even when the module mount/action path fails unexpectedly.
- Require all eight exact M37 evidence records rather than accepting a raw file count.
- Reject captured credential material in generated evidence.
- Restrict the M30 Playwright runner to its original `application-smoke.spec.mjs` authority so release certification does not execute M37 environment-specific tests under blank backend configuration.
- Run M37 browser characterization before historical/release gates during activation so harness defects fail fast.

## Product-remediation boundary

Application-level fixes remain outside M37. M38+ owns runtime/backend preflight, auth/session stabilization, route ownership, Account, Users, Settings, Boards recovery, authenticated role-matrix E2E, and final production-readiness certification.
