import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const file='config/stage-e-m26-iframe-retirement-target.ts';
const release=process.argv.includes('--release');
const read=()=>fs.readFileSync(path.join(root,file),'utf8');
const state=(f=file)=>fs.readFileSync(path.join(root,f),'utf8').match(/activationState:\s*'([^']+)'/)?.[1]??'unknown';
const set=(next)=>{const p=path.join(root,file);fs.writeFileSync(p,read().replace(/activationState:\s*'[^']+'/,`activationState: '${next}'`));};
const run=(s,l)=>{console.log(`\n== ${l} ==`);const r=spawnSync('npm',['run',s],{cwd:root,stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw new Error(`${l} failed with exit code ${r.status??'unknown'}.`)};
if(process.version!=='v22.16.0')throw new Error(`M26 activation requires Node v22.16.0; current ${process.version}.`);
if(state('config/stage-e-m25-tradelink-stabilization-target.ts')!=='active-certified')throw new Error('M25 must remain active-certified before M26 activation.');
for(const [s,l] of [['governance:restore','Synchronize repository governance artifacts'],['dependencies:ensure','Ensure exact lockfile dependencies'],['tradelink-stabilization:check','Revalidate certified M25 TradeLink stabilization'],['iframe-retirement:check','M26 iframe-retirement gate'],['lint:eslint','Governed ESLint gate'],['typecheck','TypeScript verification']])run(s,l);
const priorState=state();
set('active-pending-release-certification');
try {
  run('iframe-retirement:check','M26 active retirement authority gate');
  run('typecheck','TypeScript revalidation with active M26 boundary');
  if(release){
    run('audit:ci','High-severity dependency audit');
    run('release:check','Complete production release gate');
    set('active-certified');
    run('iframe-retirement:check','Final M26 certified-state gate');
  }
} catch (error) {
  set(priorState);
  console.error(`\nM26 activation failed; activationState rolled back to ${priorState}.`);
  throw error;
}
console.log(`\nStage E M26 activation workflow complete. Current state: ${state()}`);
