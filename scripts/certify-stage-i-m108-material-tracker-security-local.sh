#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
test "$(node -v)" = 'v22.16.0'; test "$(npm -v)" = '10.9.2'
echo '============================================================'
echo 'M108 MATERIAL TRACKER SECURITY CORRECTIVE LOCAL CERTIFICATION'
echo '============================================================'
node scripts/verify-stage-i-m108-m107-source-guard.mjs
node scripts/verify-stage-i-m107-m106-source-guard.mjs
node scripts/verify-material-tracker-integration.mjs
node scripts/scan-secrets.mjs
rm -rf integrations/material-tracker/node_modules integrations/material-tracker/dist apps/material-tracker
npm --prefix integrations/material-tracker ci --ignore-scripts
node <<'NODE'
const {execFileSync}=require('node:child_process');
const out=execFileSync('npm',['--prefix','integrations/material-tracker','ls','source-map-js','--all','--json'],{encoding:'utf8'});
const tree=JSON.parse(out); const seen=[];
const walk=n=>{if(!n||typeof n!=='object')return;for(const [name,d] of Object.entries(n.dependencies||{})){if(name==='source-map-js')seen.push(d.version);walk(d)}};walk(tree);
if(!seen.length||seen.some(v=>v!=='1.2.2')){console.error('FAIL source-map-js resolution',seen);process.exit(1)}
console.log('PASS source-map-js resolution 1.2.2');
NODE
npm --prefix integrations/material-tracker audit
npm --prefix integrations/material-tracker run check:integration
npm --prefix integrations/material-tracker run check:static
npm --prefix integrations/material-tracker run check:data-clean
npm --prefix integrations/material-tracker run test:deterministic
npm --prefix integrations/material-tracker run test:regression
npm --prefix integrations/material-tracker run test:exports
npm --prefix integrations/material-tracker run test:import-export
npm --prefix integrations/material-tracker run check:package
npm --prefix integrations/material-tracker run build
test -f integrations/material-tracker/dist/index.html
rm -rf node_modules dist coverage test-results playwright-report
npm ci
npm run dependencies:ensure
npm audit --audit-level=high
npm run material-tracker:integration:check
npm run typecheck
node <<'NODE'
const fs=require('node:fs');
const cfg=fs.readFileSync('eslint.config.mjs','utf8');
if(!cfg.includes("'integrations/material-tracker/**'")){
  console.error('FAIL root ESLint does not preserve isolated Material Tracker lint boundary');
  process.exit(1);
}
console.log('PASS root ESLint preserves isolated Material Tracker lint boundary');
NODE
npm run lint
npm run build
test -f apps/material-tracker/index.html
test -f dist/apps/material-tracker/index.html
node scripts/verify-stage-i-m108-m107-source-guard.mjs
echo 'PASS M108 source guard ignores only deterministic apps/material-tracker deployment output while preserving authoritative integration-source governance'
npm run verify:vite
npm run verify:dist
npm run verify:preview
node verify-v1432-embedded-runtime-production.mjs
node --experimental-strip-types --disable-warning=ExperimentalWarning verify-v1220-architecture-restructure.mjs
npm run release:check
npm run verify:historical-all
# Runtime/build verification above requires generated module outputs. Remove only
# reproducible generated state before repository source-integrity validation.
rm -rf integrations/material-tracker/node_modules integrations/material-tracker/dist apps/material-tracker
node scripts/verify-stage-i-m108-m107-source-guard.mjs
node scripts/verify-material-tracker-integration.mjs
node scripts/scan-secrets.mjs
node scripts/verify-stage-h-m60-color-theme-contrast-execution.mjs
node scripts/verify-stage-h-m74-time-tracker-ui-harmonization-execution.mjs
node scripts/verify-stage-h-m75-fueltrack-plus-ui-harmonization-execution.mjs
node scripts/verify-stage-h-m76-tradelink-ui-harmonization-execution.mjs
node verify-stage-e-m26-iframe-retirement.mjs
node verify-stage-i-m83-authentication-account-surfaces.mjs
node --experimental-strip-types --disable-warning=ExperimentalWarning verify-v1380-typescript-runtime.mjs
node --experimental-strip-types --disable-warning=ExperimentalWarning verify-v1220-architecture-restructure.mjs
node scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs
echo 'M108 MATERIAL TRACKER SECURITY CORRECTIVE LOCAL CERTIFICATION: PASS'
