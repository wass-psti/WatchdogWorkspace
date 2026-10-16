import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Fail-closed M145 CI routing contract: unchanged historical checkers run on
// authenticated original Git commit; current-source testing is delegated to
// the current-core workflow. Deployment is NOT authorized by this gate.
const root = fileURLToPath(new URL('..', import.meta.url));
const read = rel => readFileSync(path.join(root, rel), 'utf8');
const ci = read('.github/workflows/ci.yml');
const successor = read('.github/workflows/m145-clean-platform-successor.yml');
const manifest = JSON.parse(read('M145-REMOVAL-MANIFEST.json'));
const must = (condition, reason) => assert.ok(condition, `M145 CI routing BLOCKED: ${reason}`);
must(manifest.baseReleaseCommit === '994e925898fa7de596050cd06ec68a5a94a7c92b', 'predecessor SHA drift');
must(manifest.scope.length === 4 && manifest.scope.every(id=>['time-tracker','fueltrack-plus','tradelink','material-tracker'].includes(id)), 'removal scope drift');
must(manifest.cloudMutation === false && manifest.newApplicationAdded === false, 'cloud/integration scope drift');
must(/on:\s*\n\s*pull_request:/.test(ci) && /branches:\s*\[?main\]?/.test(ci), 'CI trigger drift');
must(ci.includes('uses: ./.github/workflows/m145-clean-platform-successor.yml'), 'CI must invoke reviewed reusable successor');
must(!/^\s*run:/m.test(ci), 'CI may not invoke any old standalone release command');
must(/on:\s*\n\s*workflow_call:/.test(successor), 'successor must be reusable');
must(successor.includes('branches: [m145/remove-legacy-apps-staging]'), 'staging trigger missing');
must(!/\n\s*pull_request:/.test(successor), 'duplicate pull-request execution of M145 successor');
for (const evidence of [
 'prepare-m108-baseline', '994e925898fa7de596050cd06ec68a5a94a7c92b',
 'verify-m145-predecessor-provenance.mjs','verify-m145-clean-platform.mjs',
 'verify-m145-successor-core.mjs', 'verify-m145-ci-routing.mjs',
 'npm ci','npm run typecheck','npm run lint:eslint','npm run build',
 '--dist', 'dist/SHA256SUMS.txt', 'upload-artifact@v7',
 'include-hidden-files: true', 'if-no-files-found: error',
]) must(successor.includes(evidence), `required release step missing: ${evidence}`);
for (const forbidden of [
 'npm run release:check','npm run cutover:check','npm run cutover:evidence',
 'npm run timetracker-stabilization:check','npm run fueltrack-stabilization:check',
 'npm run tradelink-stabilization:check','npm run verify:historical-all',
]) must(!successor.includes(forbidden), `historical old-source command invoked on decommissioned release: ${forbidden}`);
for(const file of ['verify-stage-f-m36-production-cutover-certification.mjs','scripts/verify-all-historical-verifiers.mjs','scripts/verify-m108-login-successor.mjs']){
 must(read(file).length>500, `historical verifier missing: ${file}`);
}
console.log('M145 CI routing: PASS (original M108 on exact predecessor; current-core build delegated once; deploy remains NOT certified).');
