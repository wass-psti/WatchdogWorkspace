import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const release=process.argv.includes('--release');
const file=new URL('../config/stage-g-m37-functional-regression-baseline-target.ts',import.meta.url);
const prerequisite=new URL('../config/stage-f-m36-production-cutover-certification-target.ts',import.meta.url);
const original=await readFile(file,'utf8');
if(process.version!=='v22.16.0')throw new Error(`M37 activation requires Node v22.16.0; current ${process.version}.`);
if(!(await readFile(prerequisite,'utf8')).includes("activationState: 'active-certified'"))throw new Error('M37 requires the user-verified M36 active-certified baseline before functional regression certification.');
const run=(script)=>{const r=spawnSync('npm',['run',script],{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw new Error(`${script} failed with exit code ${r.status??'unknown'}.`)};
try{
 let source=original.replace("activationState: 'implementation-complete-pending-certification'","activationState: 'active-pending-browser-certification'");await writeFile(file,source);
 run('functional-regression:check');run('functional-regression:test');
 if(release){run('functional-regression:browser');run('functional-regression:evidence');run('verify:historical-all');run('release:check');}
 source=source.replace("activationState: 'active-pending-browser-certification'","activationState: 'active-certified'");await writeFile(file,source);run('functional-regression:check');
 console.log('Stage G M37 activation: PASS');
}catch(error){await writeFile(file,original);throw error;}
