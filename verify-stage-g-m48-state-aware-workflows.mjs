import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=process.cwd();
const read=(relative)=>readFileSync(resolve(root,relative),'utf8');
const checks=[];
const check=(condition,label)=>{if(!condition)throw new Error(`M48 state-aware workflow verification failed: ${label}`);checks.push(label);};

const m47Workflow=read('.github/workflows/boards-table-group-item-recovery.yml');
const m47Target=read('config/stage-g-m47-boards-table-group-item-recovery-target.ts');
for(const token of ['push:','pull_request:','npm run boards-table-recovery:verify:release','npm run boards-table-recovery:certify','M47_SOURCE_COMMIT: ${{ github.sha }}','M47_EXPECTED_SOURCE_COMMIT: ${{ github.sha }}','m47-certified-artifacts-upload/']) check(m47Workflow.includes(token),`retained M47 workflow contains ${token}`);
check(!m47Workflow.includes('continue-on-error:'),'retained M47 workflow has no continue-on-error bypass');
check(m47Target.includes("activationState: 'active-certified'"),'M47 prerequisite remains active-certified');

const source=read('.github/workflows/boards-columns-cells-status-system-recovery.yml');
const target=read('config/stage-g-m48-boards-columns-cells-status-recovery-target.ts');
for(const token of [
  'push:','pull_request:','permissions:\n  contents: read','node-version: 22.16.0','npm ci --ignore-scripts','modern-tests:toolchain:ensure',
  'supabase/setup-cli@v1','version: 2.117.0','id: milestone_state','state=active-certified','state=pending','state=in-progress',
  'npm run boards-columns-cells-status:verify:candidate','npm run boards-columns-cells-status:verify:release','npm run boards-columns-cells-status:certify',
  'M48_SOURCE_COMMIT: ${{ github.sha }}','M48_EXPECTED_SOURCE_COMMIT: ${{ github.sha }}','work-management-v1.43.2-stage-g-m48-certified-${{ github.sha }}',
  'm48-certified-artifacts-upload/','if-no-files-found: error',
]) check(source.includes(token),`M48 workflow contains ${token}`);
check(source.includes("github.event_name == 'pull_request' || steps.milestone_state.outputs.state == 'in-progress'"),'M48 PR/in-progress path is non-publishing candidate validation');
check(source.includes("github.event_name == 'push' && steps.milestone_state.outputs.state == 'pending'"),'M48 pending push is certification-routed');
check(source.includes("github.event_name == 'push' && steps.milestone_state.outputs.state == 'active-certified'"),'M48 active-certified push is regression-only');
check(source.includes('boards-columns-cells-status:finalizer:test')&&source.includes('boards-columns-cells-status:production-boundary'),'M48 workflow preflights finalizer and retained-backend boundary');
check(!source.includes('continue-on-error:'),'M48 workflow has no continue-on-error bypass');
check(target.includes("activationState: 'implementation-in-progress'")||target.includes("activationState: 'implementation-complete-pending-certification'")||target.includes("activationState: 'active-certified'"),'M48 target exposes a recognized workflow state');
console.log(`Stage G M48 state-aware workflow verification: PASS (${checks.length} checks)`);
