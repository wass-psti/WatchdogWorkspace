import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');const file='config/stage-e-m24-fueltrack-stabilization-target.ts';const release=process.argv.includes('--release');
const read=()=>fs.readFileSync(path.join(root,file),'utf8');const state=(f=file)=>fs.readFileSync(path.join(root,f),'utf8').match(/activationState:\s*'([^']+)'/)?.[1]??'unknown';
const set=(next)=>{const p=path.join(root,file);fs.writeFileSync(p,read().replace(/activationState:\s*'[^']+'/,`activationState: '${next}'`));};
const run=(s,l)=>{console.log(`\n== ${l} ==`);const r=spawnSync('npm',['run',s],{cwd:root,stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw new Error(`${l} failed with exit code ${r.status??'unknown'}.`)};
if(process.version!=='v22.16.0')throw new Error(`M24 activation requires Node v22.16.0; current ${process.version}.`);
if(state('config/stage-e-m23-timetracker-stabilization-target.ts')!=='active-certified')throw new Error('M23 must remain active-certified before M24 activation.');
for(const [s,l] of [['governance:restore','Synchronize repository governance artifacts'],['dependencies:ensure','Ensure exact lockfile dependencies'],['timetracker-stabilization:check','Revalidate certified M23 TimeTracker stabilization'],['fueltrack-stabilization:check','M24 FuelTrack+ stabilization gate'],['lint:eslint','Governed ESLint gate'],['typecheck','TypeScript verification']])run(s,l);
set('active-pending-release-certification');run('fueltrack-stabilization:check','M24 active stabilization authority gate');run('typecheck','TypeScript revalidation with active M24 boundary');
if(release){run('audit:ci','High-severity dependency audit');run('release:check','Complete production release gate');set('active-certified');run('fueltrack-stabilization:check','Final M24 certified-state gate');}
console.log(`\nStage E M24 activation workflow complete. Current state: ${state()}`);
