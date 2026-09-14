import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const run=(script,label)=>{console.log(`\n================ ${label} ================`);const result=spawnSync('npm',['run',script],{cwd:root,stdio:'inherit',shell:false});if(result.error)throw result.error;if(result.status!==0)throw new Error(`${label} failed with exit code ${result.status??'unknown'}.`);};
const state=(file)=>fs.readFileSync(path.join(root,file),'utf8').match(/activationState:\s*'([^']+)'/)?.[1]??'unknown';
if(process.version!=='v22.16.0')throw new Error(`Stage F certification requires Node v22.16.0; current ${process.version}.`);
run('governance:restore','Synchronize governed repository artifacts');
run('dependencies:ensure','Ensure exact lockfile dependencies');
run('stage-e:certify','Revalidate certified Stage E platform prerequisite');
if(state('config/stage-e-m26-iframe-retirement-target.ts')!=='active-certified')throw new Error('M26 must remain active-certified before Stage F certification.');
let m27=state('config/stage-f-m27-realtime-platform-target.ts');
if(m27!=='active-certified'){
  run('realtime-platform:activate:release','Activate and release-certify M27');
  m27=state('config/stage-f-m27-realtime-platform-target.ts');
}
if(m27!=='active-certified')throw new Error(`M27 did not reach active-certified; current state ${m27}.`);
run('realtime-platform:check','Revalidate M27 realtime platform architecture');
let m28=state('config/stage-f-m28-edge-functions-target.ts');
if(m28!=='active-certified'){
  run('edge-functions:activate:release','Activate and release-certify M28');
  m28=state('config/stage-f-m28-edge-functions-target.ts');
}
if(m28!=='active-certified')throw new Error(`M28 did not reach active-certified; current state ${m28}.`);
run('edge-functions:check','Revalidate M28 Edge Functions architecture');
let m29=state('config/stage-f-m29-database-rls-test-suite-target.ts');
if(m29!=='active-certified'){
  run('database-rls:activate:release','Activate and release-certify M29');
  m29=state('config/stage-f-m29-database-rls-test-suite-target.ts');
}
if(m29!=='active-certified')throw new Error(`M29 did not reach active-certified; current state ${m29}.`);
run('database-rls:check','Revalidate M29 Database/RLS test architecture');
let m30=state('config/stage-f-m30-modern-testing-stack-target.ts');
if(m30!=='active-certified'){
  run('modern-tests:activate:release','Activate and release-certify M30');
  m30=state('config/stage-f-m30-modern-testing-stack-target.ts');
}
if(m30!=='active-certified')throw new Error(`M30 did not reach active-certified; current state ${m30}.`);
run('modern-tests:check','Revalidate M30 modern testing architecture');
let m31=state('config/stage-f-m31-performance-engineering-target.ts');
if(m31!=='active-certified'){
  run('performance:activate:release','Activate and release-certify M31');
  m31=state('config/stage-f-m31-performance-engineering-target.ts');
}
if(m31!=='active-certified')throw new Error(`M31 did not reach active-certified; current state ${m31}.`);
run('performance:check','Revalidate M31 performance engineering architecture');
let m32=state('config/stage-f-m32-observability-target.ts');
if(m32!=='active-certified'){
  run('observability:activate:release','Activate and release-certify M32');
  m32=state('config/stage-f-m32-observability-target.ts');
}
if(m32!=='active-certified')throw new Error(`M32 did not reach active-certified; current state ${m32}.`);
run('observability:check','Revalidate M32 observability architecture');
run('observability:test','Revalidate M32 observability execution vectors');
let m33=state('config/stage-f-m33-service-worker-update-strategy-target.ts');
if(m33!=='active-certified'){
  run('service-worker-update:activate:release','Activate and release-certify M33');
  m33=state('config/stage-f-m33-service-worker-update-strategy-target.ts');
}
if(m33!=='active-certified')throw new Error(`M33 did not reach active-certified; current state ${m33}.`);
run('service-worker-update:check','Revalidate M33 service-worker/update architecture');
run('service-worker-update:test','Revalidate M33 service-worker/update execution vectors');
let m34=state('config/stage-f-m34-backup-disaster-recovery-target.ts');
if(m34!=='active-certified'){
  run('backup-dr:activate:release','Activate and release-certify M34');
  m34=state('config/stage-f-m34-backup-disaster-recovery-target.ts');
}
if(m34!=='active-certified')throw new Error(`M34 did not reach active-certified; current state ${m34}.`);
run('backup-dr:check','Revalidate M34 backup/disaster-recovery architecture');
run('backup-dr:test','Revalidate M34 backup/disaster-recovery execution vectors');
let m35=state('config/stage-f-m35-final-legacy-deletion-target.ts');
if(m35!=='active-certified'){
  run('legacy-deletion:activate:release','Activate and release-certify M35');
  m35=state('config/stage-f-m35-final-legacy-deletion-target.ts');
}
if(m35!=='active-certified')throw new Error(`M35 did not reach active-certified; current state ${m35}.`);
run('legacy-deletion:check','Revalidate M35 final legacy deletion architecture');
run('legacy-deletion:test','Revalidate M35 final legacy deletion execution vectors');
let m36=state('config/stage-f-m36-production-cutover-certification-target.ts');
if(m36!=='active-certified'){
  run('cutover:activate:release','Activate and release-certify M36');
  m36=state('config/stage-f-m36-production-cutover-certification-target.ts');
}
if(m36!=='active-certified')throw new Error(`M36 did not reach active-certified; current state ${m36}.`);
run('cutover:check','Revalidate M36 production cutover architecture');
run('cutover:test','Revalidate M36 production cutover execution vectors');
run('cutover:artifact','Revalidate M36 production artifact');
run('realtime-platform:status','M27 final status');
run('edge-functions:status','M28 final status');
run('database-rls:status','M29 final status');
run('modern-tests:status','M30 final status');
run('performance:status','M31 final status');
run('observability:status','M32 final status');
run('service-worker-update:status','M33 final status');
run('backup-dr:status','M34 final status');
run('legacy-deletion:status','M35 final status');
run('cutover:status','M36 final status');
console.log('\nStage F platform certification: PASS');
console.log('M27 Realtime platform architecture: active-certified');
console.log('M28 Edge Functions: active-certified');
console.log('M29 Database/RLS test suite: active-certified');
console.log('M30 Modern testing stack: active-certified');
console.log('M31 Performance engineering: active-certified');
console.log('M32 Observability: active-certified');
console.log('M33 Service worker / update strategy: active-certified');
console.log('M34 Backup and disaster recovery: active-certified');
console.log('M35 Final legacy deletion: active-certified');
console.log('M36 Production cutover certification: active-certified');
