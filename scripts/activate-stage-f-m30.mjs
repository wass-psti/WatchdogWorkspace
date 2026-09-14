import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const target=path.join(root,'config/stage-f-m30-modern-testing-stack-target.ts');
const release=process.argv.includes('--release');
const stateOf=(file)=>fs.readFileSync(path.join(root,file),'utf8').match(/activationState:\s*'([^']+)'/)?.[1]??'unknown';
const state=()=>stateOf('config/stage-f-m30-modern-testing-stack-target.ts');
const set=(next)=>{const source=fs.readFileSync(target,'utf8');fs.writeFileSync(target,source.replace(/activationState:\s*'[^']+' as M30ActivationState/,`activationState: '${next}' as M30ActivationState`));};
const run=(script,label)=>{console.log(`\n================ ${label} ================`);const result=spawnSync('npm',['run',script],{cwd:root,stdio:'inherit',shell:false});if(result.error)throw result.error;if(result.status!==0)throw new Error(`${label} failed with exit code ${result.status??'unknown'}.`);};
if(process.version!=='v22.16.0')throw new Error(`M30 activation requires Node v22.16.0; current ${process.version}.`);
if(stateOf('config/stage-f-m29-database-rls-test-suite-target.ts')!=='active-certified')throw new Error('M30 requires M29 active-certified.');
const priorState=state();
try{
  run('governance:restore','Synchronize governed repository artifacts');
  run('dependencies:ensure','Ensure exact application lockfile dependencies');
  run('database-rls:check','Revalidate M29 Database/RLS prerequisite');
  run('modern-tests:check','M30 modern testing static verification');
  run('modern-tests:test','Execute M30 modern unit/component suite');
  run('lint:eslint','ESLint verification');
  run('typecheck','TypeScript verification');
  set('active-pending-release-certification');
  run('modern-tests:check','M30 pending-certification state gate');
  if(release){
    run('modern-tests:coverage','Execute M30 V8 coverage gate');
    run('modern-tests:e2e','Execute M30 Playwright real-browser smoke');
    run('audit:ci','High-severity application dependency audit');
    run('release:check','Complete production release gate');
    set('active-certified');
    run('modern-tests:check','Final M30 certified-state gate');
  }
}catch(error){
  set(priorState);
  console.error(`\nM30 activation failed; activationState rolled back to ${priorState}.`);
  throw error;
}
console.log(`\nStage F M30 activation workflow complete. Current state: ${state()}`);
