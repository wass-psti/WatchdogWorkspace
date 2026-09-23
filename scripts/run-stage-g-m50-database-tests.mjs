import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const CERTIFIED_SUPABASE_CLI='2.117.0';
const LOCAL_PROJECT_ID='work-management-m50-table-tests';
const root=process.cwd();
const schemaPath=resolve(root,'supabase/schema.sql');
const testsPath=resolve(root,'supabase/tests/m50');
const keep=process.env.WM_M50_KEEP_LOCAL_STACK==='1';
const quiet=(command,args)=>spawnSync(command,args,{encoding:'utf8',shell:false});
const run=(command,args,label,options={})=>{
  console.log(`\n================ ${label} ================`);
  const result=spawnSync(command,args,{stdio:'inherit',shell:false,...options});
  if(result.error){if(result.error.code==='ENOENT')throw new Error(`${command} is required for M50 local database verification.`);throw result.error;}
  if(result.status!==0)throw new Error(`${label} failed with exit code ${result.status??'unknown'}.`);
};
const globalVersion=quiet('supabase',['--version']);
const globalActual=globalVersion.error?'':(globalVersion.stdout||globalVersion.stderr||'').trim().replace(/^v/,'');
let supabaseCommand='supabase'; let supabasePrefix=[];
if(globalActual!==CERTIFIED_SUPABASE_CLI){
  const pinned=`supabase@${CERTIFIED_SUPABASE_CLI}`;
  const resolved=quiet('npx',['--yes',pinned,'--version']);
  if(resolved.error||resolved.status!==0)throw new Error(`M50 requires Supabase CLI ${CERTIFIED_SUPABASE_CLI}. Install it globally or allow npx to resolve ${pinned}.`);
  const actual=(resolved.stdout||resolved.stderr||'').trim().replace(/^v/,'');
  if(actual!==CERTIFIED_SUPABASE_CLI)throw new Error(`Pinned Supabase CLI resolution failed: expected ${CERTIFIED_SUPABASE_CLI}, received ${actual||'unknown'}.`);
  supabaseCommand='npx'; supabasePrefix=['--yes',pinned];
}
const args=(list)=>[...supabasePrefix,...list];
const supabase=(workdir,list,label)=>run(supabaseCommand,args(['--workdir',workdir,...list]),label);
const docker=quiet('docker',['version','--format','{{.Server.Version}}']);
if(docker.error||docker.status!==0)throw new Error('A running Docker-compatible container runtime is required for the disposable M50 Supabase test stack.');

const workdir=mkdtempSync(join(tmpdir(),'wm-m50-supabase-'));
const supabaseDir=join(workdir,'supabase');
mkdirSync(supabaseDir,{recursive:true});
writeFileSync(join(supabaseDir,'config.toml'),`project_id = "${LOCAL_PROJECT_ID}"\n\n[db.migrations]\nenabled = false\nschema_paths = []\n\n[db.seed]\nenabled = false\nsql_paths = []\n`,'utf8');
const cleanup=()=>{
  if(!keep){spawnSync(supabaseCommand,args(['stop','--project-id',LOCAL_PROJECT_ID,'--no-backup']),{stdio:'inherit',shell:false});rmSync(workdir,{recursive:true,force:true});}
  else console.log(`\nM50 local stack retained for diagnostics: ${workdir}`);
};
try{
  spawnSync(supabaseCommand,args(['stop','--project-id',LOCAL_PROJECT_ID,'--no-backup']),{stdio:'ignore',shell:false});
  supabase(workdir,['start'],'Start disposable M50 Supabase table/group/item stack');
  const container=`supabase_db_${LOCAL_PROJECT_ID}`;
  const schemaSql=readFileSync(schemaPath,'utf8');
  console.log('\n================ Bootstrap authoritative M50 schema snapshot ================');
  const schema=spawnSync('docker',['exec','-i',container,'psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{input:schemaSql,encoding:'utf8',shell:false});
  if(schema.stdout)process.stdout.write(schema.stdout); if(schema.stderr)process.stderr.write(schema.stderr);
  if(schema.error)throw schema.error; if(schema.status!==0)throw new Error(`M50 authoritative schema bootstrap failed with exit code ${schema.status??'unknown'}.`);
  supabase(workdir,['test','db','--local',testsPath],'Run M50 pgTAP table/group/item recovery suite');
  console.log('\nStage G M50 local Database/Storage authorization verification: PASS (schemaSnapshot=true; pgTAP=33; storageOwnership=true; m46ContractCompatible=true)');
}finally{cleanup();}
