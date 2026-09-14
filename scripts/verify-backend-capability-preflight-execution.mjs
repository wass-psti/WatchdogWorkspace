import { backendCapabilityPreflight } from '../assets/js/platform/data/backend-capability-preflight.ts';
import { M38_REQUIRED_TABLES,M38_REQUIRED_RPCS,M38_REQUIRED_REALTIME_CAPABILITIES } from '../config/backend-capability-manifest.ts';
const originalFetch=globalThis.fetch;const auth={isAuthenticated:true,async ensureAccessToken(){return 'm38.test.access.token';}};
const assert=(value,message)=>{if(!value)throw new Error(message);};
const response=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
try{
  globalThis.WM_BACKEND_CONFIG={supabaseUrl:'',publishableKey:''};backendCapabilityPreflight.reset();let snap=await backendCapabilityPreflight.ensure(auth,{force:true});assert(snap.state==='blocked'&&snap.code==='WM_BACKEND_CONFIG_MISSING','M38 missing configuration must fail explicitly.');
  globalThis.WM_BACKEND_CONFIG={supabaseUrl:'https://m38-fixture.supabase.co',publishableKey:'sb_publishable_m38_test'};
  globalThis.fetch=async(url)=>String(url).includes('/auth/v1/health')?response(200,{status:'ok'}):response(200,{schema_version:'1.43.2-m38-v2',tables:[...M38_REQUIRED_TABLES],rpcs:[...M38_REQUIRED_RPCS],storage:['work-board-files'],realtime:[...M38_REQUIRED_REALTIME_CAPABILITIES],missing_tables:[],missing_rpcs:[],missing_storage:[],missing_realtime:[]});
  backendCapabilityPreflight.reset();snap=await backendCapabilityPreflight.ensure(auth,{force:true});assert(snap.state==='ready'&&snap.modules.boards.ready&&snap.modules.users.ready&&snap.modules.settings.ready&&snap.modules.account.ready,'M38 complete capability snapshot must become ready.');
  globalThis.fetch=async(url)=>String(url).includes('/auth/v1/health')?response(200,{status:'ok'}):response(200,{schema_version:'1.43.2-m38-v2',tables:[...M38_REQUIRED_TABLES],rpcs:[...M38_REQUIRED_RPCS],storage:[],realtime:[...M38_REQUIRED_REALTIME_CAPABILITIES],missing_tables:[],missing_rpcs:[],missing_storage:['work-board-files'],missing_realtime:[]});
  backendCapabilityPreflight.reset();snap=await backendCapabilityPreflight.ensure(auth,{force:true});assert(snap.state==='ready'&&!snap.modules.boards.ready&&snap.modules.account.ready&&snap.code==='WM_BACKEND_CAPABILITY_MISMATCH','M38 missing Board storage must block Boards without blocking unrelated Account capability.');
  console.log('Stage G M38 backend capability preflight execution: PASS (config=explicit; ready=true; moduleGating=verified; missingStorage=blocked)');
}finally{globalThis.fetch=originalFetch;delete globalThis.WM_BACKEND_CONFIG;backendCapabilityPreflight.reset();}
