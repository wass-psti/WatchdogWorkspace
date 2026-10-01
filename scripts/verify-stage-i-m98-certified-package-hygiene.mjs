import {spawnSync} from 'node:child_process';
import process from 'node:process';
for (const args of [['scripts/scan-secrets.mjs'],['scripts/verify-stage-i-m98-browser-evidence.mjs'],['scripts/verify-stage-i-m98-m97-source-guard.mjs']]) {
  const result=spawnSync(process.execPath,args,{stdio:'inherit'});
  if (result.error) throw result.error;
  if (result.status!==0) process.exit(result.status??1);
}
console.log('M98 prepublication checksum/package hygiene verification: PASS (secret scan + browser evidence + source guard)');
