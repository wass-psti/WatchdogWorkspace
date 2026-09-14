import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname);
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const activationState=(file)=>read(file).match(/activationState:\s*'([^']+)'/)?.[1]??'unknown';

const state=activationState('config/stage-f-m27-realtime-platform-target.ts');
const m26=activationState('config/stage-e-m26-iframe-retirement-target.ts');
const target=read('config/stage-f-m27-realtime-platform-target.ts');
const manifest=read('config/application-manifest.ts');
const manifestTypes=read('src/types/manifest.ts');
const manifestSchema=read('src/runtime-schemas/manifest.ts');
const platformContract=read('src/platform/contracts/realtime-platform.ts');
const platformRuntime=read('assets/js/platform/realtime/realtime-platform.ts');
const composition=read('src/platform/contracts/composition.ts');
const platformServices=read('assets/js/runtime/platform-services.ts');
const boardService=read('assets/js/features/boards/services/board-realtime-service.ts');
const boardMigration=read('supabase/migrations/v1.43.2-stage-d-m20-board-collaborative-realtime.sql');
const pkg=JSON.parse(read('package.json'));
const ci=read('.github/workflows/ci.yml');
const deploy=read('.github/workflows/deploy-pages.yml');
const project=read('verify-project.sh');
const docs=read('docs/WORK-MANAGEMENT-REALTIME-PLATFORM-ARCHITECTURE.md');
const architecture=read('docs/architecture/ARCHITECTURE.md');
const arch=Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1]??0);

assert(m26==='active-certified',`M27 requires M26 active-certified; found ${m26}.`);
assert(['implementation-complete-pending-certification','active-pending-release-certification','active-certified'].includes(state),`Invalid M27 state ${state}.`);
assert(arch>=35,`M27 requires Architecture 35+; found ${arch}.`);
for(const marker of [
  "realtimePlatform: 'authenticated-private-channel-platform-v1'",
  "realtimePlatformContract: 'src/platform/contracts/realtime-platform.ts'",
  "realtimePlatformRuntime: 'assets/js/platform/realtime/realtime-platform.ts'",
  "realtimeTransport: 'assets/js/platform/data/supabase-realtime-client.ts'",
  "realtimeTokenLifecycle: 'platform-shared-refresh-v1'",
]) assert(manifest.includes(marker),`Application manifest missing M27 authority: ${marker}`);
assert(manifestTypes.includes("realtimePlatform?: 'authenticated-private-channel-platform-v1'")&&manifestTypes.includes("realtimeTokenLifecycle?: 'platform-shared-refresh-v1'"),'Manifest types must expose the Architecture 35 realtime platform authority.');
assert(manifestSchema.includes("realtimePlatform: z.literal('authenticated-private-channel-platform-v1').optional()")&&manifestSchema.includes('Architecture v35+ requires the authenticated private-channel realtime platform authority and shared token lifecycle.'),'Runtime manifest schema must enforce Architecture 35 realtime authority.');

for(const marker of [
  "export type RealtimeTopicNamespace = 'board' | 'module' | 'platform'",
  'export interface RealtimePlatformSnapshot',
  'export interface RealtimePlatformSubscription',
  'export interface RealtimePlatform',
  'readonly maxChannels?: number',
]) assert(platformContract.includes(marker),`Realtime platform contract missing ${marker}.`);
for(const marker of [
  'resolveRealtimeTopic',
  'BOARD_UUID',
  "enabledNamespaces ?? ['board']",
  'MAX_CHANNELS = 24',
  'channels.size >= maxChannels',
  'record.subscribers.size > 0',
  'refreshAccessToken',
  'startTokenTimer',
  'stopTokenTimer',
  'createSupabaseRealtimeClient(auth.supabase.project)',
  'channels.delete(record.resolved.topic)',
  'WM_REALTIME_TOKEN_REFRESH_FAILED',
]) assert(platformRuntime.includes(marker),`Realtime platform runtime missing ${marker}.`);
assert(!platformRuntime.includes('service_role')&&!platformRuntime.includes('SUPABASE_SERVICE_ROLE'),'Realtime platform must never contain server credentials.');

assert(composition.includes('readonly realtime: RealtimePlatform'),'Platform service contract must expose the realtime platform authority.');
assert(platformServices.includes('createRealtimePlatform({auth,diagnostics,enabledNamespaces:[\'board\']})'),'Platform composition must create one shared realtime platform.');
assert(platformServices.includes('createBoardRealtimeService(auth,{realtime})'),'Board realtime must consume the platform realtime authority.');
assert(boardService.includes("topic: Object.freeze({ namespace: 'board', key: boardId })"),'Board adapter must request Board topics through the typed platform topic descriptor.');
assert(!boardService.includes("from '../../../platform/data/supabase-realtime-client.ts'"),'Board feature must not own the Supabase realtime transport after M27.');
assert(!boardService.includes('const tokenTimer'),'Board feature must not own an access-token refresh timer after M27.');

assert(boardMigration.includes("'board-change'")&&boardMigration.includes('realtime.send')&&boardMigration.includes('wm_board_realtime_receive'),'M27 must preserve the certified M20 Board server authority.');
assert(target.includes("activeNamespaces: Object.freeze(['board'] as const)")&&target.includes("reservedNamespaces: Object.freeze(['module', 'platform'] as const)"),'M27 must keep unauthorized future namespaces reserved and disabled.');
assert(target.includes('supabaseMigrationRequired: false'),'M27 architecture must not claim a new database migration.');
for(const moduleId of ['time-tracker','fueltrack-plus','tradelink']) assert(target.includes(`moduleId: '${moduleId}'`),`M27 compatibility boundary missing ${moduleId}.`);

for(const script of ['realtime-platform:check','realtime-platform:status','realtime-platform:activate','realtime-platform:activate:release','stage-f:certify']) assert(typeof pkg.scripts?.[script]==='string',`package.json missing ${script}.`);
assert(pkg.scripts['check'].includes('realtime-platform:check'),'General check gate must include M27 realtime platform verification.');
assert(pkg.scripts['release:check'].includes('realtime-platform:check'),'Production release gate must include M27 realtime platform verification.');
assert(ci.includes('Stage F M27 Realtime platform architecture')&&ci.includes('npm run realtime-platform:check'),'CI must execute the M27 gate explicitly.');
assert(deploy.includes('Stage F M27 Realtime platform architecture')&&deploy.includes('npm run realtime-platform:check'),'Deploy workflow must execute the M27 gate explicitly.');
for(const required of ['src/platform/contracts/realtime-platform.ts','assets/js/platform/realtime/realtime-platform.ts','config/stage-f-m27-realtime-platform-target.ts','scripts/verify-realtime-platform-execution.mjs']) assert(project.includes(required),`verify-project.sh missing M27 artifact ${required}.`);
assert(docs.includes('Private authenticated channels only.')&&docs.includes('Only the `board` namespace is production-enabled in M27'),'M27 architecture documentation must define security and namespace boundaries.');
assert(architecture.includes('Architecture 35')&&architecture.includes('Realtime platform'),'Architecture documentation must record the M27 authority.');

const execution=spawnSync(process.execPath,['--experimental-strip-types','--disable-warning=ExperimentalWarning','scripts/verify-realtime-platform-execution.mjs'],{cwd:root,encoding:'utf8'});
if(execution.status!==0)throw new Error(`M27 execution verification failed:\n${execution.stdout}\n${execution.stderr}`);
process.stdout.write(execution.stdout);
console.log(`Stage F Milestone 27 realtime platform architecture verification: PASS (state=${state}; architecture=${arch}; activeNamespaces=board; reserved=module,platform)`);
