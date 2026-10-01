import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto'; import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process';
const root=process.cwd();
// M82 successor synchronization: a valid M82 tree is checked against the exact
// certified M81 baseline by the M82→M81 guard. Pure M81 trees retain the strict
// historical M81→M80 comparison below.
const m82TargetPath=path.join(root,'config/stage-i-m82-layout-surface-responsive-composition-target.ts');
const m82GuardPath=path.join(root,'scripts/verify-stage-i-m82-m81-source-guard.mjs');
if(fs.existsSync(m82TargetPath)&&fs.existsSync(m82GuardPath)){
  const target=fs.readFileSync(m82TargetPath,'utf8');
  const validBinding=target.includes('milestone: 82')
    &&target.includes("certifiedZipSha256: '3002a9f0c3c0317bb985a157c76bfa3f42674f4e1023d27faeb5ee92fb26c2cb'")
    &&target.includes("certifiedSourceSha256: '6e592a683159119860a7b131d06652e9608d8938b4be6067c6a34d23a5bf6f49'")
    &&(/activationState: '(?:implementation-complete-pending-certification|certification-gates-passed-pending-regression|active-certified)'/.test(target));
  if(validBinding){
    const successor=spawnSync(process.execPath,[m82GuardPath],{cwd:root,encoding:'utf8'});
    if(successor.status!==0){process.stderr.write(successor.stderr||successor.stdout||'M82 successor source guard failed\n');process.exit(successor.status||1)}
    process.stdout.write(successor.stdout);
    console.log('M81 M80-certified source guard: PASS (M82 successor authority delegated to M82→M81 source guard)');
    process.exit(0);
  }
}
const baselinePath=path.join(root,'regression-baseline/m81-m80-source-guard.json'); const fail=m=>{console.error(`M81 M80-certified source guard FAILED: ${m}`);process.exit(1)};
if(!fs.existsSync(baselinePath))fail('baseline manifest missing'); const baseline=JSON.parse(fs.readFileSync(baselinePath,'utf8')); const allowedMut=new Set(baseline.allowedMutations||[]), allowedNew=new Set(baseline.allowedNewFiles||[]); const baselineMap=new Map((baseline.files||[]).map(x=>[x.path,x.sha256]));
const excluded=new Set(['.git','node_modules','dist','coverage','test-results','playwright-report','CHECKSUMS.sha256','.wm-modern-test-toolchain',...Array.from({length:27},(_,i)=>`m${55+i}-certified-artifacts-upload`)]);
const current=[]; const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(excluded.has(e.name))continue;const a=path.join(d,e.name);const rel=path.relative(root,a).replaceAll(path.sep,'/');if(e.isDirectory())walk(a);else if(e.isFile()){const sha=crypto.createHash('sha256').update(fs.readFileSync(a)).digest('hex');current.push([rel,sha])}}};walk(root); const currentMap=new Map(current); const issues=[];
for(const [p,sha] of baselineMap){const cur=currentMap.get(p);if(cur===undefined){issues.push(`baseline file removed: ${p}`);continue}if(cur!==sha&&!allowedMut.has(p))issues.push(`unauthorized M80 baseline mutation: ${p}`)}
for(const [p] of currentMap){if(!baselineMap.has(p)&&!allowedNew.has(p))issues.push(`unauthorized new file: ${p}`)}
for(const p of allowedMut)if(!baselineMap.has(p))issues.push(`allowed mutation does not exist in M80 baseline: ${p}`); for(const p of allowedNew)if(baselineMap.has(p))issues.push(`allowed-new path existed in M80 baseline: ${p}`);
if(issues.length){console.error('M81 M80-certified source guard FAILED');issues.slice(0,100).forEach(x=>console.error(` - ${x}`));if(issues.length>100)console.error(` - ... ${issues.length-100} additional issue(s)`);process.exit(1)}
console.log(`M81 M80-certified source guard: PASS (baseline files=${baselineMap.size}; allowed mutations=${allowedMut.size}; allowed new files=${allowedNew.size})`);
