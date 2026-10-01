import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import os from 'node:os';import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');const fail=(m)=>{throw new Error(m)};
const baseline=JSON.parse(fs.readFileSync(path.join(root,'regression-baseline/m77-final-ui-production-certification.json'),'utf8'));
const sha=(p)=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const m96TargetPath=path.join(root,'config/stage-i-m96-visual-consistency-legacy-styling-retirement-target.ts');
const m96ManifestPath=path.join(root,'regression-baseline/m96-m95-source-guard.json');
const m96SuccessorAuthority=fs.existsSync(m96TargetPath)&&fs.existsSync(m96ManifestPath)&&fs.readFileSync(m96TargetPath,'utf8').includes('milestone: 96');
const m96Manifest=m96SuccessorAuthority?JSON.parse(fs.readFileSync(m96ManifestPath,'utf8')):null;
const m96RetiredMarkerAuthorities=new Map([
  ['apps/time-tracker/app.js',['wmTimeTrackerHarmonized','data-wm-time-tracker-harmonized']],
  ['apps/fueltrack-plus/app.v3.17.0-wm6.js',['wmFuelTrackHarmonized','data-wm-fueltrack-harmonized']],
  ['apps/tradelink/app.v1.42.0-wm1.js',['wmTradeLinkHarmonized','data-wm-tradelink-harmonized']],
]);
const m96RetiredStyleAuthorities=new Set([
  'apps/time-tracker/m74-harmonization.css',
  'apps/fueltrack-plus/m75-harmonization.css',
  'apps/tradelink/m76-harmonization.css',
]);
if(baseline.productSourceChangesAllowed!==false)fail('M77 must freeze product UI source.');
if(m96SuccessorAuthority&&!m96Manifest?.allowedMutations?.includes('scripts/verify-stage-h-m77-final-ui-production-certification-execution.mjs'))fail('M77 M96 successor delegation requires explicit verifier mutation authorization.');
for(const [file,expected] of Object.entries(baseline.protectedAuthorities)){
  const absolute=path.join(root,file);
  if(!fs.existsSync(absolute)){
    if(m96SuccessorAuthority&&m96RetiredStyleAuthorities.has(file)&&m96Manifest?.allowedRemovals?.includes(file))continue;
    fail(`M77 protected authority missing: ${file}`);
  }
  const actual=sha(file);
  if(actual===expected)continue;
  if(m96SuccessorAuthority&&m96RetiredMarkerAuthorities.has(file)&&m96Manifest?.allowedMutations?.includes(file)){
    const source=fs.readFileSync(absolute,'utf8');
    for(const marker of m96RetiredMarkerAuthorities.get(file))if(source.includes(marker))fail(`M77 M96 successor delegation requires retired presentation marker absence in ${file}: ${marker}`);
    continue;
  }
  fail(`M77 protected authority drift: ${file}`);
}
if(JSON.stringify(baseline.browserEngines)!==JSON.stringify(['chromium','firefox','webkit']))fail('M77 browser matrix must contain exactly chromium/firefox/webkit.');
if(baseline.viewports.length!==4)fail('M77 must certify four representative viewport classes.');
const finalizer=fs.readFileSync(path.join(root,'scripts/finalize-stage-h-m77.sh'),'utf8');
for(const token of ['npm run final-ui:git-roundtrip:test','npm run final-ui:browser','npm run release:check','npm run verify:historical-all','verify-stage-h-m77-certified-artifact.mjs','verify-stage-h-m77-certified-package-hygiene.mjs']) if(!finalizer.includes(token))fail(`M77 finalizer missing ${token}`);
for(const token of ['STATE_BACKUP=', 'rollback()', 'PROMOTED=1', 'PUBLISHED=1']) if(!finalizer.includes(token))fail(`M77 finalizer missing transactional certification token: ${token}`);
const promoteIndex=finalizer.indexOf('PROMOTED=1');
const passCreateIndex=finalizer.indexOf('cat > "$TMP/$BASE-PASS.txt"');
if(promoteIndex<0||passCreateIndex<0||promoteIndex>passCreateIndex)fail('M77 root active-certified promotion must occur before PASS record creation.');
const rootStateIndex=finalizer.indexOf('node scripts/verify-stage-h-m77-certified-state.mjs "$ROOT"',promoteIndex);
if(rootStateIndex<0||rootStateIndex>passCreateIndex)fail('M77 root certified-state validation must pass before PASS record creation.');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
if(!pkg.scripts['final-ui:post-certification']?.startsWith('node scripts/verify-stage-h-m77-certified-state.mjs'))fail('M77 post-certification command must validate repository certified state before artifact validation.');
const finalCheckpoint=fs.readFileSync(path.join(root,'scripts/verify-stage-h-m77-final-checkpoint.mjs'),'utf8');
if(!finalCheckpoint.includes("['certified state','scripts/verify-stage-h-m77-certified-state.mjs'"))fail('M77 final checkpoint must include certified repository-state verification.');

const roundtripPath=path.join(root,'scripts/verify-stage-h-m77-git-restorable-roundtrip.mjs');
const roundtrip=fs.readFileSync(roundtripPath,'utf8');
for(const token of ["git', ['clone'","git', ['cat-file'",'source identity mismatch after Git roundtrip'])if(!roundtrip.includes(token))fail(`M77 Git roundtrip verifier missing fail-closed token: ${token}`);
if(roundtrip.includes('update-ref'))fail('M77 Git roundtrip verifier must not synthesize refs to absent objects.');
const treePath=path.join(root,'scripts/lib/stage-h-m77-certification-tree.mjs');
const tree=fs.readFileSync(treePath,'utf8');
if(!tree.includes("'CHECKSUMS.sha256'"))fail('M77 source identity must exclude derived CHECKSUMS.sha256.');
for(const mode of ["'100644'","'100755'","'120000'"])if(!tree.includes(mode))fail(`M77 source identity missing Git-restorable mode ${mode}.`);
if(tree.includes('stat.mode&0o777'))fail('M77 source identity must not hash non-Git-restorable raw POSIX permission bits.');
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'wm-m77-git-mode-'));
try{
  const plain=path.join(fixture,'plain.txt');const executable=path.join(fixture,'run.sh');
  fs.writeFileSync(plain,'plain\n');fs.writeFileSync(executable,'#!/bin/sh\nexit 0\n');
  fs.chmodSync(plain,0o666);fs.chmodSync(executable,0o777);
  const runTree=()=>{const r=spawnSync(process.execPath,[treePath,fixture],{cwd:root,encoding:'utf8'});if(r.status!==0)fail(r.stderr||r.stdout||'M77 source identity fixture failed');return r.stdout.trim()};
  const archiveModes=runTree();
  fs.chmodSync(plain,0o644);fs.chmodSync(executable,0o755);
  const gitCheckoutModes=runTree();
  if(archiveModes!==gitCheckoutModes)fail('M77 source identity must be stable across archive-vs-Git checkout permission normalization.');
  fs.chmodSync(executable,0o644);
  const executableBitRemoved=runTree();
  if(executableBitRemoved===gitCheckoutModes)fail('M77 source identity must still detect Git-tracked executable-bit changes.');
}finally{fs.rmSync(fixture,{recursive:true,force:true})}
const helper=fs.readFileSync(path.join(root,'tests/modern/e2e/helpers/m53-hardening-fixture.mjs'),'utf8');if(!helper.includes('if (!root || !body) return null;'))fail('M77 iframe settlement correction missing root/body transient guard.');if(!helper.includes('Embedded module document remained unavailable for responsive verification after'))fail('M77 iframe settlement correction must remain fail-closed after timeout.');
console.log('M77 final UI production certification deterministic verification: PASS');
console.log(`Validated ${Object.keys(baseline.protectedAuthorities).length} frozen presentation authorities, 3 browser engines, 4 viewport classes, Git-restorable source identity semantics, and fail-closed production certification sequencing.`);
