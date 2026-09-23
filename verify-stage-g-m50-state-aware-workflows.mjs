import fs from 'node:fs';import assert from 'node:assert/strict';
const workflow=fs.readFileSync('.github/workflows/rich-item-workspace-file-recovery.yml','utf8');
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++};
for(const token of ['push:','pull_request:','node-version: 22.16.0','version: 2.117.0','npm ci --ignore-scripts','rich-item-workspace-recovery:check','rich-item-workspace-recovery:test','rich-item-workspace-recovery:browser','rich-item-workspace-recovery:database','rich-item-workspace-recovery:production','rich-item-workspace-recovery:certify','verify-stage-g-m50-certified-artifact.mjs','actions/upload-artifact@v4'])ok(workflow.includes(token),`M50 workflow missing ${token}`);
ok(workflow.includes("activationState:[[:space:]]*'active-certified'"),'Workflow resolves active-certified state.');
ok(workflow.includes("activationState:[[:space:]]*'implementation-complete-pending-certification'"),'Workflow resolves pending certification state.');
ok(workflow.indexOf('rich-item-workspace-recovery:check')<workflow.indexOf('rich-item-workspace-recovery:browser'),'Workflow orders static verification before browser verification.');
ok(workflow.indexOf('rich-item-workspace-recovery:database')<workflow.indexOf('rich-item-workspace-recovery:production'),'Workflow proves disposable database before production attestation.');
console.log(`Stage G M50 state-aware workflow verification: PASS (${checks} checks)`);
