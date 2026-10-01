import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';import fs from 'node:fs';import path from 'node:path';import process from 'node:process';
const root=process.cwd();
// M95 successor synchronization: once the repository carries the explicit M95
// target, historical Stage-I source-guard entry points must validate the current
// tree against the immediate M94-certified predecessor boundary rather than
// accumulating stale first-order allowlists from M91/M92. Pure pre-M95 trees
// retain the original strict M91→M90 verification below.
const m95TargetPath=path.join(root,'config/stage-i-m95-cross-module-responsive-harmonization-target.ts');
const m95GuardPath=path.join(root,'scripts/verify-stage-i-m95-m94-source-guard.mjs');
if(fs.existsSync(m95TargetPath)&&fs.existsSync(m95GuardPath)){
  const target=fs.readFileSync(m95TargetPath,'utf8');
  const validM95Binding=target.includes('milestone: 95')
    &&target.includes("certifiedZipSha256: '4e625a02bd5dbc91cf96f6a9bbf14d223698de87958f4d87da268003b6eabf21'")
    &&target.includes("certifiedSourceSha256: 'b3367038a1d379296314acb7d72c11a319a1a28c4140a3080740079194d6dc7c'")
    &&/activationState: '(?:implementation-complete-local-certification-pending|certification-gates-passed-pending-regression|active-certified)'/.test(target);
  if(validM95Binding){
    const successor=spawnSync(process.execPath,[m95GuardPath],{cwd:root,encoding:'utf8'});
    if(successor.status!==0){process.stderr.write(successor.stderr||successor.stdout||'M95 successor source guard failed\n');process.exit(successor.status||1)}
    process.stdout.write(successor.stdout);
    console.log('M91 M90-certified source guard: PASS (M95 successor authority delegated to M95→M94 source guard)');
    process.exit(0);
  }
}
const mp=path.join(root,'regression-baseline/m91-m90-source-guard.json');const fail=m=>{console.error(`M91 M90-certified source guard FAILED: ${m}`);process.exit(1)};if(!fs.existsSync(mp))fail('baseline manifest missing');const m=JSON.parse(fs.readFileSync(mp,'utf8'));if(m.baselineCertifiedZipSha256!=='7a888874dc663b1a588e421486c2a055f148c1c55a2c9575e2299c97807769e9')fail('M90 certified ZIP provenance drift');if(m.baselineCertifiedSourceSha256!=='b21014f3223897da07692d92806b917a9489b602806d071b00e440c9f94cb06c')fail('M90 certified source provenance drift');
const mut=new Set(m.allowedMutations||[]),add=new Set(m.allowedNewFiles||[]),base=new Map((m.entries||[]).map(e=>[e.path,e]));const m92p=path.join(root,'regression-baseline/m92-m91-source-guard.json');if(fs.existsSync(m92p)){const successor=JSON.parse(fs.readFileSync(m92p,'utf8'));for(const r of [...(successor.allowedMutations||[]),...(successor.allowedNewFiles||[])]){if(base.has(r))mut.add(r);else add.add(r);}}const ignored=new Set(['.git','node_modules','dist','coverage','test-results','playwright-report','CHECKSUMS.sha256','.wm-modern-test-toolchain',...Array.from({length:37},(_,i)=>`m${55+i}-certified-artifacts-upload`)]);const sha=b=>crypto.createHash('sha256').update(b).digest('hex');const mode=s=>((s.mode&0o111)?'100755':'100644');const cur=new Map();const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(ignored.has(e.name))continue;const a=path.join(d,e.name),r=path.relative(root,a).replaceAll(path.sep,'/');if(e.isDirectory())walk(a);else if(e.isFile()){const st=fs.lstatSync(a),b=fs.readFileSync(a);cur.set(r,{sha256:sha(b),size:b.length,mode:mode(st)})}}};walk(root);const issues=[];for(const [r,x] of base){const a=cur.get(r);if(!a){issues.push(`M90 baseline file removed: ${r}`);continue}if(a.mode!==x.mode)issues.push(`M90 baseline mode drift: ${r}`);if(!mut.has(r)&&(a.sha256!==x.sha256||a.size!==x.size))issues.push(`unauthorized M90 baseline mutation: ${r}`)}for(const [r] of cur)if(!base.has(r)&&!add.has(r))issues.push(`unauthorized new M91 file: ${r}`);for(const r of mut)if(!base.has(r))issues.push(`allowed mutation absent from M90 baseline: ${r}`);for(const r of add)if(base.has(r))issues.push(`allowed-new path already existed in M90 baseline: ${r}`);if(issues.length){console.error('M91 M90-certified source guard FAILED');issues.slice(0,180).forEach(x=>console.error(` - ${x}`));process.exit(1)}console.log(`M91 M90-certified source guard: PASS (baseline files=${base.size}; allowed mutations=${mut.size}; allowed new files=${add.size})`);
