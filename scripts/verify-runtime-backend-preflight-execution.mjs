import assert from 'node:assert/strict';
import {
  M38_BACKEND_CAPABILITY_SCHEMA,
  M38_REQUIRED_REALTIME_CAPABILITIES,
  M38_REQUIRED_RPCS,
  M38_REQUIRED_STORAGE_BUCKETS,
  M38_REQUIRED_TABLES,
} from '../config/backend-capability-manifest.ts';
import {
  M46_BOARD_CONTRACT_DIGEST,
  M46_BOARD_CONTRACT_VERSION,
} from '../config/stage-g-m46-board-backend-contract.ts';

const project='https://m38-exec.supabase.co';
const key='sb_publishable_m38_execution_fixture';
const originalFetch=globalThis.fetch;
const originalConfig=globalThis.WM_BACKEND_CONFIG;
const moduleUrl=new URL(`../assets/js/platform/data/backend-capability-preflight.ts?m38=${Date.now()}`, import.meta.url);
const { backendCapabilityPreflight }=await import(moduleUrl.href);
const auth={isAuthenticated:true,async ensureAccessToken(){return 'm38.fixture.access.token';}};
const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
const basePayload=()=>({
  schema_version:M38_BACKEND_CAPABILITY_SCHEMA,
  tables:[...M38_REQUIRED_TABLES],
  rpcs:[...M38_REQUIRED_RPCS],
  storage:[...M38_REQUIRED_STORAGE_BUCKETS],
  realtime:[...M38_REQUIRED_REALTIME_CAPABILITIES],
  missing_tables:[],
  missing_rpcs:[],
  missing_storage:[],
  missing_realtime:[],
});
const boardAttestation=()=>({
  contract_version:M46_BOARD_CONTRACT_VERSION,
  contract_digest:M46_BOARD_CONTRACT_DIGEST,
  compatible:true,
  rpc_count:40,
  expected_rpc_count:40,
  table_count:9,
  expected_table_count:9,
  rls_table_count:9,
  board_table_policy_count:0,
  board_table_policy_table_count:9,
  direct_privilege_violations:0,
  storage_ok:true,
  storage_policy_count:3,
  realtime_function_count:2,
  realtime_policy_count:2,
  realtime_trigger_count:8,
  capabilities_ok:true,
});

let scenario='ready';
globalThis.fetch=async (input)=>{
  const url=new URL(String(input));
  if(url.pathname==='/auth/v1/health')return json(scenario==='health-fail'?503:200,{status:scenario==='health-fail'?'unavailable':'ok'});
  if(url.pathname==='/rest/v1/rpc/wm_runtime_capabilities'){
    if(scenario==='contract-missing')return json(404,{code:'PGRST202',message:'Could not find the function public.wm_runtime_capabilities in the schema cache'});
    const payload=basePayload();
    if(scenario==='schema-mismatch')payload.schema_version='1.43.2-m38-v1';
    if(scenario==='boards-missing'){payload.storage=[];payload.missing_storage=['work-board-files'];}
    return json(200,payload);
  }
  if(url.pathname==='/rest/v1/rpc/wm_board_contract_attestation'){
    const payload=boardAttestation();
    if(scenario==='board-contract-digest-mismatch')payload.contract_digest='0'.repeat(64);
    if(scenario==='board-contract-incompatible')payload.compatible=false;
    return json(200,payload);
  }
  return json(404,{code:'M38_UNHANDLED',message:url.pathname});
};

function configure(url=project,publishableKey=key,source='vite-env'){
  globalThis.WM_BACKEND_CONFIG={
    provider:'supabase',
    accountBased:true,
    enabled:true,
    supabaseUrl:url,
    publishableKey,
    requireAuthentication:true,
    allowRegistration:true,
    runtimeEnvironment:'ci',
    configurationSource:source,
  };
  backendCapabilityPreflight.reset();
}

try{
  globalThis.WM_BACKEND_CONFIG={provider:'supabase',accountBased:true,enabled:true,supabaseUrl:'',publishableKey:'',runtimeEnvironment:'local',configurationSource:'unconfigured'};
  backendCapabilityPreflight.reset();
  let result=await backendCapabilityPreflight.ensure(auth,{force:true});
  assert.equal(result.code,'WM_BACKEND_CONFIG_MISSING');

  configure(project,'','vite-env-incomplete');
  result=await backendCapabilityPreflight.ensure(auth,{force:true});
  assert.equal(result.code,'WM_BACKEND_CONFIG_INCOMPLETE');

  configure();scenario='health-fail';
  result=await backendCapabilityPreflight.ensure(auth,{force:true});
  assert.equal(result.code,'WM_BACKEND_AUTH_HEALTH_FAILED');

  configure();scenario='contract-missing';
  result=await backendCapabilityPreflight.ensure(auth,{force:true});
  assert.equal(result.code,'WM_BACKEND_PREFLIGHT_CONTRACT_MISSING');

  configure();scenario='schema-mismatch';
  result=await backendCapabilityPreflight.ensure(auth,{force:true});
  assert.equal(result.code,'WM_BACKEND_CAPABILITY_SCHEMA_MISMATCH');

  configure();scenario='boards-missing';
  result=await backendCapabilityPreflight.ensure(auth,{force:true});
  assert.equal(result.state,'ready');
  assert.equal(result.modules.account.ready,true);
  assert.equal(result.modules.boards.ready,false);
  assert(result.modules.boards.missing.includes('storage:work-board-files'));

  configure();scenario='board-contract-digest-mismatch';
  result=await backendCapabilityPreflight.ensure(auth,{force:true});
  assert.equal(result.state,'ready');
  assert.equal(result.code,'WM_BACKEND_CAPABILITY_MISMATCH');
  assert.equal(result.modules.account.ready,true);
  assert.equal(result.modules.boards.ready,false);
  assert(result.modules.boards.missing.includes(`contract-digest:${'0'.repeat(64)}`));

  configure();scenario='board-contract-incompatible';
  result=await backendCapabilityPreflight.ensure(auth,{force:true});
  assert.equal(result.state,'ready');
  assert.equal(result.code,'WM_BACKEND_CAPABILITY_MISMATCH');
  assert.equal(result.modules.boards.ready,false);
  assert(result.modules.boards.missing.includes('contract-compatible:false'));

  configure();scenario='ready';
  result=await backendCapabilityPreflight.ensure(auth,{force:true});
  assert.equal(result.state,'ready');
  assert.equal(result.code,null);
  assert(Object.values(result.modules).every((entry)=>entry.ready));
  assert.equal(result.environment,'ci');
  assert.equal(result.configurationSource,'vite-env');

  console.log('Stage G M38 runtime/backend preflight execution verification: PASS (vectors=9; moduleSpecificGating=true; m46BoardAttestation=true; failClosed=true)');
}finally{
  globalThis.fetch=originalFetch;
  globalThis.WM_BACKEND_CONFIG=originalConfig;
}
