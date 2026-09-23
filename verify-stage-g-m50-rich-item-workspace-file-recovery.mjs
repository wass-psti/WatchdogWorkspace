import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname);
const read=(f)=>fs.readFileSync(path.join(root,f),'utf8');
const exists=(f)=>fs.existsSync(path.join(root,f));
let checks=0;
const ok=(cond,msg)=>{assert.ok(cond,msg);checks+=1;};
const target=read('config/stage-g-m50-rich-item-workspace-file-recovery-target.ts');
const manifest=read('config/application-manifest.ts');
const runtime=read('assets/js/features/boards/services/item-workspace-runtime.ts');
const controller=read('assets/js/features/boards/controllers/item-workspace-controller.ts');
const boardsUi=read('assets/js/boards-ui.ts');
const view=read('assets/js/features/boards/views/item-workspace-view.ts');
const repo=read('assets/js/features/boards/data/board-repository.ts');
const contracts=read('src/features/boards/contracts/domain.ts')+read('src/features/boards/contracts/item-workspace.ts')+read('src/features/boards/contracts/repository.ts');
const migration=read('supabase/migrations/v1.43.2-stage-g-m50-rich-item-workspace-file-recovery.sql');
const schema=read('supabase/schema.sql');
const candidate=read('scripts/verify-stage-g-m50-candidate.sh');
const globalRlsStructure=read('supabase/tests/database/00_rls_structure.test.sql');

const browserSpec=read('tests/modern/e2e/rich-item-workspace-file-recovery.spec.mjs');
const browserFixture=read('tests/modern/e2e/helpers/m50-rich-item-workspace-fixture.mjs');
for(const token of ['@m50-registration-recovery','@m50-delete-recovery','failNextRegistrationResponses','failNextStorageDelete']) ok(browserSpec.includes(token)||browserFixture.includes(token),`M50 browser recovery authority missing ${token}`);
ok((browserSpec.match(/test\('/g)||[]).length>=5,'M50 browser authority must retain at least five lifecycle scenarios.');
const m49=read('config/stage-g-m49-boards-kanban-drag-drop-recovery-target.ts');
for(const f of ['M50-CONTINUATION-STATE.md','RELEASE-STATUS-v1.43.2-STAGE-G-M50-RICH-ITEM-WORKSPACE-FILE-RECOVERY.md','supabase/tests/m50/rich_item_workspace_file_recovery.test.sql','scripts/verify-rich-item-workspace-file-recovery-execution.mjs','scripts/run-rich-item-workspace-file-recovery-browser.mjs','tests/modern/e2e/rich-item-workspace-file-recovery.spec.mjs','scripts/verify-stage-g-m50-production-invariants.mjs','scripts/verify-stage-g-m50-finalizer-fail-closed.mjs']) ok(exists(f),`Missing M50 authority: ${f}`);
ok(/activationState:\s*'(?:implementation-complete-pending-certification|active-certified)'/.test(target),'M50 source state must be pending certification or active-certified.');
ok(target.includes("requiredState: 'active-certified'"),'M50 requires M49 certified prerequisite.');
ok(m49.includes("activationState: 'implementation-complete-pending-certification'"),'M49 repository source must retain its fail-closed pending-certification state.');
for(const token of ["certifiedCommit: '63ab65080b7b6fb33ba276fa169ca2a55b19d06c'","certifiedSourceTree: 'd26f3a136f02ff48cd6113ff605f5132cf903ad4c74beefbe29e1b642c5260f4'",'hostedWorkflowRun: 35687976043',"hostedArtifactSha256: '8f903ccaab516c1bbe678308ec042409d0b7a05d73d41b5b4275613183f2245a'"]) ok(target.includes(token),`M50 prerequisite evidence missing ${token}`);
ok(target.includes("architectureVersion: 58"),'M50 architecture target must be 58.');
ok(target.includes("semanticsVersion: '1.43.2-m50-v1'"),'M50 semantics version missing.');
ok(manifest.includes('architectureVersion: 58'),'Application manifest must advance to architecture 58.');
for(const token of ['supabase-storage-authoritative-item-workspace-recovery-v1','storage-first-retryable-metadata-finalize-v1','edit-mutates-view-reads-v1','stage-g-m50-rich-item-workspace-file-recovery-target.ts','rich_item_workspace_file_recovery.test.sql']) ok(manifest.includes(token),`Manifest missing ${token}`);
ok(manifest.includes("boardAttachmentDeletion: 'metadata-first-best-effort-object-cleanup-v1'"),'M46 historical attachment contract token must remain intact.');
for(const token of ['ItemWorkspacePermissions','permissions: ItemWorkspacePermissions','downloadItemFile','downloadFile']) ok(contracts.includes(token),`M50 contract missing ${token}`);
for(const token of ['permissions.can_comment','permissions.can_attach','WM_BOARD_EDIT_REQUIRED','downloadFile']) ok(runtime.includes(token),`Runtime missing ${token}`);
ok((runtime.match(/String\(entry\.id\) === String\(fileId\)/g)||[]).length>=3,'Workspace runtime must normalize file identifiers for open/download/delete actions.');
ok(controller.includes("data-download-item-file"),'Controller must handle explicit file downloads.');
ok(controller.includes('permissions.can_edit'),'Controller must defensively enforce item-property edit permission.');
const propertyFormDataIndex=controller.indexOf('const data = new FormData(form);');
const propertyDisableIndex=controller.indexOf('controls.forEach((control) => { control.disabled = true; });');
ok(propertyFormDataIndex>=0&&propertyDisableIndex>propertyFormDataIndex,'Item property submission must capture FormData before disabling successful controls.');
ok(controller.includes("String(entry.id) === String(fileId)"),'Attachment actions must normalize opaque DOM/runtime file identifiers before lookup.');
ok(controller.includes('confirmWorkspaceAction'),'Item Workspace destructive actions must use the nested-modal confirmation boundary.');
ok(boardsUi.includes("const itemWorkspaceDestructiveButtonSelector = '[data-delete-item-update],[data-delete-item-file]'"),'Board event ownership must explicitly identify destructive Item Workspace actions.');
ok(boardsUi.includes("button?.closest('[data-item-panel]')")&&boardsUi.includes('button.matches(itemWorkspaceDestructiveButtonSelector)'),'Destructive Item Workspace clicks must be scoped to the active Item Workspace panel.');
ok(boardsUi.includes("const target = eventElement(event);\n      if (!target) return;\n      const button = target.closest<HTMLButtonElement>('button');"),'Destructive Item Workspace event ownership must accept SVGElement descendants and resolve the owning button before HTMLElement-specific filtering.');
ok(boardsUi.includes("event.stopImmediatePropagation();")&&boardsUi.includes('void itemWorkspace.handleButton(button);'),'Destructive Item Workspace clicks must be claimed in capture phase and routed directly to the workspace controller.');
ok(boardsUi.includes("}, { capture: true, signal });"),'Destructive Item Workspace event ownership must be capture-phase and lifecycle-bound.');
ok(controller.includes("parentModal.setAttribute('aria-modal', 'false')")&&controller.includes('parentModal.inert = true'),'Item Workspace confirmation must suspend parent modal semantics while the child dialog is active.');
ok(controller.includes("parentModal.setAttribute('aria-modal', priorAriaModal)")&&controller.includes('parentModal.inert = priorInert'),'Item Workspace confirmation must restore parent modal semantics after the child dialog closes.');
ok(controller.includes('items: state.board.items.map')&&controller.includes('renderBoard();'),'Confirmed core-property writes must reconcile the active Board snapshot before authoritative reload.');
ok(controller.includes('values: existing')&&controller.includes("column_id: column.id, value"),'Confirmed custom-property writes must reconcile the active Board value snapshot before authoritative reload.');
ok(browserSpec.includes("getByRole('dialog', { name: /Confirm destructive action|Confirm action/ })"),'M50 destructive browser authority must follow the accessible dialog contract.');
ok(browserSpec.includes("toHaveAttribute('aria-modal', 'false')")&&browserSpec.includes("toHaveAttribute('inert', '')"),'M50 browser authority must verify parent-modal suspension for nested confirmation.');
ok(repo.includes('ItemWorkspaceEnvelope,'),'M50 attachment registration reconciliation must import its canonical ItemWorkspaceEnvelope contract for strict TypeScript inference.');
ok(candidate.includes('npm run typecheck') && candidate.indexOf('npm run typecheck')<candidate.indexOf('rich-item-workspace-recovery:database'),'M50 candidate must run TypeScript compilation before Database/Storage and browser certification gates.');
ok(candidate.includes('node verify-stage-g-m42-users-rbac-functional-recovery.mjs') && candidate.indexOf('verify-stage-g-m42-users-rbac-functional-recovery.mjs')<candidate.indexOf('rich-item-workspace-recovery:database'),'M50 candidate must front-load the M42 historical verifier before Database/Storage and browser certification gates.');
ok(!read('verify-stage-g-m42-users-rbac-functional-recovery.mjs').includes('!schema.includes(\"set search_path=pg_catalog,public\")'),'M42 verifier must scope wm_runtime_capabilities search_path validation to that function instead of rejecting unrelated hardened schema functions.');
const v124Verifier=read('verify-v1240-architecture-phase3.mjs');
ok(v124Verifier.includes("permissions: { can_edit: true, can_comment: true, can_attach: true, can_manage: true }"),'v1.24 Item Workspace fixture must include the current permission envelope.');
ok(candidate.includes('node --experimental-strip-types --disable-warning=ExperimentalWarning verify-v1240-architecture-phase3.mjs') && candidate.indexOf('verify-v1240-architecture-phase3.mjs')<candidate.indexOf('rich-item-workspace-recovery:database'),'M50 candidate must front-load the v1.24 Item Workspace compatibility verifier with TypeScript strip support before Database/Storage and browser certification gates.');
ok(candidate.includes('bash tests/browser/run-browser-tests.sh') && candidate.indexOf('bash tests/browser/run-browser-tests.sh')<candidate.indexOf('rich-item-workspace-recovery:database'),'M50 candidate must front-load the complete legacy browser integration suite before Database/Storage and historical certification gates.');
ok(candidate.includes("M50_BROWSER_GREP='@m50-files|@m50-delete-recovery'"),'M50 candidate must front-load the attachment-confirmation browser boundary before the full browser suite.');
ok(candidate.indexOf('rich-item-workspace-recovery:database')<candidate.indexOf("M50_BROWSER_GREP='@m50-files|@m50-delete-recovery'"),'M50 corrective candidate must front-load the changed Database/Storage authorization gate before repeating already-passed browser suites.');
ok(globalRlsStructure.includes("p.oid <> 'public.wm_board_contract_attestation()'::regprocedure")
  && globalRlsStructure.includes("p.oid <> 'public.wm_item_workspace_recovery_attestation()'::regprocedure"),
  'Global Database/RLS authority must permit only the two governed aggregate Board attestations through the anon SECURITY DEFINER exception.');
for(const token of [
  "'public.wm_get_board_item_workspace(uuid)'::regprocedure",
  "'public.wm_add_board_item_update(uuid,text)'::regprocedure",
  "'public.wm_delete_board_item_update(bigint)'::regprocedure",
  "'public.wm_register_board_item_file(uuid,text,text,text,bigint)'::regprocedure",
  "'public.wm_delete_board_item_file(uuid)'::regprocedure",
  "'public.wm_delete_board_item(uuid)'::regprocedure",
  "'public.wm_delete_board_permanently(uuid)'::regprocedure",
  "'public.wm_item_workspace_recovery_attestation()'::regprocedure",
  "array['search_path=pg_catalog, public']"
]) ok(globalRlsStructure.includes(token),`Global Database/RLS authority missing M50 hardened search-path contract ${token}`);
ok(candidate.includes('npm run database-rls:test:local')
  && candidate.indexOf('npm run database-rls:test:local')<candidate.indexOf("M50_BROWSER_GREP='@m50-files|@m50-delete-recovery'"),
  'M50 corrective candidate must front-load the changed global Database/RLS authority before repeating browser and historical regression gates.');
ok(browserSpec.includes("await expect(page.locator('[data-item-file-input]')).toBeEnabled();"),'M50 file lifecycle authority must wait for upload reconciliation to settle before delete actions.');
for(const token of ['View-only access: updates can be read but not posted.','View-only access: attachments can be opened or downloaded but not uploaded.','data-download-item-file','data.permissions.can_edit','data.permissions.can_comment','data.permissions.can_attach']) ok(view.includes(token),`Workspace view missing ${token}`);
const storageDeleteIndex=repo.indexOf("backend.storageDelete('work-board-files', canonicalPath");
const metadataDeleteIndex=repo.indexOf("rpc('wm_delete_board_item_file', { p_file_id: current.id })");
ok(storageDeleteIndex>=0&&metadataDeleteIndex>storageDeleteIndex,'Attachment deletion must be Storage-first then metadata-finalize.');
ok(repo.includes('BOARD_FILE_METADATA_FINALIZE_PENDING'),'Delete finalization must remain observable/retryable.');
ok(repo.includes('BOARD_FILE_REGISTRATION_RECONCILIATION_PENDING'),'Ambiguous registration must preserve object and emit reconciliation diagnostic.');
ok(repo.includes('BOARD_FILE_ROLLBACK_PENDING'),'Known-unregistered upload rollback failures must remain observable for orphan cleanup.');
ok((repo.match(/await register\(\)/g)||[]).length>=1&&repo.includes('attempt < 2'),'Attachment registration must retry idempotently.');
ok(repo.includes("authoritative.files.find((entry) => entry.storage_path === storagePath)"),'Upload must reconcile committed metadata before rollback.');
ok(repo.includes('AbortSignal.timeout(30_000)')&&repo.includes('anchor.download'),'Download must use bounded fetch and explicit browser download semantics.');
for(const token of ["'can_edit',can_edit","'can_comment',can_edit","'can_attach',can_edit","work_board_access(bid,'edit')","o.owner_id=auth.uid()::text","storage_path=p_storage_path","pending Storage objects","storage.objects","wm_item_workspace_recovery_attestation","1.43.2-m50-v1"]) ok(migration.includes(token),`Migration missing ${token}`);
ok(migration.includes("work_board_access(split_part(name,'/',1)::uuid,'view')")&&migration.includes("work_board_access(split_part(name,'/',1)::uuid,'edit')"),'Storage mutation policies must preserve M46 view fragment while enforcing M50 edit permission.');
ok(migration.includes("owner_id=auth.uid()::text or public.work_board_access(split_part(name,'/',1)::uuid,'manage')"),'Storage delete policy must bind uploader ownership or Board manage authority.');
ok(migration.includes('create schema if not exists wm_internal')&&migration.includes('create or replace function wm_internal.work_board_item_belongs_to_board')&&migration.includes('security definer set search_path=pg_catalog,public'),'Storage item-path membership must use a narrow security-definer helper instead of caller table privileges.');
ok((migration.match(/wm_internal\.work_board_item_belongs_to_board\(split_part\(name,'\/',2\)::uuid,split_part\(name,'\/',1\)::uuid\)/g)||[]).length===3,'All three Storage policies must validate board/item path membership through the security-definer helper.');
ok(migration.includes('revoke all on schema wm_internal from public, anon;')&&migration.includes('grant usage on schema wm_internal to authenticated;')&&migration.includes('revoke all on function wm_internal.work_board_item_belongs_to_board(uuid,uuid) from public, anon;')&&migration.includes('grant execute on function wm_internal.work_board_item_belongs_to_board(uuid,uuid) to authenticated;'),'Storage path helper execution must be restricted to authenticated callers.');
ok(!migration.includes('security definer set search_path=public')&&(migration.match(/security definer set search_path=pg_catalog,public/g)||[]).length>=9,'All M50 SECURITY DEFINER functions must use the hardened pg_catalog,public search path required by the production attestation.');
ok(!migration.includes('grant select on public.work_board_items to authenticated'),'M50 must preserve the RPC-only work_board_items table privilege boundary.');
ok(migration.includes('M50 compatibility extension for retained M46/M47 contract attestation')
  && migration.includes("'search_path=public'=any(p.proconfig)")
  && migration.includes("'search_path=pg_catalog, public'=any(p.proconfig)")
  && migration.includes("'search_path=pg_catalog, public'=any(m47_proc.proconfig)"),
  'M50 must preserve historical M46/M47 attestation compatibility while accepting only the hardened pg_catalog,public successor search path.');
ok(migration.includes("raise exception 'Delete Storage object before finalizing metadata'")&&migration.includes('metadata_finalize_guard_ok'),'Metadata finalization RPC and production attestation must fail closed while the private Storage object still exists.');
const m50DbAuthority=read('supabase/tests/m50/rich_item_workspace_file_recovery.test.sql');
ok(!/delete\s+from\s+storage\.objects/i.test(m50DbAuthority),'M50 pgTAP must treat Supabase Storage metadata as read-only for destructive operations and never issue SQL DELETE against storage.objects.');
ok(m50DbAuthority.includes('metadata finalization fails closed while the Storage object still exists')&&m50DbAuthority.includes('owner can finalize metadata after Storage object absence is authoritative'),'M50 pgTAP must prove both sides of the storage-first metadata-finalization invariant.');
ok(m50DbAuthority.includes('item deletion succeeds when no Storage object or file metadata exists'),'M50 pgTAP must verify clean item deletion without mutating Storage metadata directly.');
ok(schema.includes('-- Work Management App v1.43.2 — Stage G M50 Rich Item Workspace & File Recovery'),'Consolidated schema must include M50 migration.');
ok(schema.includes('wm_item_workspace_recovery_attestation'),'Consolidated schema must expose M50 production attestation.');
const deployment=read('supabase/deployments/m50/20260922141400_stage_g_m50_rich_item_workspace_file_recovery.sql');
ok(deployment===migration,'Isolated production deployment SQL must exactly match the authoritative M50 migration.');
const deployScript=read('scripts/deploy-stage-g-m50-production-recovery.sh');
for(const token of ['20260917142647_stage_g_m46_boards_backend_data_contract_recovery.sql','20260919165239_stage_g_m47_boards_table_group_item_recovery.sql','20260922141400_stage_g_m50_rich_item_workspace_file_recovery.sql','migration list --linked','db push --linked']) ok(deployScript.includes(token),`M50 production deploy history authority missing ${token}`);
ok(!deployScript.includes('--include-all'),'M50 isolated production deploy must not bypass ordered migration history with --include-all.');
ok(deployScript.includes("node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/verify-stage-g-m46-production-contract.mjs"),'M50 production deploy must execute retained M46 live attestation with Node TypeScript strip support.');
ok(deployScript.includes("M50 production recovery is already live; M50/M46 live attestations PASS; migration replay skipped."),'M50 production deploy resume path must attest M50 and retained M46 before skipping migration replay.');
ok(!/node scripts\/verify-stage-g-m46-production-contract\.mjs/.test(deployScript),'M50 production deploy must not invoke the TypeScript-importing M46 production verifier with plain Node.');
const finalizerScript=read('scripts/finalize-stage-g-m50.sh');
ok(finalizerScript.includes("node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/verify-stage-g-m46-production-contract.mjs"),'M50 exact-commit finalizer must execute retained M46 production verification with Node TypeScript strip support.');
ok(!/node scripts\/verify-stage-g-m46-production-contract\.mjs/.test(finalizerScript),'M50 exact-commit finalizer must not invoke the TypeScript-importing M46 verifier with plain Node.');

ok(schema.trimEnd().endsWith(migration.trimEnd()),'Consolidated schema must end with the exact authoritative M50 migration.');
const oldM21=read('scripts/verify-rich-item-workspace-execution.mjs');
ok(oldM21.includes('permissions: { can_edit: true, can_comment: true, can_attach: true, can_manage: true }'),'Historical M21 execution fixture must be synchronized to explicit permissions.');
for(const f of ['tests/browser/integration.js','tests/browser/run-cdp.mjs','tests/modern/e2e/helpers/m47-boards-table-fixture.mjs','tests/modern/e2e/helpers/m49-boards-kanban-fixture.mjs']) ok(read(f).includes('can_attach:true')||read(f).includes('can_attach: true'),`Historical workspace fixture must publish explicit M50 permissions: ${f}`);
const browserCdp=read('tests/browser/run-cdp.mjs');
ok(browserCdp.includes("const activityState={board:{groups:[{id:'g',title:'Group'}],items:[{id:'activity-item'")&&browserCdp.includes("data:{permissions:{can_edit:true,can_comment:true,can_attach:true,can_manage:true},updates:[],files:[],activity:["),'Legacy browser Item Activity fixture must include the current M50 permission envelope.');
ok(browserCdp.includes("b.resolve({permissions:{can_edit:true,can_comment:true,can_attach:true,can_manage:true},updates:[{id:'b-update'"),'Legacy browser stale-response fixture must load Item B with the current M50 permission envelope.');
ok(browserCdp.includes("a.resolve({permissions:{can_edit:true,can_comment:true,can_attach:true,can_manage:true},updates:[{id:'a-update'"),'Legacy browser stale-response fixture must load Item A with the current M50 permission envelope before upload isolation is exercised.');
const browserIntegration=read('tests/browser/integration.js');
ok(!browserCdp.includes('data:{updates:')&&!browserIntegration.includes('data:{updates:'),'Legacy browser Item Workspace fixtures must not bypass the required M50 permission envelope.');
ok(m50DbAuthority.includes('select plan(33)'),'M50 database authority must retain the complete 33-assertion lifecycle plan.');
ok(candidate.includes('rich-item-workspace-recovery:finalizer:test'),'M50 candidate must exercise the fail-closed finalizer before predecessor regression.');
ok(candidate.indexOf('rich-item-workspace-recovery:finalizer:test')<candidate.indexOf('boards-kanban-drag-drop:verify:candidate'),'M50 finalizer self-test must run before the inherited M49 regression chain.');
ok(candidate.includes('boards-kanban-drag-drop:verify:candidate'),'M50 candidate reuses the complete M49 predecessor regression authority.');

const m46Verifier=read('verify-stage-g-m46-boards-backend-data-contract-recovery.mjs');
ok(m46Verifier.includes('legacyMetadataFirst||m50StorageFirst'),'M50 synchronizes the historical M46 attachment lifecycle verifier without weakening either contract.');
const m46Execution=read('scripts/verify-boards-backend-data-contract-recovery-execution.mjs');
ok(m46Execution.includes('legacyMetadataFirst||m50StorageFirst'),'M50 synchronizes the historical M46 deterministic attachment lifecycle authority.');
ok(JSON.parse(read('package.json')).scripts?.['rich-item-workspace-recovery:finalizer:test'],'M50 package scripts must expose the fail-closed finalizer self-test.');
console.log(`Stage G M50 Rich Item Workspace & File Recovery static verification: PASS (${checks} checks)`);
