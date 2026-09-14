import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const target=path.join(root,'config/stage-f-m28-edge-functions-target.ts');
const release=process.argv.includes('--release');
const stateOf=(file)=>fs.readFileSync(path.join(root,file),'utf8').match(/activationState:\s*'([^']+)'/)?.[1]??'unknown';
const state=()=>stateOf('config/stage-f-m28-edge-functions-target.ts');
const set=(next)=>{const source=fs.readFileSync(target,'utf8');fs.writeFileSync(target,source.replace(/activationState:\s*'[^']+' as M28ActivationState/,`activationState: '${next}' as M28ActivationState`));};
const run=(script,label)=>{console.log(`\n================ ${label} ================`);const result=spawnSync('npm',['run',script],{cwd:root,stdio:'inherit',shell:false});if(result.error)throw result.error;if(result.status!==0)throw new Error(`${label} failed with exit code ${result.status??'unknown'}.`);};
if(process.version!=='v22.16.0')throw new Error(`M28 activation requires Node v22.16.0; current ${process.version}.`);
if(stateOf('config/stage-f-m27-realtime-platform-target.ts')!=='active-certified')throw new Error('M28 requires M27 active-certified.');
const priorState=state();
try{
  run('governance:restore','Synchronize governed repository artifacts');
  run('dependencies:ensure','Ensure exact lockfile dependencies');
  run('realtime-platform:check','Revalidate M27 realtime platform prerequisite');
  run('edge-functions:check','M28 Edge Functions verification');
  run('lint:eslint','ESLint verification');
  run('typecheck','TypeScript verification');
  set('active-pending-release-certification');
  run('edge-functions:check','M28 pending-certification state gate');
  run('typecheck','M28 pending-certification TypeScript gate');
  if(release){
    run('audit:ci','High-severity dependency audit');
    run('release:check','Complete production release gate');
    set('active-certified');
    run('edge-functions:check','Final M28 certified-state gate');
  }
}catch(error){
  set(priorState);
  console.error(`\nM28 activation failed; activationState rolled back to ${priorState}.`);
  throw error;
}
console.log(`\nStage F M28 activation workflow complete. Current state: ${state()}`);
