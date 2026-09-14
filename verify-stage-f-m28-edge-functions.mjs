import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname);
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const activationState=(file)=>read(file).match(/activationState:\s*'([^']+)'/)?.[1]??'unknown';

const state=activationState('config/stage-f-m28-edge-functions-target.ts');
const m27=activationState('config/stage-f-m27-realtime-platform-target.ts');
const target=read('config/stage-f-m28-edge-functions-target.ts');
const manifest=read('config/application-manifest.ts');
const manifestTypes=read('src/types/manifest.ts');
const manifestSchema=read('src/runtime-schemas/manifest.ts');
const contract=read('src/platform/contracts/edge-functions.ts');
const client=read('assets/js/platform/data/edge-function-client.ts');
const composition=read('src/platform/contracts/composition.ts');
const platformServices=read('assets/js/runtime/platform-services.ts');
const functionConfig=read('supabase/config.toml');
const functionEnvExample=read('supabase/functions/.env.example');
const functionIndex=read('supabase/functions/admin-sync-auth-access/index.ts');
const functionHandler=read('supabase/functions/admin-sync-auth-access/handler.ts');
const sharedHttp=read('supabase/functions/_shared/http.ts');
const pkg=JSON.parse(read('package.json'));
const ci=read('.github/workflows/ci.yml');
const deploy=read('.github/workflows/deploy-pages.yml');
const project=read('verify-project.sh');
const docs=read('docs/WORK-MANAGEMENT-EDGE-FUNCTIONS.md');
const security=read('docs/SECURITY-BASELINE.md');
const architecture=read('docs/architecture/ARCHITECTURE.md');
const provenance=read('M28-SUPABASE-EDGE-FUNCTIONS-PROVENANCE.md');
const arch=Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1]??0);

assert(m27==='active-certified',`M28 requires M27 active-certified; found ${m27}.`);
assert(['implementation-complete-pending-certification','active-pending-release-certification','active-certified'].includes(state),`Invalid M28 state ${state}.`);
assert(arch>=36,`M28 requires Architecture 36+; found ${arch}.`);
for(const marker of [
  "edgeFunctions: 'authenticated-governed-edge-functions-v1'",
  "edgeFunctionClient: 'assets/js/platform/data/edge-function-client.ts'",
  "edgeFunctionRoot: 'supabase/functions'",
  "edgeFunctionAuthorization: 'jwt-plus-live-admin-policy-v1'",
  "edgeFunctionSecrets: 'server-only-environment-v1'",
]) assert(manifest.includes(marker),`Application manifest missing M28 authority: ${marker}`);
assert(manifestTypes.includes("edgeFunctions?: 'authenticated-governed-edge-functions-v1'")&&manifestTypes.includes("edgeFunctionSecrets?: 'server-only-environment-v1'"),'Manifest types must expose the Architecture 36 Edge Function authority.');
assert(manifestSchema.includes("edgeFunctions: z.literal('authenticated-governed-edge-functions-v1').optional()")&&manifestSchema.includes('Architecture v36+ requires the governed authenticated Edge Function authority'),'Runtime manifest schema must enforce Architecture 36 Edge Function authority.');

for(const marker of [
  "export type EdgeFunctionName = 'admin-sync-auth-access'",
  'export interface EdgeFunctionClient',
  'AdminSyncAuthAccessRequest',
  'AdminSyncAuthAccessResponse',
]) assert(contract.includes(marker),`Edge Function contract missing ${marker}.`);
for(const marker of [
  "ALLOWED_FUNCTIONS = Object.freeze(['admin-sync-auth-access']",
  'WM_EDGE_FUNCTION_NOT_ALLOWED',
  '/functions/v1/',
  'auth.ensureAccessToken()',
  "'x-wm-request-id'",
  'DEFAULT_TIMEOUT_MS = 20_000',
]) assert(client.includes(marker),`Edge Function client missing ${marker}.`);
assert(!client.includes('service_role')&&!client.includes('SUPABASE_SECRET')&&!client.includes('sb_secret_'),'Browser Edge Function client must not contain server credentials.');
assert(!/\bas\s+unknown\s+as\b/.test(client),'M28 Edge Function client must not reintroduce a TypeScript double assertion.');
assert(client.includes('function isAdminSyncAuthAccessResponse(value: unknown): value is EdgeFunctionResponseMap'), 'M28 response validation must narrow unknown payloads with a runtime type guard.');
const browserRoots=['assets/js','src','config/backend-config.js','config/backend-config.example.js'];
const browserSecretMarkers=['WM_SUPABASE_SECRET_KEY','SUPABASE_SECRET_KEYS','SUPABASE_SERVICE_ROLE_KEY'];
const browserFiles=[];
const collect=(entry)=>{const absolute=path.join(root,entry);const stat=fs.statSync(absolute);if(stat.isDirectory()){for(const child of fs.readdirSync(absolute))collect(path.join(entry,child));}else browserFiles.push(entry);};
for(const entry of browserRoots)collect(entry);
for(const file of browserFiles){const source=read(file);for(const marker of browserSecretMarkers)assert(!source.includes(marker),`Browser-shipped source ${file} contains forbidden server-secret marker ${marker}.`);}
assert(composition.includes('readonly edgeFunctions: EdgeFunctionClient'),'Platform service contract must expose the Edge Function authority.');
assert(/createEdgeFunctionClient\(auth,\s*diagnostics(?:,\s*observability)?\)/.test(platformServices),'Platform composition must create one shared Edge Function client, optionally with later observability instrumentation.');
assert(/edgeFunctions,\s*(?:diagnostics|observability)/.test(platformServices),'PlatformServices return value must expose edgeFunctions.');

assert(functionConfig.includes('[functions.admin-sync-auth-access]')&&functionConfig.includes('verify_jwt = true'),'Supabase function configuration must require gateway JWT verification.');
assert(functionEnvExample.includes('WM_SUPABASE_SECRET_KEY=<server-only-secret-key>')&&functionEnvExample.includes('WM_EDGE_ALLOWED_ORIGINS='),'M28 must provide a server-only function environment template without real credentials.');
for(const marker of [
  "Deno.env.get('WM_SUPABASE_SECRET_KEY')",
  "Deno.env.get('WM_EDGE_ALLOWED_ORIGINS')",
  'Deno.serve(createAdminSyncAuthAccessHandler',
]) assert(functionIndex.includes(marker),`Edge Function entrypoint missing ${marker}.`);
for(const marker of [
  "profile?.platform_role !== 'admin_general_manager'",
  "profile?.status !== 'active'",
  '/auth/v1/admin/users/',
  "ban_duration: status === 'disabled' ? BAN_DURATION : 'none'",
  "code: 'WM_EDGE_ORIGIN_DENIED'",
  "code: 'WM_EDGE_ADMIN_REQUIRED'",
]) assert(functionHandler.includes(marker),`Edge Function handler missing ${marker}.`);
assert(sharedHttp.includes("'Cache-Control': 'no-store'")&&sharedHttp.includes("'X-Content-Type-Options': 'nosniff'")&&sharedHttp.includes('Access-Control-Allow-Origin'),'Shared Edge HTTP policy must enforce no-store, nosniff, and exact-origin CORS behavior.');

assert(target.includes('externalDeploymentRequired: true')&&target.includes('automaticUserManagementCutover: false'),'M28 must explicitly record its deployment/cutover boundary.');
assert(target.includes('browserSecretsAllowed: false')&&target.includes('arbitraryFunctionInvocationAllowed: false'),'M28 security target must forbid browser secrets and arbitrary function invocation.');
assert(target.includes("id: 'user-management-rpc'")&&target.includes("id: 'auth-access-jwt-window'")&&target.includes("id: 'module-edge-functions'"),'M28 compatibility boundaries are incomplete.');
assert(target.includes('migrationRequired: false')&&target.includes('schemaChangeRequired: false'),'M28 must not claim an unnecessary database change.');

for(const script of ['edge-functions:check','edge-functions:status','edge-functions:activate','edge-functions:activate:release','stage-f:certify']) assert(typeof pkg.scripts?.[script]==='string',`package.json missing ${script}.`);
assert(pkg.scripts.check.includes('edge-functions:check'),'General check gate must include M28 Edge Function verification.');
assert(pkg.scripts['release:check'].includes('edge-functions:check'),'Production release gate must include M28 Edge Function verification.');
assert(ci.includes('Stage F M28 Edge Functions')&&ci.includes('npm run edge-functions:check'),'CI must execute the M28 gate explicitly.');
assert(deploy.includes('Stage F M28 Edge Functions')&&deploy.includes('npm run edge-functions:check'),'Deploy workflow must execute the M28 gate explicitly.');
for(const required of ['src/platform/contracts/edge-functions.ts','assets/js/platform/data/edge-function-client.ts','config/stage-f-m28-edge-functions-target.ts','supabase/functions/admin-sync-auth-access/index.ts','scripts/verify-edge-functions-execution.mjs']) assert(project.includes(required),`verify-project.sh missing M28 artifact ${required}.`);
assert(docs.includes('trusted server-execution boundary')&&docs.includes('already-issued access token remains cryptographically valid until its expiry'),'M28 documentation must define the trusted-server and JWT-window boundaries.');
assert(security.includes('trusted server/Edge Function'),'M28 must remain aligned with the established security baseline.');
assert(architecture.includes('Architecture 36')&&architecture.includes('Edge Functions'),'Architecture documentation must record the M28 authority.');
assert(provenance.includes('modern `sb_secret_*` credentials are opaque API keys')&&provenance.includes('Auth access JWTs are stateless'),'M28 must preserve current Supabase key/JWT provenance.');

const execution=spawnSync(process.execPath,['--experimental-strip-types','--disable-warning=ExperimentalWarning','scripts/verify-edge-functions-execution.mjs'],{cwd:root,encoding:'utf8'});
if(execution.status!==0)throw new Error(`M28 execution verification failed:\n${execution.stdout}\n${execution.stderr}`);
process.stdout.write(execution.stdout);
console.log(`Stage F Milestone 28 Edge Functions verification: PASS (state=${state}; architecture=${arch}; functions=admin-sync-auth-access; cutover=deferred-until-deploy)`);
