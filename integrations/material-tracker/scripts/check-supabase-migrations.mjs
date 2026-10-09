import { spawnSync } from 'node:child_process';
const versions=['20261003061912','20261003063134','20261003063657','20261003080739','20261003115017','20261003115954'];
const r=spawnSync('npx',['supabase@2.117.0','migration','list'],{encoding:'utf8'});
process.stdout.write(r.stdout||''); process.stderr.write(r.stderr||''); if(r.status!==0)process.exit(r.status||1);
const clean=(r.stdout||'').replace(/\x1b\[[0-9;]*m/g,'').replace(/`/g,'');
let failed=0;
for(const v of versions){const re=new RegExp(`\\b${v}\\s*\\|\\s*${v}\\b`);const ok=re.test(clean);console.log(`${ok?'PASS':'FAIL'} Material Tracker migration ${v} aligned local ↔ remote`);if(!ok)failed++;}
if(failed){console.error('FAIL: Material Tracker module migration history mismatch.');process.exit(1);}console.log('PASS: Material Tracker module migration history aligned; unrelated host migrations are intentionally out of scope.');
