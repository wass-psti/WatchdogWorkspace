import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const target=path.join(root,'config/stage-f-m29-database-rls-test-suite-target.ts');
const release=process.argv.includes('--release');
const stateOf=(file)=>fs.readFileSync(path.join(root,file),'utf8').match(/activationState:\s*'([^']+)'/)?.[1]??'unknown';
const state=()=>stateOf('config/stage-f-m29-database-rls-test-suite-target.ts');
const set=(next)=>{const source=fs.readFileSync(target,'utf8');fs.writeFileSync(target,source.replace(/activationState:\s*'[^']+' as M29ActivationState/,`activationState: '${next}' as M29ActivationState`));};
const run=(script,label)=>{console.log(`\n================ ${label} ================`);const result=spawnSync('npm',['run',script],{cwd:root,stdio:'inherit',shell:false});if(result.error)throw result.error;if(result.status!==0)throw new Error(`${label} failed with exit code ${result.status??'unknown'}.`);};
if(process.version!=='v22.16.0')throw new Error(`M29 activation requires Node v22.16.0; current ${process.version}.`);
if(stateOf('config/stage-f-m28-edge-functions-target.ts')!=='active-certified')throw new Error('M29 requires M28 active-certified.');
const priorState=state();
try{
  run('governance:restore','Synchronize governed repository artifacts');
  run('dependencies:ensure','Ensure exact lockfile dependencies');
  run('edge-functions:check','Revalidate M28 Edge Functions prerequisite');
  run('database-rls:check','M29 Database/RLS static verification');
  run('lint:eslint','ESLint verification');
  run('typecheck','TypeScript verification');
  if(release) run('database-rls:test:local','Execute disposable local pgTAP Database/RLS suite');
  set('active-pending-release-certification');
  run('database-rls:check','M29 pending-certification state gate');
  if(release){
    run('audit:ci','High-severity dependency audit');
    run('release:check','Complete production release gate');
    set('active-certified');
    run('database-rls:check','Final M29 certified-state gate');
  }
}catch(error){
  set(priorState);
  console.error(`\nM29 activation failed; activationState rolled back to ${priorState}.`);
  throw error;
}
console.log(`\nStage F M29 activation workflow complete. Current state: ${state()}`);
