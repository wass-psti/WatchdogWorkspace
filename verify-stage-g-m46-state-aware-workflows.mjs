import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const read=(relative)=>readFileSync(resolve(root,relative),'utf8');
const checks=[];
const check=(condition,label)=>{if(!condition)throw new Error(`M46 state-aware workflow verification failed: ${label}`);checks.push(label);};

const milestones=[
  ['M43','.github/workflows/settings-functional-recovery.yml','config/stage-g-m43-settings-functional-recovery-target.ts','npm run settings-recovery:verify:release','npm run settings-recovery:certify','M43','m43'],
  ['M44','.github/workflows/management-authority-consolidation.yml','config/stage-g-m44-management-authority-consolidation-target.ts','npm run management-authority:verify:release','npm run management-authority:certify','M44','m44'],
  ['M45','.github/workflows/boards-collection-route-recovery.yml','config/stage-g-m45-boards-collection-route-recovery-target.ts','npm run boards-collection:verify:release','npm run boards-collection:certify','M45','m45'],
  ['M46','.github/workflows/boards-backend-data-contract-recovery.yml','config/stage-g-m46-boards-backend-data-contract-recovery-target.ts','npm run board-backend-contract:verify:release','npm run board-backend-contract:certify','M46','m46'],
].map(([id,workflow,target,regressionScript,certifyScript,envPrefix,slug])=>({id,workflow,target,regressionScript,certifyScript,sourceEnv:`${envPrefix}_SOURCE_COMMIT: \${{ github.sha }}`,expectedEnv:`${envPrefix}_EXPECTED_SOURCE_COMMIT: \${{ github.sha }}`,artifactPrefix:`work-management-v1.43.2-stage-g-${slug}-certified-\${{ github.sha }}`,outDir:`${slug}-certified-artifacts-upload/`}));

for(const milestone of milestones){
  const source=read(milestone.workflow); const target=read(milestone.target);
  check(source.includes('push:')&&source.includes('pull_request:'),`${milestone.id} workflow retains push and pull-request triggers`);
  check(source.includes('permissions:\n  contents: read'),`${milestone.id} workflow keeps read-only repository permission`);
  check(source.includes('node-version: 22.16.0')||source.includes('node-version-file: .nvmrc'),`${milestone.id} workflow uses governed Node`);
  check(source.includes('npm ci --ignore-scripts')||source.includes('npm ci'),`${milestone.id} workflow materializes lockfile dependencies`);
  check(source.includes('modern-tests:toolchain:ensure'),`${milestone.id} workflow materializes modern test toolchain`);
  check(source.includes('id: milestone_state'),`${milestone.id} workflow resolves milestone state`);
  check(source.includes('state=active-certified')&&source.includes('state=pending'),`${milestone.id} workflow recognizes active-certified and pending states`);
  check(source.includes("steps.milestone_state.outputs.state == 'active-certified'"),`${milestone.id} active-certified push is regression-only`);
  check(source.includes("steps.milestone_state.outputs.state == 'pending'"),`${milestone.id} pending push is certification-routed`);
  check(source.includes("github.event_name == 'pull_request'"),`${milestone.id} pull requests remain non-publishing`);
  check(source.includes(milestone.regressionScript),`${milestone.id} regression path calls release verifier`);
  check(source.includes(milestone.certifyScript),`${milestone.id} pending path calls fail-closed certifier`);
  check(source.includes(milestone.sourceEnv),`${milestone.id} certification binds github.sha`);
  check(source.includes(milestone.expectedEnv),`${milestone.id} artifact verification binds github.sha`);
  check(source.includes(milestone.artifactPrefix),`${milestone.id} artifact name includes source SHA`);
  check(source.includes(milestone.outDir),`${milestone.id} publishes only milestone artifact directory`);
  check(source.includes('if-no-files-found: error'),`${milestone.id} publication fails closed if outputs are missing`);
  check(!source.includes('continue-on-error:'),`${milestone.id} workflow has no continue-on-error bypass`);
  check(target.includes("activationState: 'active-certified'")||target.includes("activationState: 'implementation-complete-pending-certification'"),`${milestone.id} target exposes recognized workflow state`);
}
const m46=read('.github/workflows/boards-backend-data-contract-recovery.yml');
check(m46.includes('supabase/setup-cli@v1')&&m46.includes('version: 2.117.0'),'M46 hosted certification pins Supabase CLI 2.117.0');
check(m46.includes("VITE_SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL || 'https://jtlusodorfnyzgyuewkz.supabase.co' }}"),'M46 hosted workflow binds production Supabase URL from repository variables with governed public fallback');
check(m46.includes("VITE_SUPABASE_PUBLISHABLE_KEY: ${{ vars.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_CrkvaTRYTYAMVbieywNMyg_a0F7HpB6' }}"),'M46 hosted workflow binds production publishable key from repository variables with governed public fallback');
check(m46.includes('npm run board-backend-contract:finalizer:test')&&m46.includes('npm run board-backend-contract:deployment-guard:test'),'M46 hosted workflow runs fail-closed finalizer and production-deployment guard regressions before certification');
check(m46.includes("github.event_name == 'push' && steps.milestone_state.outputs.state == 'pending'"),'M46 publishes only from pending push');
console.log(`Stage G M46 state-aware workflow verification: PASS (${checks.length} checks)`);
