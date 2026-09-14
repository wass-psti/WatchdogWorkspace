import { M38_BACKEND_CAPABILITY_SCHEMA,M38_MODULE_REQUIREMENTS,type M38CapabilityModule } from '../../../../config/backend-capability-manifest.ts';
import type { BackendCapabilitySnapshot,BackendModuleCapabilityStatus } from '../../../../src/platform/contracts/backend-capability-preflight.ts';
import type { BackendConfigurationSource,WorkManagementRuntimeEnvironment } from '../../../../config/vite-runtime-config.ts';
import { createSupabaseClientAdapter, SupabaseClientAdapterError } from './supabase-client-adapter.ts';

type AuthPort={readonly isAuthenticated:boolean;ensureAccessToken():Promise<string|null>};
type UnknownRecord=Readonly<Record<string,unknown>>;
const moduleNames=Object.freeze(Object.keys(M38_MODULE_REQUIREMENTS) as M38CapabilityModule[]);
const emptyMissing=()=>Object.freeze({tables:Object.freeze([] as string[]),rpcs:Object.freeze([] as string[]),storage:Object.freeze([] as string[]),realtime:Object.freeze([] as string[])});
const blockedModules=(reason:string)=>Object.freeze(Object.fromEntries(moduleNames.map((name)=>[name,Object.freeze({ready:false,missing:Object.freeze([reason])})])) as Record<M38CapabilityModule,BackendModuleCapabilityStatus>);
const recordOf=(v:unknown):UnknownRecord=>v&&typeof v==='object'&&!Array.isArray(v)?v as UnknownRecord:Object.freeze({});
const strings=(v:unknown):readonly string[]=>Object.freeze(Array.isArray(v)?v.filter((item):item is string=>typeof item==='string').map((item)=>item.trim()).filter(Boolean):[]);
const runtimeConfig=()=>recordOf(globalThis.WM_BACKEND_CONFIG);
const environmentOf=(cfg:UnknownRecord):WorkManagementRuntimeEnvironment=>['local','development','ci','production'].includes(String(cfg.runtimeEnvironment))?cfg.runtimeEnvironment as WorkManagementRuntimeEnvironment:'development';
const sourceOf=(cfg:UnknownRecord):BackendConfigurationSource=>['vite-env','vite-env-incomplete','runtime-fallback','unconfigured'].includes(String(cfg.configurationSource))?cfg.configurationSource as BackendConfigurationSource:'unconfigured';
const projectHostOf=(url:string):string|null=>{try{return new URL(url).host||null;}catch{return null;}};

function baseSnapshot(message='Backend capability preflight has not run.'):BackendCapabilitySnapshot{const cfg=runtimeConfig();const url=typeof cfg.supabaseUrl==='string'?cfg.supabaseUrl.trim():'';return Object.freeze({state:'idle',checkedAt:null,code:null,message,schemaVersion:null,environment:environmentOf(cfg),configurationSource:sourceOf(cfg),projectHost:projectHostOf(url),missing:emptyMissing(),modules:blockedModules('preflight-pending')});}
let snapshot:BackendCapabilitySnapshot=baseSnapshot();
let pending:Promise<BackendCapabilitySnapshot>|null=null;
const listeners=new Set<()=>void>();
const publish=(next:BackendCapabilitySnapshot)=>{snapshot=Object.freeze(next);for(const listener of listeners)listener();return snapshot;};

function moduleStatus(module:M38CapabilityModule,available:{tables:Set<string>;rpcs:Set<string>;storage:Set<string>;realtime:Set<string>}):BackendModuleCapabilityStatus{
  const req=M38_MODULE_REQUIREMENTS[module];
  const missing=[
    ...req.tables.filter((x)=>!available.tables.has(x)).map((x)=>`table:${x}`),
    ...req.rpcs.filter((x)=>!available.rpcs.has(x)).map((x)=>`rpc:${x}`),
    ...req.storage.filter((x)=>!available.storage.has(x)).map((x)=>`storage:${x}`),
    ...req.realtime.filter((x)=>!available.realtime.has(x)).map((x)=>`realtime:${x}`),
  ];
  return Object.freeze({ready:missing.length===0,missing:Object.freeze(missing)});
}

function blocked(code:string,message:string,reason:string,schemaVersion:string|null=null):BackendCapabilitySnapshot{
  const cfg=runtimeConfig();const url=typeof cfg.supabaseUrl==='string'?cfg.supabaseUrl.trim():'';
  return Object.freeze({state:'blocked',checkedAt:new Date().toISOString(),code,message,schemaVersion,environment:environmentOf(cfg),configurationSource:sourceOf(cfg),projectHost:projectHostOf(url),missing:emptyMissing(),modules:blockedModules(reason)});
}

function failureCode(error:unknown):string{
  if(error instanceof SupabaseClientAdapterError){if(error.status===404&&error.code==='PGRST202')return 'WM_BACKEND_PREFLIGHT_CONTRACT_MISSING';if(error.status===401||error.status===403)return 'WM_BACKEND_PREFLIGHT_AUTHORIZATION_FAILED';return `WM_BACKEND_PREFLIGHT_HTTP_${error.status}`;}
  if(error instanceof DOMException&&error.name==='AbortError')return 'WM_BACKEND_PREFLIGHT_TIMEOUT';
  return 'WM_BACKEND_PREFLIGHT_UNAVAILABLE';
}

export const backendCapabilityPreflight=Object.freeze({
  getSnapshot:()=>snapshot,
  subscribe(listener:()=>void){listeners.add(listener);return()=>listeners.delete(listener);},
  reset(){pending=null;return publish(baseSnapshot());},
  moduleReady(module:M38CapabilityModule){return (snapshot.state==='ready'||snapshot.code==='WM_BACKEND_CAPABILITY_MISMATCH')&&snapshot.modules[module]?.ready===true;},
  async ensure(auth:AuthPort,{force=false}:{force?:boolean}={}):Promise<BackendCapabilitySnapshot>{
    if(pending&&!force)return pending;
    if(snapshot.state==='ready'&&!force)return snapshot;
    pending=(async()=>{
      const cfg=runtimeConfig();
      const url=typeof cfg.supabaseUrl==='string'?cfg.supabaseUrl.trim():'';
      const key=typeof cfg.publishableKey==='string'?cfg.publishableKey.trim():'';
      const source=sourceOf(cfg);
      if(source==='vite-env-incomplete'||Boolean(url)!==Boolean(key))return publish(blocked('WM_BACKEND_CONFIG_INCOMPLETE','Supabase runtime configuration is incomplete. VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be supplied together.','configuration-incomplete'));
      if(!url||!key)return publish(blocked('WM_BACKEND_CONFIG_MISSING','Supabase public runtime configuration is missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY for this environment.','configuration-missing'));
      let client;
      try{client=createSupabaseClientAdapter({supabaseUrl:url,publishableKey:key});}
      catch(error){return publish(blocked('WM_BACKEND_CONFIG_INVALID',error instanceof Error?error.message:'Supabase public runtime configuration is invalid.','configuration-invalid'));}
      try{
        publish(Object.freeze({...baseSnapshot('Verifying Supabase runtime capabilities…'),state:'checking',checkedAt:new Date().toISOString(),environment:environmentOf(cfg),configurationSource:source,projectHost:projectHostOf(url)}));
        const health=await client.health();
        if(!health.ok)return publish(blocked('WM_BACKEND_AUTH_HEALTH_FAILED',`Supabase Auth health check returned HTTP ${health.status}.`,'auth-health-failed'));
        if(!auth.isAuthenticated)return publish(blocked('WM_BACKEND_AUTH_REQUIRED','Sign in before authenticated backend capability verification can run.','authentication-required'));
        const token=await auth.ensureAccessToken();
        if(!token)return publish(blocked('WM_BACKEND_AUTH_TOKEN_UNAVAILABLE','No valid authenticated access token is available for backend capability verification.','access-token-unavailable'));
        const payload=recordOf(await client.rpc<unknown>('wm_runtime_capabilities',{},token,{timeoutMs:15_000}));
        const schemaVersion=typeof payload.schema_version==='string'?payload.schema_version.trim():'';
        if(schemaVersion!==M38_BACKEND_CAPABILITY_SCHEMA)return publish(blocked('WM_BACKEND_CAPABILITY_SCHEMA_MISMATCH',`Backend capability contract version ${schemaVersion||'(missing)'} does not match required ${M38_BACKEND_CAPABILITY_SCHEMA}.`,'capability-schema-mismatch',schemaVersion||null));
        const available={tables:new Set(strings(payload.tables)),rpcs:new Set(strings(payload.rpcs)),storage:new Set(strings(payload.storage)),realtime:new Set(strings(payload.realtime))};
        const modules=Object.freeze(Object.fromEntries(moduleNames.map((name)=>[name,moduleStatus(name,available)])) as Record<M38CapabilityModule,BackendModuleCapabilityStatus>);
        const missing=Object.freeze({tables:strings(payload.missing_tables),rpcs:strings(payload.missing_rpcs),storage:strings(payload.missing_storage),realtime:strings(payload.missing_realtime)});
        const complete=moduleNames.every((name)=>modules[name].ready);
        return publish(Object.freeze({state:'ready',checkedAt:new Date().toISOString(),code:complete?null:'WM_BACKEND_CAPABILITY_MISMATCH',message:complete?'Backend capability preflight passed.':'Backend capability preflight completed; one or more modules are gated because required capabilities are missing.',schemaVersion,environment:environmentOf(cfg),configurationSource:source,projectHost:projectHostOf(url),missing,modules}));
      }catch(error){return publish(blocked(failureCode(error),error instanceof Error?error.message:'Backend capability preflight failed.','preflight-unavailable'));}
    })().finally(()=>{pending=null;});
    return pending;
  }
});
