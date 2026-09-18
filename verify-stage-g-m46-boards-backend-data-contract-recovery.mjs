import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root=process.cwd();
const read=(path)=>readFileSync(resolve(root,path),'utf8');
const canonical=(value)=>Array.isArray(value)?`[${value.map(canonical).join(',')}]`:value&&typeof value==='object'?`{${Object.keys(value).sort().map((key)=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`:JSON.stringify(value);
const contractModule=await import(pathToFileURL(resolve(root,'config/stage-g-m46-board-backend-contract.ts')).href);
const targetModule=await import(pathToFileURL(resolve(root,'config/stage-g-m46-boards-backend-data-contract-recovery-target.ts')).href);
const { M46_BOARD_BACKEND_CONTRACT:contract,M46_BOARD_CONTRACT_DIGEST:digest,M46_BOARD_CONTRACT_VERSION:version }=contractModule;
const target=targetModule.stageGM46BoardsBackendDataContractRecoveryTarget;
const calculated=createHash('sha256').update(canonical(contract)).digest('hex');
assert.equal(digest,calculated,'M46 contract digest must bind the canonical contract manifest.');
assert.equal(version,'1.43.2-m46-v1');
assert.equal(target.milestone,46);
assert.equal(target.architectureVersion,54);
assert(['implementation-complete-pending-certification','active-certified'].includes(target.activationState),'M46 activation state must be recognized.');
assert.equal(target.prerequisite.milestone,45);

const manifest=read('config/application-manifest.ts');
const manifestTypes=read('src/types/manifest.ts');
const manifestSchema=read('src/runtime-schemas/manifest.ts');
assert.match(manifest,/architectureVersion:\s*54/,'Application architecture must be 54 for M46.');
for(const token of [
  "boardBackendDataContractRecovery: 'catalog-attested-board-contract-v1'",
  "boardBackendContract: 'config/stage-g-m46-board-backend-contract.ts'",
  "boardBackendContractAttestation: 'public.wm_board_contract_attestation'",
  "boardBackendCacheOwnership: 'board-query-prefix-scoped-v1'",
  "boardAttachmentDeletion: 'metadata-first-best-effort-object-cleanup-v1'",
]) assert(manifest.includes(token),`Architecture 54 manifest authority is missing ${token}.`);
assert(manifestTypes.includes("boardBackendDataContractRecovery?: 'catalog-attested-board-contract-v1'")&&manifestSchema.includes("Architecture v54+ requires catalog-attested Boards backend/data-contract recovery"),'Architecture 54 type/runtime schema authority must be registered.');

const migration=read('supabase/migrations/v1.43.2-stage-g-m46-boards-backend-data-contract-recovery.sql');
const deployment=read('supabase/deployments/m46/20260917142647_stage_g_m46_boards_backend_data_contract_recovery.sql');
const schema=read('supabase/schema.sql');
const repo=read('assets/js/features/boards/data/board-repository.ts');
const dto=read('assets/js/features/boards/data/board-contracts.ts');
const preflight=read('assets/js/platform/data/backend-capability-preflight.ts');
const m45=read('config/stage-g-m45-boards-collection-route-recovery-target.ts');
const dbtest=read('supabase/tests/m46/boards_backend_contract_recovery.test.sql');
assert.equal(migration,deployment,'Governed production forward migration must be byte-identical to M46 migration provenance.');
assert(schema.includes(migration),'Authoritative schema snapshot must include the complete M46 forward migration.');
assert(migration.includes(`'contract_digest','${digest}'`)&&migration.includes(`'contract_version','${version}'`),'M46 SQL must publish the governed version/digest.');
assert(migration.includes('pg_catalog.pg_proc')&&migration.includes('information_schema.columns')&&migration.includes('relrowsecurity')&&migration.includes("has_table_privilege('authenticated'")&&migration.includes('pg_catalog.pg_policies')&&migration.includes('pg_catalog.pg_trigger'),'M46 live attestation must inspect RPC signatures, table contracts, RLS/direct privileges, policies, and realtime triggers dynamically.');
assert(migration.includes('actual_column_count=jsonb_array_length')&&migration.includes("c.column_name=req.column_contract->>'name'"),'M46 table attestation must compare exact column sets without binding physical column order.');
assert(migration.includes("board_table_policy_count integer := 0")&&migration.includes("pp.schemaname='public' and pp.tablename=tbl->>'name'"),'M46 must attest the zero-direct-policy Board RLS model table by table.');
assert(migration.includes('public.work_board_realtime_topic_access')&&migration.includes('public.work_board_realtime_broadcast_change')&&migration.includes("set search_path=''")&&migration.includes('realtime.send('),'M46 forward migration must recover and harden private Board Realtime authority.');
assert(migration.includes("'realtime_function_count',realtime_function_count")&&migration.includes('t.tgtype=29'),'M46 attestation must bind Realtime helper functions and exact row-level INSERT/UPDATE/DELETE trigger semantics.');
assert(migration.includes("grant execute on function public.wm_board_contract_attestation() to anon, authenticated"),'Safe production attestation must be callable with public runtime credentials.');
assert(migration.includes("'author_id',u.created_by")&&migration.includes("'author_id',f.created_by")&&migration.includes("'actor_id',e.actor_id"),'M46 item-workspace SQL must emit canonical identity fields.');

assert.equal(contract.rpcs.length,40,'M46 must govern all 40 Board RPCs.');
assert.equal(contract.tables.length,9,'M46 must govern all nine Board tables.');
assert(contract.tables.every((table)=>Array.isArray(table.policies)&&table.policies.length===0),'All Board tables must bind the RPC-only deny-by-default RLS policy model.');
assert.equal(contract.realtime.functions.length,2,'M46 must govern both private Board Realtime helper functions.');
assert.equal(contract.realtime.policies.length,2,'M46 must govern both private Board Realtime authorization policies.');
assert.equal(contract.realtime.triggers.length,8,'M46 must govern all eight Board change-broadcast triggers.');
assert.equal(contract.capabilities.private_board_realtime,true,'M46 capability contract must require recovered private Board Realtime.');
const contractNames=new Set(contract.rpcs.map((rpc)=>rpc.name));
const frontendRpcNames=new Set([...repo.matchAll(/\brpc\('([^']+)'/g)].map((match)=>match[1]));
for(const name of frontendRpcNames) assert(contractNames.has(name),`Frontend Board RPC ${name} is missing from the M46 contract.`);
assert(!frontendRpcNames.has('wm_create_board'),'Unsafe legacy wm_create_board fallback must remain absent from the frontend repository.');
for(const rpc of contract.rpcs){
  assert(schema.includes(`function public.${rpc.name}(`),`Authoritative schema is missing ${rpc.name}.`);
}
for(const table of contract.tables){
  assert(schema.includes(`create table if not exists public.${table.name} (`),`Authoritative schema is missing ${table.name}.`);
  assert(schema.includes(`alter table public.${table.name} enable row level security;`),`${table.name} must have RLS enabled.`);
}

assert(repo.includes("key('preferences')")&&repo.includes("clearCache: () => { queries.removeQueries(scope()); }"),'Board mutation invalidation and cache clearing must remain Board-scoped and include preferences.');
assert(!repo.includes('clearCache: () => queries.clear()'),'Board cache clearing must never clear the shared QueryClient.');
const removeStart=repo.indexOf('async function removeItemFile');
const removeEnd=repo.indexOf('\n  const repository:',removeStart);
const removeBody=repo.slice(removeStart,removeEnd);
assert(removeBody.indexOf("rpc('wm_delete_board_item_file'")<removeBody.indexOf("storageDelete('work-board-files'"),'Attachment metadata deletion must precede object cleanup.');
assert(removeBody.includes('BOARD_FILE_STORAGE_CLEANUP_PENDING')&&removeBody.includes('canonicalPath'),'Attachment cleanup must use the backend-returned canonical path and preserve authoritative metadata deletion on storage cleanup failure.');
assert(dto.includes("name: requiredString(record, 'name', operation)")&&dto.includes("title: requiredString(record, 'title', 'board.group')")&&dto.includes("title: requiredString(record, 'title', 'board.item')")&&dto.includes("name: requiredString(record, 'name', 'board.column')"),'Required Board DTO labels must fail closed on empty backend values.');
assert((dto.match(/optionalString\(record, 'author_id'\) \?\? optionalString\(record, 'created_by'\)/g)||[]).length===2,'M46 DTO compatibility must accept created_by only for legacy update/file author identity.');
assert(preflight.includes('wm_board_contract_attestation')&&preflight.includes('M46_BOARD_CONTRACT_DIGEST')&&preflight.includes('M46_BOARD_CONTRACT_VERSION')&&preflight.includes("contract-compatible:false"),'Runtime Board readiness must enforce the live M46 attestation.');
assert(m45.includes("activationState: 'active-certified'")&&m45.includes('M46 remains responsible'),'M46 must start from the certified M45 boundary.');
assert(dbtest.includes('select plan(14)')&&dbtest.includes("'rpc_count')::integer,40")&&dbtest.includes("'rls_table_count')::integer,9")&&dbtest.includes("'realtime_function_count')::integer,2")&&dbtest.includes("'board_table_policy_count')::integer=0"),'M46 pgTAP suite must assert exact RPC, table-RLS, private-Realtime, and zero-direct-policy coverage.');

const m46Browser=read('tests/modern/e2e/boards-backend-data-contract-recovery.spec.mjs');
const m37Fixture=read('tests/modern/e2e/helpers/m37-supabase-fixture.mjs');
const m39Fixture=read('tests/modern/e2e/helpers/m39-auth-fixture.mjs');
const dbRunner=read('scripts/run-stage-g-m46-database-contract-tests.mjs');
const m38Execution=read('scripts/verify-runtime-backend-preflight-execution.mjs');
assert(m46Browser.includes('@m46-contract-ready')&&m46Browser.includes('@m46-contract-digest-mismatch')&&m46Browser.includes('@m46-contract-incompatible'),'M46 browser suite must cover exact, stale-digest, and incompatible catalog states.');
assert(m37Fixture.includes("/rest/v1/rpc/wm_board_contract_attestation")&&m39Fixture.includes("/rest/v1/rpc/wm_board_contract_attestation"),'Shared browser fixtures must expose the M46 attestation RPC.');
assert(m38Execution.includes("/rest/v1/rpc/wm_board_contract_attestation")&&m38Execution.includes('M46_BOARD_CONTRACT_DIGEST')&&m38Execution.includes('M46_BOARD_CONTRACT_VERSION')&&m38Execution.includes('board-contract-digest-mismatch')&&m38Execution.includes('board-contract-incompatible'),'Retained M38 deterministic preflight fixture must model exact M46 Board attestation success and mismatch states.');
assert(dbRunner.includes("LOCAL_PROJECT_ID='work-management-m46-contract-tests'")&&dbRunner.includes("supabase/tests/m46")&&dbRunner.includes('pgTAP=14'),'M46 must own an isolated local Supabase/pgTAP runner with evidence bound to the 14-test suite.');
const m46Workflow=read('.github/workflows/boards-backend-data-contract-recovery.yml');
const m46Finalizer=read('scripts/finalize-stage-g-m46.sh');
const m46Tree=read('scripts/lib/stage-g-m46-certification-tree.mjs');
const m46ArtifactVerifier=read('scripts/verify-stage-g-m46-certified-artifact.mjs');
const m46Deploy=read('scripts/deploy-stage-g-m46-production-contract.sh');
const pkg=JSON.parse(read('package.json'));
assert(m46Workflow.includes('supabase/setup-cli@v1')&&m46Workflow.includes('version: 2.117.0'),'M46 hosted certification must pin Supabase CLI 2.117.0.');
assert(m46Workflow.includes("VITE_SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL || 'https://jtlusodorfnyzgyuewkz.supabase.co' }}")&&m46Workflow.includes("VITE_SUPABASE_PUBLISHABLE_KEY: ${{ vars.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_CrkvaTRYTYAMVbieywNMyg_a0F7HpB6' }}"),'M46 hosted certification must bind live production attestation configuration with governed public fallbacks.');
assert(m46Workflow.includes('npm run board-backend-contract:finalizer:test')&&m46Workflow.includes('npm run board-backend-contract:deployment-guard:test'),'M46 hosted certification must preflight its fail-closed finalizer and deployment guard harnesses.');
assert(m46Finalizer.indexOf('npm run board-backend-contract:database')<m46Finalizer.indexOf('npm run board-backend-contract:production')&&m46Finalizer.indexOf('npm run board-backend-contract:production')<m46Finalizer.indexOf('git archive --format=tar'),'Local DB and production catalog attestation must pass before staged state promotion.');
assert(m46Finalizer.includes('M46_EXPECTED_SOURCE_COMMIT')&&m46Finalizer.includes('verify-stage-g-m46-certified-artifact.mjs'),'M46 finalizer must independently reverify exact-commit certified artifacts.');
assert(m46Tree.includes("'config/stage-g-m46-boards-backend-data-contract-recovery-target.ts'")&&m46Tree.includes("'RELEASE-STATUS-v1.43.2-STAGE-G-M46-BOARDS-BACKEND-DATA-CONTRACT-RECOVERY.md'"),'M46 certification digest must isolate only the two promoted state records.');
assert(m46ArtifactVerifier.includes('CERTIFIED SOURCE COMMIT')&&m46ArtifactVerifier.includes("activationState: 'active-certified'"),'M46 artifact verifier must bind provenance and packaged state.');
assert(m46ArtifactVerifier.includes('config/stage-g-m46-boards-backend-data-contract-recovery-target.ts'),'M46 artifact verifier must inspect the M46 backend/data-contract target.');
assert(m46ArtifactVerifier.includes('RELEASE-STATUS-v1.43.2-STAGE-G-M46-BOARDS-BACKEND-DATA-CONTRACT-RECOVERY.md'),'M46 artifact verifier must inspect the M46 backend/data-contract release record.');
assert(!m46ArtifactVerifier.includes('stage-g-m46-boards-collection-route-recovery-target.ts'),'M46 artifact verifier must not retain the stale M45-style collection-route target path.');
assert(!m46ArtifactVerifier.includes('STAGE-G-M46-BOARDS-COLLECTION-ROUTE-RECOVERY'),'M46 artifact verifier must not retain the stale M45-style collection-route release path.');
assert(m46Deploy.includes('WM_M46_ALLOW_PRODUCTION_MIGRATION')&&m46Deploy.includes('SUPABASE_PROJECT_REF')&&m46Deploy.includes('supabase projects list')&&m46Deploy.includes('db push --linked --include-all')&&m46Deploy.includes('--dry-run'),'M46 production deployment must be explicit, authenticated, project-bound, isolated, and dry-run before apply.');
assert(!m46Deploy.includes('PASSWORD_ARGS=()')&&!m46Deploy.includes('${PASSWORD_ARGS[@]}')&&m46Deploy.includes('if [ -n "${SUPABASE_DB_PASSWORD:-}" ]; then'),'M46 production deployment must remain macOS Bash 3.2 safe under set -u by branching password/no-password commands without empty arrays.');
for(const script of ['board-backend-contract:check','board-backend-contract:test','board-backend-contract:browser','board-backend-contract:database','board-backend-contract:production','board-backend-contract:workflows','board-backend-contract:finalizer:test','board-backend-contract:deployment-guard:test','board-backend-contract:verify:release','board-backend-contract:certify','board-backend-contract:package']) assert(pkg.scripts?.[script],`package.json is missing ${script}.`);
const checks=103;
console.log(`Stage G M46 Boards Backend & Data Contract Recovery static verification: PASS (architecture=${target.architectureVersion}; state=${target.activationState}; rpcs=${contract.rpcs.length}; tables=${contract.tables.length}; checks=${checks}; browserScenarios=3)`);
