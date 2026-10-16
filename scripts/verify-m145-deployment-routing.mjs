import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// M145 fail-closed release-routing contract. This proves wiring, not a live
// deployment, authenticated browser check or legacy M36 source-test PASS.
const root=fileURLToPath(new URL('..',import.meta.url));
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const pages=read('.github/workflows/deploy-pages.yml');
const cutover=read('.github/workflows/production-cutover.yml');
const successor=read('.github/workflows/m145-clean-platform-successor.yml');
const manifest=JSON.parse(read('M145-REMOVAL-MANIFEST.json'));
const must=(condition,reason)=>assert.ok(condition,`M145 deployment BLOCKED: ${reason}`);
const archived=['time-tracker','fueltrack-plus','tradelink','material-tracker'];
must(manifest.scope.length===4 && archived.every(id=>manifest.scope.includes(id)), 'retirement scope drift');
must(manifest.cloudMutation===false && manifest.newApplicationAdded===false, 'unauthorized cloud or integration change');
must(/on:\s*\n\s*push:\s*\n\s*branches: \[main\]/.test(pages), 'Pages must only deploy from main');
must(!pages.includes('m145/remove-legacy-apps-staging'), 'staging must never be a Pages deployment trigger');
must(pages.includes('uses: ./.github/workflows/m145-clean-platform-successor.yml'), 'Pages missing required predecessor-backed core certifier');
must(pages.includes('runtime_environment: production'), 'Pages must use production-mode certified artifact');
must(cutover.includes('runtime_environment: production'), 'manual cutover must use production-mode certifier');
must(successor.includes("VITE_RUNTIME_ENV: ${{ inputs.runtime_environment || 'ci' }}") && successor.includes('runtime_environment:'), 'reusable gate lacks constrained runtime input');
must(successor.includes('m145-clean-platform-${{ github.workflow }}-${{ github.ref }}'), 'concurrency can cancel independent release workflows');
must(pages.includes(`test "$GITHUB_REF" = 'refs/heads/main'`), 'Pages manual dispatch could deploy staging branch');
must(pages.includes('needs: [authorize-main]'), 'certifier must fail closed on non-main ref');
must(pages.includes('needs: [certify-current-core]'), 'Pages artifact not gated on successful M145 certification');
must(pages.includes('name: watchdog-m145-core-dist-${{ github.sha }}'), 'incorrect CI artifact identity');
must(pages.includes('uses: actions/download-artifact@v4'), 'Pages must download exact CI artifact, not rebuild');
must(pages.includes('( cd dist && sha256sum -c SHA256SUMS.txt )'), 'downloaded release checksum not authenticated');
must(pages.includes('needs: [prepare-pages]'), 'deploy not gated on authenticated Pages artifact');
must(pages.includes('uses: actions/upload-pages-artifact@v4') && pages.includes('uses: actions/deploy-pages@v5'), 'Pages upload/deploy missing');
must(pages.includes('wm_deployment_contract_attestation') && pages.includes('wm_import_board_items_atomic'), 'Board Import cloud contract cannot be weakened');
must(pages.includes('apps/time-tracker/index.html') && pages.includes('apps/fueltrack-plus/runtime.html') && pages.includes('apps/tradelink/runtime.html') && pages.includes('apps/material-tracker/index.html'), 'retired URL deny smoke missing');
must(/on:\s*\n\s*workflow_dispatch:\s*\n/.test(cutover) && !/\n\s*push:/.test(cutover) && !/\n\s*pull_request:/.test(cutover), 'cutover may only run manually');
must(cutover.includes('expected_main_sha') && cutover.includes('test "$EXPECTED_MAIN_SHA" = "$GITHUB_SHA"'), 'manual cutover SHA not pinned');
must(cutover.includes('uses: ./.github/workflows/m145-clean-platform-successor.yml'), 'manual cutover must run same certification');
for(const old of ['npm run release:check','npm run cutover:artifact','npm run cutover:evidence','npm run verify:historical-all','npm run timetracker-stabilization:check','npm run fueltrack-stabilization:check','npm run tradelink-stabilization:check']) {
 must(!pages.includes(old) && !cutover.includes(old),`historical module-only command re-enabled on current source: ${old}`);
}
for(const required of ['verify-m145-predecessor-provenance.mjs','verify-m145-successor-core.mjs','npm run typecheck','npm run lint:eslint','npm run build','dist/SHA256SUMS.txt']) must(successor.includes(required),`successor prerequisite missing ${required}`);
for(const historical of ['scripts/verify-all-historical-verifiers.mjs','verify-stage-f-m36-production-cutover-certification.mjs','scripts/verify-m108-login-successor.mjs']) must(read(historical).length>500,`historical verifier absent ${historical}`);
console.log('M145 deployment routing: PASS (Pages gated; manual SHA-pinned cutover; original historic scripts preserved; NOT DEPLOYED)');
