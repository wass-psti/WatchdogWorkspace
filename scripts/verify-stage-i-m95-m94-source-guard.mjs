import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
// M96 successor synchronization: when the repository carries the explicit M96
// successor authority bound to the certified M95 baseline, validate the current
// tree with the immediate M96→M95 guard. Pure M95 trees retain the original
// strict M95→M94 comparison below. This delegation is fail-closed: the M96
// target must bind to the exact certified M95 ZIP/source provenance and the
// successor guard itself must pass.
const m96TargetPath = path.join(root,'config/stage-i-m96-visual-consistency-legacy-styling-retirement-target.ts');
const m96GuardPath = path.join(root,'scripts/verify-stage-i-m96-m95-source-guard.mjs');
if (fs.existsSync(m96TargetPath) && fs.existsSync(m96GuardPath)) {
  const target = fs.readFileSync(m96TargetPath,'utf8');
  const validBinding = target.includes('milestone: 96')
    && target.includes("certifiedZipSha256: '25c15f1e4c81d97adfcc5ba2e309a87887ed060ffb52904eea9214e8ff4bf4a7'")
    && target.includes("certifiedSourceSha256: '995dba51a9d4165b3b090487917f21c8c6651dc461716e972c89e1ae840cca6c'")
    && /activationState: '(?:implementation-complete-local-certification-pending|implementation-complete-pending-certification|certification-gates-passed-pending-regression|active-certified)'/.test(target);
  if (validBinding) {
    const successor = spawnSync(process.execPath,[m96GuardPath],{cwd:root,encoding:'utf8'});
    if (successor.status !== 0) {
      process.stderr.write(successor.stderr || successor.stdout || 'M96 successor source guard failed\n');
      process.exit(successor.status || 1);
    }
    process.stdout.write(successor.stdout);
    console.log('M95 M94-certified source guard: PASS (M96 successor authority delegated to M96→M95 source guard)');
    process.exit(0);
  }
}
const mp = path.join(root,'regression-baseline/m95-m94-source-guard.json');
const fail = m => { console.error(`M95 M94-certified source guard FAILED: ${m}`); process.exit(1); };
if (!fs.existsSync(mp)) fail('baseline manifest missing');
const m = JSON.parse(fs.readFileSync(mp,'utf8'));
if (m.baselineCertifiedZipSha256 !== '4e625a02bd5dbc91cf96f6a9bbf14d223698de87958f4d87da268003b6eabf21') fail('M94 certified ZIP provenance drift');
if (m.baselineCertifiedSourceSha256 !== 'b3367038a1d379296314acb7d72c11a319a1a28c4140a3080740079194d6dc7c') fail('M94 certified source provenance drift');
const mut = new Set(m.allowedMutations || []), add = new Set(m.allowedNewFiles || []), base = new Map((m.entries || []).map(e => [e.path,e]));
const ignored = new Set(['.git','node_modules','dist','coverage','test-results','playwright-report','CHECKSUMS.sha256','.wm-modern-test-toolchain',...Array.from({length:41},(_,i)=>`m${55+i}-certified-artifacts-upload`),'m95-continuation-artifacts-upload']);
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const mode = s => ((s.mode & 0o111) ? '100755' : '100644');
const cur = new Map();
const walk = d => { for (const e of fs.readdirSync(d,{withFileTypes:true})) { if (ignored.has(e.name)) continue; const a=path.join(d,e.name),r=path.relative(root,a).replaceAll(path.sep,'/'); if(e.isDirectory()) walk(a); else if(e.isFile()){ const st=fs.lstatSync(a),b=fs.readFileSync(a); cur.set(r,{sha256:sha(b),size:b.length,mode:mode(st)}); } } };
walk(root);
const issues=[];
for(const [r,x] of base){const a=cur.get(r);if(!a){issues.push(`M94 baseline file removed: ${r}`);continue}if(a.mode!==x.mode)issues.push(`M94 baseline mode drift: ${r}`);if(!mut.has(r)&&(a.sha256!==x.sha256||a.size!==x.size))issues.push(`unauthorized M94 baseline mutation: ${r}`)}
for(const [r] of cur) if(!base.has(r)&&!add.has(r)) issues.push(`unauthorized new M95 file: ${r}`);
for(const r of mut) if(!base.has(r)) issues.push(`allowed mutation absent from M94 baseline: ${r}`);
for(const r of add) if(base.has(r)) issues.push(`allowed-new path already existed in M94 baseline: ${r}`);
if(issues.length){console.error('M95 M94-certified source guard FAILED');issues.slice(0,220).forEach(x=>console.error(` - ${x}`));process.exit(1)}
console.log(`M95 M94-certified source guard: PASS (baseline files=${base.size}; allowed mutations=${mut.size}; allowed new files=${add.size})`);
