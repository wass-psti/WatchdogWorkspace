import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const text=r=>fs.readFileSync(path.join(root,r),'utf8');
const digest=r=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,r))).digest('hex');
const record=JSON.parse(text('M1458-HISTORICAL-WORKFLOW-INVENTORY.json'));
const manifest=JSON.parse(text('M145-REMOVAL-MANIFEST.json'));
const reject=(condition,reason)=>assert.ok(condition,`M145 historical workflow ownership BLOCKED: ${reason}`);
const original='994e925898fa7de596050cd06ec68a5a94a7c92b';
const pinned=["boards-backend-data-contract-recovery.yml", "boards-collection-route-recovery.yml", "boards-columns-cells-status-system-recovery.yml", "boards-kanban-drag-drop-recovery.yml", "boards-table-group-item-recovery.yml", "management-authority-consolidation.yml", "rich-item-workspace-file-recovery.yml", "users-rbac-functional-recovery.yml", "settings-functional-recovery.yml", "account-functional-recovery.yml", "final-legacy-deletion.yml", "cross-module-rbac-authenticated-e2e.yml", "functional-regression-baseline.yml"];
reject(record.predecessorCommit===original && manifest.baseReleaseCommit===original,'wrong archived source SHA');
reject(JSON.stringify(Object.keys(record.archiveOnlyWorkflows).sort())===JSON.stringify([...pinned].sort()),'historical scope expanded or reduced');
reject(Object.keys(record.frozenOriginalSource).length===pinned.length,'original certification digests missing');
const all=fs.readdirSync(path.join(root,'.github/workflows')).filter(x=>x.endsWith('.yml')).sort();
reject(all.length===31,'unexpected workflow count (must review additional automation)');
for(const n of pinned){
 const pathName='.github/workflows/'+n;
 const source=text(pathName);
 reject(digest(pathName)===record.archiveOnlyWorkflows[n] && digest(pathName)===manifest.approvedModifiedSha256[pathName],`archive-only source drift: ${n}`);
 reject(/\bon:\s*\n\s*workflow_dispatch:\s*\n/.test(source),'manual historical trigger removed: '+n);
 reject(!/\n\s*pull_request:/.test(source) && !/\n\s*push:/.test(source),`automatic old-source test revived: ${n}`);
 reject(source.includes(`test \"$GITHUB_SHA\" = '${original}'`) && source.includes('test \"$EXPECTED_HISTORICAL_SHA\"'),`untrusted historical revision: ${n}`);
 reject(record.frozenOriginalSource[n]===manifest.baselineSha256[pathName],`pre-removal original digest changed: ${n}`);
}
const stillActive=all.filter(n=>!pinned.includes(n)).filter(n=>/\n\s*(?:pull_request|push):/.test(text('.github/workflows/'+n)));
reject(JSON.stringify(stillActive)===JSON.stringify(record.retainedAutomaticWorkflows),'current core/security automatic coverage drift');
for(const needed of ['ci.yml','deploy-pages.yml','m145-clean-platform-successor.yml','codeql.yml','dependency-review.yml','modern-tests.yml','auth-session-access-context.yml','service-worker-updates.yml'])
 reject(stillActive.includes(needed),'essential ongoing CI missing: '+needed);
const current=text('.github/workflows/m145-clean-platform-successor.yml');
reject(current.includes('verify-m145-predecessor-provenance.mjs') && current.includes('verify-m145-successor-core.mjs') && current.includes('npm run typecheck') && current.includes('npm run build'), 'M145 current successor weakened');
for(const untouched of ['scripts/verify-all-historical-verifiers.mjs','scripts/verify-m108-login-successor.mjs','verify-stage-f-m36-production-cutover-certification.mjs'])reject(fs.statSync(path.join(root,untouched)).size>500,'original verifier removed: '+untouched);
console.log(`M145.8 historical workflow ownership: PASS (${pinned.length} archived-only; ${stillActive.length} automatic core/security workflows retained; no legacy execution on M145)`);
