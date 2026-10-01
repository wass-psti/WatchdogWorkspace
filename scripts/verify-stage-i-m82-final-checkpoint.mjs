import {spawnSync} from 'node:child_process';
import process from 'node:process';
const root=process.cwd(), requireCertified=process.argv.includes('--require-certified'), failures=[];
const run=(args,label)=>{const r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});if(r.status!==0)failures.push(`${label}: ${(r.stderr||r.stdout).trim()}`)};
run(['verify-stage-i-m82-layout-surface-responsive-composition.mjs'],'M82 static');
run(['scripts/verify-stage-i-m82-layout-surface-responsive-composition-execution.mjs'],'M82 deterministic');
run(['scripts/verify-stage-i-m82-m81-source-guard.mjs'],'M82 M81 source guard');
if(requireCertified){
  run(['scripts/verify-stage-i-m82-certified-state.mjs',root],'M82 certified state');
  run(['scripts/verify-stage-i-m82-certified-artifact.mjs'],'M82 certified artifact');
  run(['scripts/verify-stage-i-m82-certified-package-hygiene.mjs'],'M82 certified hygiene');
}else{
  run(['scripts/verify-stage-i-m82-post-certification-state.mjs',root],'M82 post-certification pending state');
  const r=spawnSync(process.execPath,['scripts/verify-stage-i-m82-certified-package-hygiene.mjs','--prepublish'],{cwd:root,encoding:'utf8'});
  if(r.status!==0)failures.push(`M82 prepublication hygiene: ${(r.stderr||r.stdout).trim()}`);
}
if(failures.length){console.error('M82 final checkpoint verification FAILED');failures.forEach(f=>console.error(` - ${f}`));process.exit(1)}
console.log(`M82 final checkpoint verification: PASS (${requireCertified?'published certified artifact':'all required prepublication gates complete; publication may proceed'})`);
