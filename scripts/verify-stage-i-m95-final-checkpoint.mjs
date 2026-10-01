import {spawnSync} from 'node:child_process';
import process from 'node:process';
const gates = [
  ['scripts/verify-stage-i-m95-post-certification-state.mjs'],
  ['scripts/verify-all-historical-verifiers.mjs'],
  ['scripts/verify-stage-i-m95-certified-package-hygiene.mjs'],
  ['verify-stage-i-m95-cross-module-responsive-harmonization.mjs'],
  ['scripts/verify-stage-i-m95-cross-module-responsive-harmonization-execution.mjs'],
  ['scripts/verify-stage-i-m95-m94-source-guard.mjs']
];
for(const a of gates){const r=spawnSync(process.execPath,a,{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1)}
console.log('M95 final checkpoint verification: PASS (all required prepublication gates complete; publication may proceed)');
