import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'M108-M107-BASELINE-SOURCE-MANIFEST.json'),'utf8'));
if(manifest.checkpoint!=='M107'||manifest.artifactSha256!=='df8cfc1b0f77cfa5f6d2350a59418af76815676fafdd472e37bbcc4fae9bf0cb'){console.error('M108 M107 source guard: FAIL provenance');process.exit(1)}
const baseline=new Map(manifest.entries.map(e=>[e.path,e]));
const allowedMutations=new Set([
'integrations/material-tracker/package.json',
'integrations/material-tracker/package-lock.json',
'integrations/material-tracker/vite.config.js',
'integrations/material-tracker/tailwind.config.js',
'integrations/material-tracker/src/index.css',
'integrations/material-tracker/docs/SECURITY_DEPENDENCIES.md',
'integrations/material-tracker/scripts/deterministic-tests.mjs',
'scripts/verify-stage-i-m107-m106-source-guard.mjs',
'eslint.config.mjs',
'scripts/verify-stage-h-m60-color-theme-contrast-execution.mjs',
'scripts/verify-stage-h-m74-time-tracker-ui-harmonization-execution.mjs',
'scripts/verify-stage-h-m75-fueltrack-plus-ui-harmonization-execution.mjs',
'scripts/verify-stage-h-m76-tradelink-ui-harmonization-execution.mjs',
'verify-stage-e-m26-iframe-retirement.mjs',
'verify-v1380-typescript-runtime.mjs',
'scripts/verify-performance-budgets.mjs',
'verify-stage-i-m83-authentication-account-surfaces.mjs',
'verify-v1220-architecture-restructure.mjs',
'scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs'
]);
const allowedRemovals=new Set(['integrations/material-tracker/postcss.config.js']);
const allowedAdditions=new Set([
'M108-M107-BASELINE-SOURCE-MANIFEST.json',
'M108-MATERIAL-TRACKER-SECURITY-CORRECTIVE.md',
'M108-CONTINUATION-STATE.md',
'scripts/verify-stage-i-m108-m107-source-guard.mjs',
'scripts/certify-stage-i-m108-material-tracker-security-local.sh',
'M108-TOTAL-BUILD-PERFORMANCE-BUDGET-2026-10-07.md'
]);
const ignoredRoots=new Set(['.git','node_modules','dist','coverage','test-results','playwright-report']); const ignoredNames=new Set(['.DS_Store','Thumbs.db']);
// apps/material-tracker is deterministic deployment output produced from the guarded
// integrations/material-tracker source tree by scripts/build-material-tracker.mjs.
// Ignore only this exact generated subtree; all authoritative Material Tracker source
// remains governed through integrations/material-tracker/**.
const ignoredGeneratedPrefixes=['apps/material-tracker'];
const isIgnoredGenerated=(rel)=>ignoredGeneratedPrefixes.some(prefix=>rel===prefix||rel.startsWith(`${prefix}/`));
const sha=f=>{const b=fs.readFileSync(f);return crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex')};
const current=new Map(); const walk=(d,p='')=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(ignoredNames.has(e.name))continue;const r=p?`${p}/${e.name}`:e.name;if(isIgnoredGenerated(r))continue;if(e.isDirectory()){if(r.split('/').some(seg=>ignoredRoots.has(seg)))continue;walk(path.join(d,e.name),r)}else{const f=path.join(d,e.name);current.set(r,{gitSha:sha(f),size:fs.statSync(f).size})}}}; walk(root);
const bad=[];
for(const [f,o] of baseline){const n=current.get(f);if(!n){if(!allowedRemovals.has(f))bad.push(`REMOVED ${f}`);continue}if(n.gitSha!==o.gitSha&&!allowedMutations.has(f))bad.push(`MUTATED ${f}`)}
for(const f of current.keys())if(!baseline.has(f)&&!allowedAdditions.has(f))bad.push(`ADDED ${f}`);
if(bad.length){console.error('M108 M107 source guard: FAIL');bad.slice(0,200).forEach(x=>console.error(`- ${x}`));process.exit(1)}
console.log(`M108 M107 source guard: PASS (baseline files=${baseline.size}; allowed mutations=${allowedMutations.size}; allowed removals=${allowedRemovals.size}; allowed additions=${allowedAdditions.size})`);
