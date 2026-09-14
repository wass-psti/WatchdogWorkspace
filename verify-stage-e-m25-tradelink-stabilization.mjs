import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const activationState = (file) => read(file).match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';

const target = read('config/stage-e-m25-tradelink-stabilization-target.ts');
const state = activationState('config/stage-e-m25-tradelink-stabilization-target.ts');
const m24 = activationState('config/stage-e-m24-fueltrack-stabilization-target.ts');
const manifest = read('config/application-manifest.ts');
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const types = read('src/types/manifest.ts');
const schema = read('src/runtime-schemas/manifest.ts');
const runtimeHtml = read('apps/tradelink/runtime.html');
const app = read('apps/tradelink/app.v1.42.0-wm1.js');
const stability = read('apps/tradelink/stability-runtime.js');
const pkg = JSON.parse(read('package.json'));
const ci = read('.github/workflows/ci.yml');
const deploy = read('.github/workflows/deploy-pages.yml');
const project = read('verify-project.sh');
const distVerifier = read('scripts/verify-dist.mjs');
const stageECertifier = read('scripts/certify-stage-e-platform.mjs');
const architecture = read('docs/architecture/ARCHITECTURE.md');

assert(m24 === 'active-certified', `M25 requires M24 active-certified; found ${m24}.`);
assert(['implementation-complete-pending-certification','active-pending-release-certification','active-certified'].includes(state), `Invalid M25 state ${state}.`);
assert(architectureVersion >= 33, `M25 requires Architecture 33+; found ${architectureVersion}.`);

for (const marker of [
  "tradeLinkStabilization: 'embedded-tradelink-stability-v1'",
  "tradeLinkStabilityRuntime: 'apps/tradelink/stability-runtime.js'",
  "tradeLinkRuntime: 'apps/tradelink/app.v1.42.0-wm1.js'",
]) assert(manifest.includes(marker), `Manifest missing M25 authority: ${marker}`);
assert(types.includes("tradeLinkStabilization?: 'embedded-tradelink-stability-v1'") && types.includes('tradeLinkStabilityRuntime?: string') && types.includes('tradeLinkRuntime?: string'), 'Manifest types must expose M25 TradeLink authorities.');
assert(schema.includes("tradeLinkStabilization: z.literal('embedded-tradelink-stability-v1').optional()") && schema.includes('Architecture v33+ requires the certified TradeLink stabilization runtime'), 'Runtime manifest schema must require M25 authorities for Architecture 33+.');

const domainIndex = runtimeHtml.indexOf('<script src="./domain-config.js"></script>');
const stabilityIndex = runtimeHtml.indexOf('<script src="./stability-runtime.js"></script>');
const bootstrapIndex = runtimeHtml.indexOf("import { startEmbeddedModule }");
assert(domainIndex >= 0 && stabilityIndex > domainIndex && bootstrapIndex > stabilityIndex, 'TradeLink stability runtime must load after domain config and before authenticated module bootstrap.');
assert(runtimeHtml.includes("entry: './app.v1.42.0-wm1.js'"), 'TradeLink wm1 production runtime must remain authoritative.');

for (const marker of [
  'createMutationGate', 'createSerialTaskQueue', 'confirmedSet', 'confirmedRemove', 'refreshStore',
  'withWorkspaceLock', "locks.acquire(`tradelink:${lockKey}`", 'createStoreChangeBridge',
  "window.addEventListener('storage'", "window.addEventListener('wm:module-store-change'", "window.addEventListener('pageshow'",
  'WM_TRADELINK_COMMIT_DIVERGED', 'WM_TRADELINK_WORKSPACE_BUSY',
]) assert(stability.includes(marker), `TradeLink stability runtime missing ${marker}.`);

for (const marker of [
  'globalThis.WMTradeLinkStability', 'sharedMutationGate', 'persistSharedConfirmed', 'refreshAuthoritativeTradeLinkState',
  'canonicalSharedState', 'selectedVendorId=DEFAULT_VENDORS', 'copy.settings={...copy.settings,pageSize:20}',
  "ui.selectedVendorId=next.id", 'ui.pageSize=state.settings.pageSize',
  'WM_TRADELINK_STALE_DOCUMENT', 'ui.editBaseUpdatedAt',
  'await refreshAuthoritativeTradeLinkState()', 'form.documentNumber=nextNumber(form.documentType)',
  "sharedMutationGate.run(`workflow:${id}`", "sharedMutationGate.run(`delete:${id}`", "sharedMutationGate.run(`comment:${id}`",
  "sharedMutationGate.run('bulk-delete'", "sharedMutationGate.run('import'", "sharedMutationGate.run('reset'",
  'setVendorAssetConfirmed', 'deleteVendorAssetConfirmed', 'restoreVendorAssetsConfirmed',
  'recordAuditConfirmed', 'recordAuditBestEffort', 'auditWriteQueue', 'ensureTradeLinkInitializationAudit', 'ensureConfirmedStartupRecovery',
  'tradeLinkStoreChangeBridge', "if(!event.persisted)tradeLinkStoreChangeBridge.dispose()",
]) assert(app.includes(marker), `TradeLink production runtime missing M25 marker: ${marker}`);

const saveBlock = app.slice(app.indexOf("async function saveForm"), app.indexOf('async function captureApprovalStep'));
assert(saveBlock.indexOf('await refreshAuthoritativeTradeLinkState()') < saveBlock.indexOf('form.documentNumber=nextNumber(form.documentType)'), 'Document numbering must occur only after authoritative refresh under the workspace lock.');
assert(saveBlock.includes("String(existing.updatedAt||'')!==String(ui.editBaseUpdatedAt)"), 'Existing document save must reject stale updatedAt revisions.');
assert(saveBlock.includes("await persistSharedConfirmed('document save',false)"), 'Document save must await confirmed shared persistence.');
assert(!app.includes("persist('active company changed',false)"), 'Active company selection must not persist through the shared business blob.');
assert(!app.includes("persist('document page size',false)"), 'Document page size must not persist through the shared business blob.');
assert(!app.includes('function persist(') && !/\bpersist\(\s*['"]/m.test(app), 'Legacy fire-and-forget whole-workspace persist authority must be removed from the active TradeLink runtime.');
const sharedCommitBlock = app.slice(app.indexOf('async function persistSharedConfirmed'), app.indexOf('async function recordAuditConfirmed'));
assert(sharedCommitBlock.includes('void persistUiConfirmed().catch') && !sharedCommitBlock.includes('await persistUiConfirmed()'), 'A confirmed shared business commit must not fail only because the separate user-UI write fails.');
const restoreSnapshotBlock = app.slice(app.indexOf('async function restoreSnapshot'), app.indexOf('function addAudit'));
assert(restoreSnapshotBlock.includes('previousAssets=collectVendorAssets()') && restoreSnapshotBlock.includes('restoreVendorAssetsConfirmed(previousAssets,{clear:true})'), 'Snapshot restore must roll vendor assets back if the shared business commit fails.');
for (const marker of ["recordAuditBestEffort('export','Activity exported'", "recordAuditBestEffort('export','Selected documents exported'", "recordAuditBestEffort('export','Document exported to Excel'", "recordAuditBestEffort('export','PDF generated'", "recordAuditBestEffort('export','Backup exported'"]) assert(app.includes(marker), `Export audit path missing confirmed M25 boundary: ${marker}`);
assert(app.includes("sharedMutationGate.run('initialization'") && app.includes("await persistSharedConfirmed('initialization',false)"), 'TradeLink initialization audit must use the confirmed shared-write boundary.');
assert(app.includes("sharedMutationGate.run('startup-recovery'") && app.includes('startupRecoveredFromBackup') && app.includes("await TRADELINK_STABILITY.confirmedSet(STORAGE_KEY"), 'Backup-to-primary startup recovery must use the distributed confirmed-write boundary.');
assert(app.includes("persistSharedConfirmed('embedded vendor asset migration',false)") && !app.includes('function migrateEmbeddedVendorAssets(') && !app.includes('function setVendorAsset('), 'Embedded vendor asset migration must use confirmed asset/shared-state writes rather than synchronous legacy mutation helpers.');
assert(!app.includes('WMModuleStore.setItem(STORAGE_KEY'), 'TradeLink production runtime must not synchronously write the shared workspace key.');
const directStoreWrites = [...app.matchAll(/WMModuleStore\.(?:setItem|removeItem)\(/g)];
assert(directStoreWrites.length === 1 && app.includes("window.addEventListener('beforeunload',()=>{if(state.settings.autosave&&ui.form)try{globalThis.WMModuleStore.setItem(AUTOSAVE_KEY"), 'Only the user-scoped beforeunload draft fallback may use a direct module-store write in the active TradeLink runtime.');

for (const key of ['tradelink-stabilization:check','tradelink-stabilization:status','tradelink-stabilization:activate','tradelink-stabilization:activate:release']) assert(pkg.scripts[key], `Package scripts missing ${key}.`);
assert(pkg.scripts.check.includes('tradelink-stabilization:check') && pkg.scripts['release:check'].includes('tradelink-stabilization:check'), 'Aggregate package gates must include M25.');
assert(ci.includes('Stage E M25 TradeLink stabilization') && ci.includes('npm run tradelink-stabilization:check'), 'CI must enforce M25.');
assert(deploy.includes('Stage E M25 TradeLink stabilization') && deploy.includes('npm run tradelink-stabilization:check'), 'Pages deployment must enforce M25.');
assert(project.includes('verify-stage-e-m25-tradelink-stabilization.mjs') && project.includes('scripts/verify-tradelink-stabilization-execution.mjs') && project.includes('apps/tradelink/stability-runtime.js'), 'Aggregate verifier must require M25 artifacts.');
assert(distVerifier.includes("'apps/tradelink/stability-runtime.js'"), 'Production dist verifier must require the TradeLink stability runtime.');
assert(stageECertifier.includes('tradelink-stabilization:activate:release') && stageECertifier.includes('M25 TradeLink stabilization: active-certified'), 'Stage E certifier must activate and report M25.');
assert(architecture.includes('## Stage E M25 — TradeLink stabilization'), 'Architecture documentation must record M25.');
assert(!fs.existsSync(path.join(root, 'supabase/migrations/v1.43.2-stage-e-m25-tradelink-stabilization.sql')), 'M25 must not introduce a Supabase migration.');
assert(target.includes('newExternalDependency: null') && target.includes('supabaseMigrationRequired: false'), 'M25 target must declare no dependency and no migration.');
for (const marker of ['snapshotVendorAssetRollbackOnCommitFailure: true','sharedCommitIndependentOfUserUiWrite: true','exportAuditConfirmedWithoutSharedSnapshotOverwrite: true','initializationAuditConfirmed: true','startupBackupRecoveryConfirmed: true','embeddedVendorAssetMigrationConfirmed: true','beforeUnloadDraftFallbackRetained: true','legacyFireAndForgetSharedPersistRemoved: true']) assert(target.includes(marker), `M25 target missing final hardening authority: ${marker}`);

const historicalSources = fs.readdirSync(root).filter((name) => /^verify-.*\.mjs$/.test(name));
for (const name of historicalSources) {
  if (name === 'verify-stage-e-m25-tradelink-stabilization.mjs') continue;
  const source = read(name);
  assert(!/architectureVersion\s*===\s*32/.test(source), `${name} contains an obsolete exact Architecture 32 assertion.`);
}

const execution = spawnSync(process.execPath, ['scripts/verify-tradelink-stabilization-execution.mjs'], { cwd: root, encoding: 'utf8' });
if (execution.stdout) process.stdout.write(execution.stdout);
if (execution.stderr) process.stderr.write(execution.stderr);
assert(execution.status === 0, 'M25 execution vectors failed.');

console.log(`Stage E Milestone 25 TradeLink stabilization verification: PASS (state=${state}; architecture=${architectureVersion})`);
