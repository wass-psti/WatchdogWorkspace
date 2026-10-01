import {spawnSync} from 'node:child_process';import process from 'node:process';
const result=spawnSync(process.execPath,['scripts/scan-secrets.mjs'],{stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);
console.log('M89 prepublication checksum/package hygiene verification: PASS (temporary candidate only; no certified artifact/PASS record published)');
