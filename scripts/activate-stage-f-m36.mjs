import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const release=process.argv.includes('--release');
const file=new URL('../config/stage-f-m36-production-cutover-certification-target.ts',import.meta.url);
const prerequisite=new URL('../config/stage-f-m35-final-legacy-deletion-target.ts',import.meta.url);
const original=await readFile(file,'utf8');
if(process.version!=='v22.16.0')throw new Error(`M36 activation requires Node v22.16.0; current ${process.version}.`);
if(!(await readFile(prerequisite,'utf8')).includes("activationState: 'active-certified'"))throw new Error('M36 requires M35 active-certified before production cutover certification.');
const run=(script)=>{const r=spawnSync('npm',['run',script],{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw new Error(`${script} failed with exit code ${r.status??'unknown'}.`)};
try{
 let source=original.replace("activationState: 'implementation-complete-pending-certification'","activationState: 'active-pending-release-certification'");await writeFile(file,source);
 run('cutover:check');run('cutover:test');run('legacy-deletion:check');run('legacy-deletion:test');
 if(release){run('verify:historical-all');run('release:check');run('cutover:artifact');run('cutover:evidence');}
 source=source.replace("activationState: 'active-pending-release-certification'","activationState: 'active-certified'");await writeFile(file,source);run('cutover:check');
 console.log('Stage F M36 activation: PASS');
}catch(error){await writeFile(file,original);throw error;}
