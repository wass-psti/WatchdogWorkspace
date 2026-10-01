import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root=process.cwd();

const m83Target=path.join(root,'config/stage-i-m83-authentication-account-surfaces-target.ts');
if(fs.existsSync(m83Target)){
  const delegated=spawnSync(process.execPath,['scripts/verify-stage-i-m83-m82-source-guard.mjs'],{cwd:root,encoding:'utf8'});
  if(delegated.status!==0){process.stderr.write(delegated.stderr||delegated.stdout);process.exit(delegated.status??1)}
  console.log('M82 M81-certified source guard: PASS (M83 successor authority delegated to M83→M82 source guard)');
  process.exit(0);
}
const manifestPath=path.join(root,'regression-baseline/m82-m81-source-guard.json');
const fail=(message)=>{console.error(`M82 M81-certified source guard FAILED: ${message}`);process.exit(1)};
if(!fs.existsSync(manifestPath)) fail('baseline manifest missing');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(manifest.baselineCertifiedZipSha256!=='3002a9f0c3c0317bb985a157c76bfa3f42674f4e1023d27faeb5ee92fb26c2cb') fail('M81 certified ZIP provenance drift');
if(manifest.baselineCertifiedSourceSha256!=='6e592a683159119860a7b131d06652e9608d8938b4be6067c6a34d23a5bf6f49') fail('M81 certified source provenance drift');
const allowedMut=new Set(manifest.allowedMutations||[]), allowedNew=new Set(manifest.allowedNewFiles||[]), baseline=new Map((manifest.entries||[]).map(e=>[e.path,e]));
const ignored=new Set(['.git','node_modules','dist','coverage','test-results','playwright-report','CHECKSUMS.sha256','.wm-modern-test-toolchain',...Array.from({length:28},(_,i)=>`m${55+i}-certified-artifacts-upload`)]);
const sha=(bytes)=>crypto.createHash('sha256').update(bytes).digest('hex');
const mode=(stat)=>stat.isSymbolicLink()?'120000':((stat.mode&0o111)?'100755':'100644');
const current=new Map();
const walk=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(ignored.has(entry.name))continue;const abs=path.join(dir,entry.name), rel=path.relative(root,abs).replaceAll(path.sep,'/');if(entry.isDirectory()){walk(abs);continue}if(entry.isFile()){const st=fs.lstatSync(abs),bytes=fs.readFileSync(abs);current.set(rel,{sha256:sha(bytes),size:bytes.length,mode:mode(st)})}}};
walk(root);
const issues=[];
for(const [rel,expected] of baseline){const actual=current.get(rel);if(!actual){issues.push(`M81 baseline file removed: ${rel}`);continue}if(actual.mode!==expected.mode)issues.push(`M81 baseline mode drift: ${rel}`);if(!allowedMut.has(rel)&&(actual.sha256!==expected.sha256||actual.size!==expected.size))issues.push(`unauthorized M81 baseline mutation: ${rel}`)}
for(const [rel] of current)if(!baseline.has(rel)&&!allowedNew.has(rel))issues.push(`unauthorized new M82 file: ${rel}`);
for(const rel of allowedMut)if(!baseline.has(rel))issues.push(`allowed mutation absent from M81 baseline: ${rel}`);
for(const rel of allowedNew)if(baseline.has(rel))issues.push(`allowed-new path already existed in M81 baseline: ${rel}`);
if(issues.length){console.error('M82 M81-certified source guard FAILED');issues.slice(0,100).forEach(x=>console.error(` - ${x}`));if(issues.length>100)console.error(` - ... ${issues.length-100} additional issue(s)`);process.exit(1)}
console.log(`M82 M81-certified source guard: PASS (baseline files=${baseline.size}; allowed mutations=${allowedMut.size}; allowed new files=${allowedNew.size})`);
