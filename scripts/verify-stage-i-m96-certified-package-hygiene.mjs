import {spawnSync} from 'node:child_process';import process from 'node:process';
const r=spawnSync(process.execPath,['scripts/scan-secrets.mjs'],{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);console.log('M96 prepublication checksum/package hygiene verification: PASS (temporary candidate only; no certified artifact/PASS record published)');
