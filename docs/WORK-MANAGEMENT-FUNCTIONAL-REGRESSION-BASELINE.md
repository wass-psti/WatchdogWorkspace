# Work Management — Stage G M37 Functional Regression Baseline

## Purpose

M37 reopens functional stabilization after the Architecture 44/M36 production-cutover certification because **Boards, Users, Settings, and Account are reported as no longer functional**. M37 is deliberately a **characterization and evidence milestone, not a remediation milestone**. It prevents later fixes from being based on assumptions by creating deterministic failure signatures and a repeatable browser evidence harness.

## What M37 captures

Every browser characterization record captures the following without storing access tokens, refresh tokens, authorization headers, publishable keys, or passwords:

- console warnings/errors;
- uncaught page errors;
- failed network requests;
- bounded/redacted Supabase backend responses;
- URL/hash route state;
- runtime route context;
- authentication/session presence and redacted identity context;
- React/imperative DOM ownership and hidden/inert state;
- visible route failure references.

Evidence is written to `m37-evidence/` and summarized by `scripts/generate-functional-regression-evidence.mjs`. The generator requires eight exact scenario files (four unconfigured plus four authenticated-fixture records), rejects incomplete/harness-error records, and reports credential-material capture as a certification failure condition.

## Required scenarios

### 1. Checked-in unconfigured backend

The repository intentionally checks in an empty public Supabase URL/key fallback. When Vite is started without `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, cloud authentication enters `setup-required`. M37 explicitly characterizes protected-route behavior for Boards, Users, Settings, and Account so local environment setup is not confused with a UI regression.

### 2. Deterministic authenticated Supabase fixture

A Playwright route fixture supplies a valid administrator identity/profile/module-role mapping. Each authenticated scenario first boots the application at `/#/`, proves the fixture identity is authenticated and active, and only then navigates to its target route. RPC/health failures are opt-in per scenario so unrelated injected failures cannot contaminate the characterization. This separates frontend route/DOM ownership from backend/schema/RPC failures and produces stable evidence for:

- Account profile mutation failure;
- Users directory RPC failure;
- Settings Auth health/diagnostics failure;
- Boards React-host handoff or Board RPC failure.

### 3. Live backend evidence

Live Supabase evidence is optional in M37 because it requires operator credentials/configuration and must never be embedded in the repository. It becomes mandatory in later functional recovery and production-readiness milestones.

## Confirmed baseline findings

1. **Certification gap:** the pre-M37 Playwright application smoke boots `/#/login`; it does not sign in and exercise Boards, Users, Settings, or Account workflows.
2. **Boards lifecycle boundary:** `assets/js/app.ts` publishes Board facade state and immediately invokes the imperative Board renderer. `resolveBoardPresentationHost()` throws if React has not committed the host. This is now a deterministic, named characterization boundary.
3. **Backend/environment distinction:** checked-in `config/backend-config.js` contains no project URL/key by design. Protected routes cannot be treated as functional in a bare local run.
4. **Users RPC authority:** `list_user_directory` and `admin_set_user_access` remain the certified browser authority until the M28 Edge Function is actually deployed and separately cut over.
5. **Duplicate management technical debt:** older Account/Settings/User-management feature authorities remain exported/listed while React `AuthenticatedManagementUI` owns those routes. M37 records this; M44 is the planned consolidation milestone.

## M37 does not claim

M37 does **not** claim that Boards, Users, Settings, or Account are repaired. A successful M37 certification means the regressions are reproducible/characterized and evidence collection is trustworthy. Functional repair begins in M38 and subsequent recovery milestones.

## Certification commands

```bash
npm ci
npm run functional-regression:check
npm run functional-regression:test
npm run functional-regression:browser
npm run functional-regression:evidence
bash scripts/certify-stage-g-m37.sh
npm run functional-regression:status
```

## Retained boundaries

- React Board presentation host + imperative Board engine remain a temporary characterized boundary.
- Users retain protected Supabase RPC authority until the Edge Function deployment/cutover is externally certified.
- TimeTracker, FuelTrack+, and TradeLink remain the M26 certified same-origin iframe compatibility islands.
- Public Supabase URL/publishable key remain environment configuration only; privileged server secrets are forbidden in browser code.

## Downstream work

M38+ must repair environment/backend preflight, auth/session/access context, React/runtime route ownership, Account, Users, Settings, Boards collection/backend/table/cells/Kanban/item workspace/realtime, cross-role authenticated E2E, quality hardening, and final functional production-readiness certification.


## Browser-harness corrective after first certification attempt

The first local M37 certification attempt exposed two test-harness defects that are now corrected in this RC continuation:

1. Authenticated scenarios navigated directly to protected routes before proving the fixture session had completed bootstrap/hydration. The corrected harness proves `authenticated=true`, `admin_general_manager`, and active account state first, then uses same-document hash navigation to isolate the target module.
2. The generic M30 Playwright runner discovered `functional-regression-baseline.spec.mjs` during `release:check` even though that suite requires the dedicated M37 Vite fixture environment. The M30 runner is now explicitly scoped to `application-smoke.spec.mjs`; M37 browser tests run only through their dedicated runner.

The failed attempt also demonstrated why evidence must be written on failure paths. The corrected suite writes a redacted record even when a target management view is absent or an interaction cannot reach the intended backend signature. Those states are characterized as application regression evidence only after fixture authentication and route context have been independently proven.
