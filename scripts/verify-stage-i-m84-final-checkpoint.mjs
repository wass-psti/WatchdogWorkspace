import {spawnSync} from 'node:child_process'; import process from 'node:process';
const commands=[
  ['node',['scripts/verify-stage-i-m84-post-certification-state.mjs']],
  ['npm',['run','verify:historical-all']],
  ['node',['scripts/verify-stage-i-m84-certified-package-hygiene.mjs','--prepublish']],
  ['node',['verify-stage-i-m84-boards-visual-migration.mjs']],
  ['node',['scripts/verify-stage-i-m84-boards-visual-migration-execution.mjs']],
  ['node',['scripts/verify-stage-i-m84-m83-source-guard.mjs']],
];
for(const [cmd,args] of commands){const r=spawnSync(cmd,args,{stdio:'inherit'});if(r.status!==0){console.error(`M84 final checkpoint FAILED at ${cmd} ${args.join(' ')}`);process.exit(r.status??1)}}
console.log('M84 final checkpoint verification: PASS (all required prepublication gates complete; publication may proceed)');
