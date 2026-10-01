import {spawnSync} from 'node:child_process';
import process from 'node:process';
const gates = [
  ['scripts/verify-stage-i-m98-post-certification-state.mjs'],
  ['scripts/verify-all-historical-verifiers.mjs'],
  ['scripts/verify-stage-i-m98-certified-package-hygiene.mjs'],
  ['verify-stage-i-m98-futuristic-minimalist-production-readiness-certification.mjs'],
  ['scripts/verify-stage-i-m98-futuristic-minimalist-production-readiness-certification-execution.mjs'],
  ['scripts/verify-stage-i-m98-m97-source-guard.mjs'],
  ['scripts/verify-stage-i-m98-browser-evidence.mjs'],
];
for (const args of gates) {
  const result=spawnSync(process.execPath,args,{stdio:'inherit'});
  if (result.error) throw result.error;
  if (result.status!==0) process.exit(result.status??1);
}
console.log('M98 final checkpoint verification: PASS (all required prepublication gates complete; publication may proceed)');
