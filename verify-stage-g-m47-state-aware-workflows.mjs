import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=process.cwd();
const read=(relative)=>readFileSync(resolve(root,relative),'utf8');
const checks=[];
const check=(condition,label)=>{if(!condition)throw new Error(`M47 state-aware workflow verification failed: ${label}`);checks.push(label);};
const historical=[
  ['M43','.github/workflows/settings-functional-recovery.yml','config/stage-g-m43-settings-functional-recovery-target.ts','npm run settings-recovery:verify:release','npm run settings-recovery:certify','M43','m43'],
  ['M44','.github/workflows/management-authority-consolidation.yml','config/stage-g-m44-management-authority-consolidation-target.ts','npm run management-authority:verify:release','npm run management-authority:certify','M44','m44'],
  ['M45','.github/workflows/boards-collection-route-recovery.yml','config/stage-g-m45-boards-collection-route-recovery-target.ts','npm run boards-collection:verify:release','npm run boards-collection:certify','M45','m45'],
  ['M46','.github/workflows/boards-backend-data-contract-recovery.yml','config/stage-g-m46-boards-backend-data-contract-recovery-target.ts','npm run board-backend-contract:verify:release','npm run board-backend-contract:certify','M46','m46'],
].map(([id,workflow,target,regressionScript,certifyScript,envPrefix,slug])=>({id,workflow,target,regressionScript,certifyScript,sourceEnv:`${envPrefix}_SOURCE_COMMIT: \${{ github.sha }}`,expectedEnv:`${envPrefix}_EXPECTED_SOURCE_COMMIT: \${{ github.sha }}`,artifactPrefix:`work-management-v1.43.2-stage-g-${slug}-certified-\${{ github.sha }}`,outDir:`${slug}-certified-artifacts-upload/`}));
for(const milestone of historical){
  const source=read(milestone.workflow); const target=read(milestone.target);
  check(source.includes('push:')&&source.includes('pull_request:'),`${milestone.id} workflow retains push and pull-request triggers`);
  check(source.includes('permissions:\n  contents: read'),`${milestone.id} workflow keeps read-only repository permission`);
  check(source.includes(milestone.regressionScript),`${milestone.id} regression path remains governed`);
  check(source.includes(milestone.certifyScript),`${milestone.id} certification path remains governed`);
  check(source.includes(milestone.sourceEnv),`${milestone.id} certification remains SHA-bound`);
  check(source.includes(milestone.expectedEnv),`${milestone.id} artifact verification remains SHA-bound`);
  check(source.includes(milestone.artifactPrefix)&&source.includes(milestone.outDir),`${milestone.id} publication remains milestone-scoped`);
  check(!source.includes('continue-on-error:'),`${milestone.id} workflow has no continue-on-error bypass`);
  check(target.includes("activationState: 'active-certified'")||target.includes("activationState: 'implementation-complete-pending-certification'"),`${milestone.id} target remains in a recognized historical state`);
}
const source=read('.github/workflows/boards-table-group-item-recovery.yml');
const target=read('config/stage-g-m47-boards-table-group-item-recovery-target.ts');
for(const token of ['push:','pull_request:','permissions:\n  contents: read','node-version: 22.16.0','npm ci --ignore-scripts','modern-tests:toolchain:ensure','supabase/setup-cli@v1','version: 2.117.0','id: milestone_state','state=active-certified','state=pending','state=in-progress','npm run boards-table-recovery:verify:candidate','npm run boards-table-recovery:verify:release','npm run boards-table-recovery:certify','M47_SOURCE_COMMIT: ${{ github.sha }}','M47_EXPECTED_SOURCE_COMMIT: ${{ github.sha }}','work-management-v1.43.2-stage-g-m47-certified-${{ github.sha }}','m47-certified-artifacts-upload/','if-no-files-found: error']) check(source.includes(token),`M47 workflow contains ${token}`);
check(source.includes("github.event_name == 'pull_request' || steps.milestone_state.outputs.state == 'in-progress'"),'M47 PR/in-progress path is non-publishing candidate validation');
check(source.includes("github.event_name == 'push' && steps.milestone_state.outputs.state == 'pending'"),'M47 pending push is certification-routed');
check(source.includes("github.event_name == 'push' && steps.milestone_state.outputs.state == 'active-certified'"),'M47 active-certified push is regression-only');
check(source.includes('boards-table-recovery:finalizer:test')&&source.includes('boards-table-recovery:deployment-guard:test'),'M47 workflow preflights fail-closed certification/deployment harnesses');
check(!source.includes('continue-on-error:'),'M47 workflow has no continue-on-error bypass');
check(target.includes("activationState: 'implementation-in-progress'")||target.includes("activationState: 'implementation-complete-pending-certification'")||target.includes("activationState: 'active-certified'"),'M47 target exposes a recognized workflow state');
console.log(`Stage G M47 state-aware workflow verification: PASS (${checks.length} checks)`);
