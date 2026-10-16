#!/bin/bash
# M145 isolated local acceptance. No deployment or cloud data mutations.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
fail(){ echo "BLOCKED: $*" >&2; exit 2; }
[[ "$(node --version)" == 'v22.16.0' ]] || fail 'Node 22.16.0 required'
[[ "$(npm --version)" == '10.9.2' ]] || fail 'npm 10.9.2 required'
: "${M108_BASELINE_ARCHIVE:?point to certified original M108 ZIP}"
[[ -n "${M145_PREDECESSOR_DIR:-}" || -n "${M145_PREDECESSOR_ARCHIVE:-}" ]] || fail "M145_PREDECESSOR_DIR or M145_PREDECESSOR_ARCHIVE required"
command -v unzip >/dev/null || fail 'unzip missing'
command -v shasum >/dev/null || fail 'shasum missing'
command -v node >/dev/null || fail 'node missing'
command -v npm >/dev/null || fail 'npm missing'
echo '== 01 Authenticate predecessor and test frozen M108 source guards there =='
node scripts/verify-m145-predecessor-provenance.mjs
echo '== 02 Verify all M145 modifications, removals and protected-core bytes =='
node scripts/verify-m145-clean-platform.mjs
echo '== 03 Locked dependency installation; no destructive tests =='
npm ci
echo '== 04 TypeScript and lint targeted to current source =='
npm run typecheck
npm run lint:eslint
echo '== 05 Build proposed static web release =='
npm run build
echo '== 06 Verify no legacy app entrypoint emitted =='
node --input-type=module <<'NODE'
import fs from 'node:fs';
const no = ['apps/time-tracker/','apps/fueltrack-plus/','apps/tradelink/','apps/material-tracker/'];
const walk=(p)=>fs.readdirSync(p,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(p+'/'+x.name):[p+'/'+x.name]);
if(!fs.existsSync('dist/index.html'))throw new Error('No generated host index');
for(const file of walk('dist')){
  if(no.some(x=>file.includes(x)))throw new Error('Retired app emitted: '+file);
}
console.log('PASS: no retired apps in generated dist; index.html present');
NODE
echo '== 07 Post-build source-integrity gate =='
node scripts/verify-m145-clean-platform.mjs
echo 'IMPLEMENTATION VERIFIED LOCALLY; CI, historical successor gate integration and authenticated acceptance remain required.'
