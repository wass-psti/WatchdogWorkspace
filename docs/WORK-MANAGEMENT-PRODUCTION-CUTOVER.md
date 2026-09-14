# Work Management — Stage F M36 Production Cutover Certification

M36 is the final Stage F production-cutover authority for Work Management v1.43.2. It certifies the exact source baseline, the production build, the deployable `dist/` artifact, artifact integrity/provenance, the GitHub Pages dist-only deployment path, rollback readiness, and the post-deploy HTTP smoke boundary.

## Prerequisite

M35 Final legacy deletion must be `active-certified`. M36 must not bypass, auto-weaken, or reinterpret an M35 failure. If M35 or any retained Stage F gate fails, M36 remains `implementation-complete-pending-certification`.

## Source and release gates

Certification requires a clean governed Node/npm toolchain and exact lockfile dependency graph. The full historical regression, security/governance gates, M27-M35 Stage F authorities, M29 local pgTAP database/RLS suite, M30 modern tests and coverage, Playwright, bounded-CDP parity, ESLint/TypeScript, dependency audit, Vite development/build/dist/preview verification, M31 performance budgets, M33 service-worker artifact checks, and M34 recovery checks remain release authorities.

## Production artifact authority

`scripts/verify-production-cutover-artifact.mjs` fails closed unless the built `dist/` contains the required Work Management production runtime, hashed Vite JS/CSS entries, the v1.43.2 service worker identity, no source maps, and no executable development/source references such as `localhost`, `127.0.0.1`, Vite client code, `%BASE_URL%`, HTML source-entry URLs, JavaScript static/dynamic source-entry imports, worker/network source-entry URLs, or CSS source-entry URLs. Vite and application metadata may legitimately retain source identity strings such as `src/main.ts`; observability/security code may also retain localhost/loopback values for parsing or policy comparison. Those non-executable values are explicitly allowed, while actual network/resource references remain forbidden and the Vite/dist verifiers separately constrain emitted production entrypoints.

`scripts/generate-production-cutover-evidence.mjs` emits:

- `dist/SHA256SUMS.txt` for every deployable production file except the manifest itself; and
- `cutover-evidence/CUTOVER-PROVENANCE.json` plus `cutover-evidence/DIST-SHA256SUMS.txt` containing the package-lock SHA-256, source commit when available, workflow/run identity when available, artifact count, and checksum-manifest SHA-256.

The evidence contains no Supabase secret or privileged server credential.

## Deployment authority

`.github/workflows/deploy-pages.yml` remains the production deployment authority. It must:

1. obtain only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as public client configuration;
2. execute governed M36 source/execution gates and the complete release gate;
3. verify the real production artifact and generate cutover evidence;
4. upload only `./dist` to GitHub Pages; and
5. perform a post-deploy HTTPS smoke for the deployed entrypoint and `service-worker.js`.

The dedicated `.github/workflows/production-cutover.yml` independently certifies and retains the production artifact/evidence without changing production data.

## External operational prerequisites

The static repository cannot prove infrastructure facts that exist only in GitHub/Supabase/operator systems. Formal live cutover additionally requires external operational evidence that:

- the GitHub Pages production environment and permissions are configured;
- the production Supabase public URL/publishable key variables are correct;
- Supabase Auth Site URL and Redirect URLs match the deployed HTTPS Pages base URL;
- provider-level database backup/PITR and encrypted recovery-package retention are current; and
- a last-known-good certified source ZIP SHA-256 and matching production dist artifact are retained before promotion.

These checks are not replaced by source assertions.

## Retained compatibility boundaries

M36 does not misclassify certified live boundaries as unfinished cutover work:

- **M26 module presentation:** TimeTracker, FuelTrack+, and TradeLink remain same-origin iframe compatibility islands until their native retirement gates are satisfied.
- **M28 Edge Function deployment:** the protected user-management RPC remains authoritative until `admin-sync-auth-access` is externally deployed with server-only credentials and separately enabled. M36 does not make the static client depend on an undeployed server function.
- **M30 browser parity:** Playwright is the modern browser-test layer; bounded CDP remains a required parity backstop for this cutover.
- **M34 infrastructure recovery:** provider backup/PITR, encrypted retention, and operating-system persistence of downloaded recovery checkpoints remain external operational responsibilities.

## Rollback

The rollback authority is `redeploy-last-known-good-certified-dist-v1`. Before production promotion, retain the previous certified source ZIP SHA-256 and deployable dist artifact. Application rollback is a redeploy of that certified artifact. M36 does not automate destructive database rollback. If a data restore is required, use the M34 guarded restore flow with preflight and a retained pre-restore checkpoint.

## Certification rule

M36 can reach `active-certified` only after M35 is already `active-certified` and the release-mode M36 activator completes without failure. Any failed gate restores the M36 target state transactionally. A source package that has not executed the release-mode chain and external production deployment evidence must be described as a release candidate, not as a completed live production cutover.
