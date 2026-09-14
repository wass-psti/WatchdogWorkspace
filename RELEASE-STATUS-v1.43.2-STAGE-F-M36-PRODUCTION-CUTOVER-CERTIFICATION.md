# Stage F M36 — Production Cutover Certification

**Implementation state:** implementation-complete-pending-certification  
**Architecture:** 44  
**Prerequisite:** M35 Final legacy deletion — active-certified (carried forward from the supplied successful certification run).

## Implemented

- Architecture 44 production-cutover policy and manifest authority.
- Fail-closed production `dist/` verifier for required assets, hashed Vite entrypoints, no public source maps, executable development-host/Vite-client leakage, and executable source-entry references.
- Corrective `executable-reference-only-v2` + `network-resource-reference-only-v2` policies that allow non-executable source identity metadata and localhost/loopback validation values while still rejecting browser-loadable source/development references.
- M36 execution-vector regression harness covering valid artifacts, allowed metadata, and fail-closed source/development leak cases.
- SHA-256 artifact manifest and cutover provenance generator.
- Transactional M36 activator and dedicated certification runner.
- Dedicated Production Cutover GitHub Actions workflow.
- CI/deploy integration for the M36 source/execution/artifact gates.
- GitHub Pages post-deploy HTTPS entrypoint and service-worker smoke checks.
- Explicit rollback authority and external operational evidence requirements.

## Corrective cause and resolution

The dependency-enabled certification run reached the production artifact gate after the production Vite build and `verify:dist` had already passed. The original artifact verifier then rejected `src/main.ts` found inside a generated JavaScript chunk. That occurrence was application metadata (`performanceStartupInstrumentation`) rather than an executable browser reference. `.vite/manifest.json` also legitimately records `src/main.ts` as Vite source identity metadata.

The original blanket text rule was therefore over-broad. It has been replaced with semantic executable-reference checks. The release-mode activator's fail-closed transaction behaved correctly: the failed release gate did not persist M36 certification.

## Verified baseline from the dependency-enabled certification run

The supplied certification log establishes:

- Node 22.16.0 / npm 10.9.2 and exact dependency preflight — PASS;
- governance, security, secret scan, ESLint, TypeScript, and audit — PASS;
- historical verifier collect-all — **145/145 PASS**;
- modern unit/component coverage gate — PASS;
- Playwright real-browser smoke — PASS;
- bounded-CDP parity and Vite development smoke — PASS;
- local Supabase pgTAP Database/RLS suite — **87/87 PASS**;
- M31 performance microbenchmarks and production bundle budgets — PASS;
- Vite production build, dist verification, service-worker dist gate, and preview smoke — PASS;
- M35 Final legacy deletion release activation — **PASS / active-certified**; this certified state is carried into the corrective source baseline because the M35 activator mutates only its governed activation-state authority after all required M35 release gates pass.

## Corrective RC verification

Executed against this corrected source package:

- `node --check scripts/verify-production-cutover-artifact.mjs` — PASS;
- `node --check scripts/verify-production-cutover-execution.mjs` — PASS;
- `node --check verify-stage-f-m36-production-cutover-certification.mjs` — PASS;
- `npm run cutover:check` — PASS (Architecture 44; 26 assertions);
- `npm run cutover:test` — PASS (18 vectors; 3 allowed metadata/policy vectors; 14 fail-closed vectors);
- `npm run governance:package` — PASS;
- `npm run security:check` — PASS;
- `npm run legacy-deletion:check` — PASS;
- `npm run legacy-deletion:test` — PASS (17 assertions).

## Retained certified boundaries

- **M26:** TimeTracker, FuelTrack+, and TradeLink remain same-origin iframe compatibility islands until independent native-retirement gates justify removal.
- **M28:** the protected user-management RPC remains authoritative until `admin-sync-auth-access` is externally deployed with server-only credentials and separately enabled.
- **M30:** bounded-CDP remains a required browser parity backstop beside Playwright.
- **M34:** provider backup/PITR and encrypted off-client recovery-package retention remain external operational responsibilities.

## Remaining certification work

No additional business-domain implementation is required by this corrective. M36 remains `implementation-complete-pending-certification` until all of the following complete successfully on the corrected package:

1. regenerate the real production `dist/`;
2. rerun `npm run release:check`, including the corrected `cutover:artifact` gate;
3. complete release-mode M36 activation/certification and generate SHA-256/provenance evidence;
4. deploy only the certified `dist/` through the governed GitHub Pages workflow;
5. pass the post-deploy HTTPS entrypoint and `service-worker.js` smoke checks; and
6. retain/record the external operational evidence required by the cutover runbook.

External prerequisites remain: production Pages permissions/environment, correct public Supabase client variables and Auth redirects, retained last-known-good source/dist rollback evidence, provider backup/PITR evidence, encrypted recovery-package retention, and separately governed M28 Edge Function deployment before RPC authority can be retired.
