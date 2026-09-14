import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const release=process.argv.includes('--release');
const file=new URL('../config/stage-f-m35-final-legacy-deletion-target.ts',import.meta.url);
const prerequisite=new URL('../config/stage-f-m34-backup-disaster-recovery-target.ts',import.meta.url);
const original=await readFile(file,'utf8');
if (!(await readFile(prerequisite,'utf8')).includes("activationState: 'active-certified'")) throw new Error('M35 requires M34 active-certified.');
const run=(cmd,args=[])=>{const r=spawnSync(cmd,args,{stdio:'inherit'});if(r.status!==0)throw new Error(`${cmd} ${args.join(' ')} failed`);};
try {
 let source=original.replace("activationState: 'implementation-complete-pending-certification'","activationState: 'active-pending-release-certification'"); await writeFile(file,source);
 run('node',['verify-stage-f-m35-final-legacy-deletion.mjs']); run('node',['--experimental-strip-types','scripts/verify-final-legacy-deletion-execution.mjs']);
 if(release){for(const script of ['backup-dr:test','service-worker-update:test','observability:test','performance:bench','modern-tests:coverage','modern-tests:e2e','lint:eslint','typecheck','database-rls:test:local','build','performance:bundle','service-worker-update:dist','verify:preview','audit:ci']) run('npm',['run',script]);}
 source=source.replace("activationState: 'active-pending-release-certification'","activationState: 'active-certified'"); await writeFile(file,source); run('node',['verify-stage-f-m35-final-legacy-deletion.mjs']); console.log('Stage F M35 activation: PASS');
} catch(error){await writeFile(file,original); throw error;}
