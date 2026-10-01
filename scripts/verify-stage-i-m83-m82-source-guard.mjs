import crypto from 'node:crypto'; import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process'; import { spawnSync } from 'node:child_process';
const root=process.cwd();
const m84Target=path.join(root,'config/stage-i-m84-boards-visual-migration-target.ts');
if(fs.existsSync(m84Target)){
  const delegated=spawnSync(process.execPath,['scripts/verify-stage-i-m84-m83-source-guard.mjs'],{cwd:root,encoding:'utf8'});
  if(delegated.status!==0){process.stderr.write(delegated.stderr||delegated.stdout);process.exit(delegated.status??1)}
  console.log('M83 M82-certified source guard: PASS (M84 successor authority delegated to M84→M83 source guard)');
  process.exit(0);
}
 const manifestPath=path.join(root,'regression-baseline/m83-m82-source-guard.json'); const fail=m=>{console.error(`M83 M82-certified source guard FAILED: ${m}`);process.exit(1)};
if(!fs.existsSync(manifestPath))fail('baseline manifest missing'); const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(manifest.baselineCertifiedZipSha256!=='be5a15bb18146e9d9e85637bd526a879c188170c93b61a3160a5aecb0ce07ab3')fail('M82 certified ZIP provenance drift'); if(manifest.baselineCertifiedSourceSha256!=='ea5ef107443b6b1eadce08a9be5b71e45ca0f250076280a03625f295c56ee2cd')fail('M82 certified source provenance drift');
const allowedMut=new Set(manifest.allowedMutations||[]), allowedNew=new Set(manifest.allowedNewFiles||[]), baseline=new Map((manifest.entries||[]).map(e=>[e.path,e]));
const ignored=new Set(['.git','node_modules','dist','coverage','test-results','playwright-report','CHECKSUMS.sha256','.wm-modern-test-toolchain',...Array.from({length:29},(_,i)=>`m${55+i}-certified-artifacts-upload`)]); const sha=b=>crypto.createHash('sha256').update(b).digest('hex'); const mode=s=>s.isSymbolicLink()?'120000':((s.mode&0o111)?'100755':'100644'); const current=new Map();
const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(ignored.has(e.name))continue;const a=path.join(d,e.name),rel=path.relative(root,a).replaceAll(path.sep,'/');if(e.isDirectory())walk(a);else if(e.isFile()){const st=fs.lstatSync(a),b=fs.readFileSync(a);current.set(rel,{sha256:sha(b),size:b.length,mode:mode(st)})}}};walk(root); const issues=[];
for(const [rel,expected] of baseline){const actual=current.get(rel);if(!actual){issues.push(`M82 baseline file removed: ${rel}`);continue}if(actual.mode!==expected.mode)issues.push(`M82 baseline mode drift: ${rel}`);if(!allowedMut.has(rel)&&(actual.sha256!==expected.sha256||actual.size!==expected.size))issues.push(`unauthorized M82 baseline mutation: ${rel}`)}
for(const [rel] of current)if(!baseline.has(rel)&&!allowedNew.has(rel))issues.push(`unauthorized new M83 file: ${rel}`); for(const rel of allowedMut)if(!baseline.has(rel))issues.push(`allowed mutation absent from M82 baseline: ${rel}`); for(const rel of allowedNew)if(baseline.has(rel))issues.push(`allowed-new path already existed in M82 baseline: ${rel}`);
if(issues.length){console.error('M83 M82-certified source guard FAILED');issues.slice(0,120).forEach(x=>console.error(` - ${x}`));if(issues.length>120)console.error(` - ... ${issues.length-120} additional issue(s)`);process.exit(1)} console.log(`M83 M82-certified source guard: PASS (baseline files=${baseline.size}; allowed mutations=${allowedMut.size}; allowed new files=${allowedNew.size})`);
