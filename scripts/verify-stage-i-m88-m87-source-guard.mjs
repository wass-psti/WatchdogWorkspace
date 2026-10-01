import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root=process.cwd();
if(fs.existsSync(path.join(root,'regression-baseline/m89-m88-source-guard.json'))){const {spawnSync}=await import('node:child_process');const r=spawnSync(process.execPath,['scripts/verify-stage-i-m89-m88-source-guard.mjs'],{cwd:root,stdio:'inherit'});process.exit(r.status??1)}
const manifestPath=path.join(root,'regression-baseline/m88-m87-source-guard.json');
const fail=(message)=>{console.error(`M88 M87-certified source guard FAILED: ${message}`);process.exit(1);};
if(!fs.existsSync(manifestPath)) fail('baseline manifest missing');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(manifest.baselineCertifiedZipSha256!=='260ed2de533e7f9536f63c91b5b69b152326d9f3bb7e3a65d3a4cf3c75aaab25') fail('M87 certified ZIP provenance drift');
if(manifest.baselineCertifiedSourceSha256!=='5420f687989d0ca2bc0c9670e901c0e5fa5560a061a6436056826959910a370f') fail('M87 certified source provenance drift');
const allowedMutations=new Set(manifest.allowedMutations||[]);
const allowedNewFiles=new Set(manifest.allowedNewFiles||[]);
const baseline=new Map((manifest.entries||[]).map((entry)=>[entry.path,entry]));
const ignored=new Set(['.git','node_modules','dist','coverage','test-results','playwright-report','CHECKSUMS.sha256','.wm-modern-test-toolchain',...Array.from({length:34},(_,i)=>`m${55+i}-certified-artifacts-upload`)]);
const sha256=(buffer)=>crypto.createHash('sha256').update(buffer).digest('hex');
const modeFor=(stat)=>((stat.mode&0o111)?'100755':'100644');
const current=new Map();
const walk=(directory)=>{for(const entry of fs.readdirSync(directory,{withFileTypes:true})){if(ignored.has(entry.name)) continue;const absolute=path.join(directory,entry.name),relative=path.relative(root,absolute).replaceAll(path.sep,'/');if(entry.isDirectory()) walk(absolute);else if(entry.isFile()){const stat=fs.lstatSync(absolute),bytes=fs.readFileSync(absolute);current.set(relative,{sha256:sha256(bytes),size:bytes.length,mode:modeFor(stat)});}}};
walk(root);
const issues=[];
for(const [relative,expected] of baseline){const actual=current.get(relative);if(!actual){issues.push(`M87 baseline file removed: ${relative}`);continue;}if(actual.mode!==expected.mode)issues.push(`M87 baseline mode drift: ${relative}`);if(!allowedMutations.has(relative)&&(actual.sha256!==expected.sha256||actual.size!==expected.size))issues.push(`unauthorized M87 baseline mutation: ${relative}`);}
for(const [relative] of current)if(!baseline.has(relative)&&!allowedNewFiles.has(relative))issues.push(`unauthorized new M88 file: ${relative}`);
for(const relative of allowedMutations)if(!baseline.has(relative))issues.push(`allowed mutation absent from M87 baseline: ${relative}`);
for(const relative of allowedNewFiles)if(baseline.has(relative))issues.push(`allowed-new path already existed in M87 baseline: ${relative}`);
if(issues.length){console.error('M88 M87-certified source guard FAILED');issues.slice(0,180).forEach((issue)=>console.error(` - ${issue}`));if(issues.length>180)console.error(` - ... ${issues.length-180} additional issue(s)`);process.exit(1);}
console.log(`M88 M87-certified source guard: PASS (baseline files=${baseline.size}; allowed mutations=${allowedMutations.size}; allowed new files=${allowedNewFiles.size})`);
