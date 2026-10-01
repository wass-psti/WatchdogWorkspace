import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto'; import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process';
const root=process.cwd();
// M81 successor synchronization: when the current working tree is an explicitly
// bound M81 successor of the certified M80 baseline, M80's historical guard must
// not misclassify authorized M81 evolution as M80 drift. In that case delegate
// to the M81→M80 guard. Pure M80 trees retain the original strict M80→M79 guard.
const m81TargetPath=path.join(root,'config/stage-i-m81-application-shell-global-navigation-target.ts');
const m81GuardPath=path.join(root,'scripts/verify-stage-i-m81-m80-source-guard.mjs');
if(fs.existsSync(m81TargetPath)&&fs.existsSync(m81GuardPath)){
  const m81Target=fs.readFileSync(m81TargetPath,'utf8');
  const validM81Binding=m81Target.includes("milestone: 81")
    &&m81Target.includes("certifiedZipSha256: '7e0f42e510d8f5189892171cddbed73f3a063e6b7a16a86b94a2d6bebb9e76ff'")
    &&m81Target.includes("certifiedSourceSha256: '978163479a590ec914f2c7574ed5710efeeb0734a3181584a0404934fafe5576'")
    &&(/activationState: '(?:implementation-complete-pending-certification|certification-gates-passed-pending-regression|active-certified)'/.test(m81Target));
  if(validM81Binding){
    const successor=spawnSync(process.execPath,[m81GuardPath],{cwd:root,encoding:'utf8'});
    if(successor.status!==0){
      process.stderr.write(successor.stderr||successor.stdout||'M81 successor source guard failed\n');
      process.exit(successor.status||1);
    }
    process.stdout.write(successor.stdout);
    console.log('M80 M79-certified source guard: PASS (M81 successor authority delegated to M81→M80 source guard)');
    process.exit(0);
  }
}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'regression-baseline/m80-m79-source-guard.json'),'utf8')), failures=[]; const ok=(c,m)=>{if(!c)failures.push(m)}; const sha=b=>crypto.createHash('sha256').update(b).digest('hex'); const mode=s=>s.isSymbolicLink()?'120000':((s.mode&0o111)?'100755':'100644'); const mutations=new Set(manifest.allowedMutations), additions=new Set(manifest.allowedNewFiles), baseline=new Map(manifest.entries.map(e=>[e.path,e]));
ok(manifest.baselineCertifiedZipSha256==='42f6e572830916fd4a5c00af9030b296c9b2e64176fa7a16bf9b9c520b28ec58','M80 lost M79 certified ZIP identity'); ok(manifest.baselineCertifiedSourceSha256==='ca31475242a58595373ca65a6305c6aa79396cd2b6ea089bb1f5dd8005b56d5c','M80 lost M79 certified source identity');
for(const [rel,expected] of baseline){const abs=path.join(root,rel);ok(fs.existsSync(abs),`M79 baseline file removed during M80: ${rel}`);if(!fs.existsSync(abs))continue;const st=fs.lstatSync(abs), bytes=st.isSymbolicLink()?Buffer.from(fs.readlinkSync(abs)):fs.readFileSync(abs);ok(mode(st)===expected.mode,`M79 baseline mode drift: ${rel}`);if(!mutations.has(rel)){ok(sha(bytes)===expected.sha256,`M80 unauthorized byte drift: ${rel}`);ok(bytes.length===expected.size,`M80 unauthorized size drift: ${rel}`)}}
const ignored=new Set(['.git','node_modules','dist','coverage','test-results','playwright-report','.wm-modern-test-toolchain']); const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(ignored.has(e.name)||/^m(?:[5-9][0-9]|80)-certified-artifacts-upload$/.test(e.name))continue;const a=path.join(d,e.name), rel=path.relative(root,a).replaceAll(path.sep,'/');if(e.isDirectory()){walk(a);continue}if(rel==='CHECKSUMS.sha256')continue;if(!baseline.has(rel))ok(additions.has(rel),`M80 unexpected new repository file: ${rel}`)}}; walk(root);
if(failures.length){console.error('M80 M79-certified source guard FAILED');failures.forEach(f=>console.error(` - ${f}`));process.exit(1)} console.log(`M80 M79-certified source guard: PASS (baseline files=${baseline.size}; allowed mutations=${mutations.size}; allowed new files=${additions.size})`);
