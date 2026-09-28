import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const VERSION='2.117.0';
const PROJECT='work-management-m52-rbac-tests';
const root=process.cwd();
const work=mkdtempSync(join(tmpdir(),'wm-m52-supabase-'));
const supabaseDir=join(work,'supabase');
const config=`project_id = "${PROJECT}"

[db.migrations]
enabled = false
schema_paths = []

[db.seed]
enabled = false
sql_paths = []
`;
mkdirSync(supabaseDir,{recursive:true});
writeFileSync(join(supabaseDir,'config.toml'),config,'utf8');

const quiet=(command,args,options={})=>spawnSync(command,args,{encoding:'utf8',shell:false,...options});
const run=(command,args,label,options={})=>{
  console.log(`
================ ${label} ================`);
  const result=spawnSync(command,args,{stdio:'inherit',shell:false,...options});
  if(result.error) throw result.error;
  if(result.status!==0) throw new Error(`${label} failed (${result.status}).`);
};

let cmd='supabase';
let prefix=[];
const globalVersion=quiet('supabase',['--version'],{cwd:work});
if(globalVersion.error||String(globalVersion.stdout||globalVersion.stderr).trim().replace(/^v/,'')!==VERSION){
  const pinned=`supabase@${VERSION}`;
  const resolved=quiet('npx',['--yes',pinned,'--version'],{cwd:work});
  if(resolved.error||resolved.status!==0) throw new Error(`Supabase CLI ${VERSION} is required.`);
  cmd='npx';
  prefix=['--yes',pinned];
}
const docker=quiet('docker',['version','--format','{{.Server.Version}}'],{cwd:work});
if(docker.error||docker.status!==0) throw new Error('A running Docker-compatible runtime is required for M52 database verification.');
const args=(items)=>[...prefix,'--workdir',work,...items];
const stop=()=>spawnSync(cmd,args(['stop','--project-id',PROJECT,'--no-backup']),{stdio:'ignore',shell:false,cwd:work});
const cleanup=()=>{ stop(); rmSync(work,{recursive:true,force:true}); };

try{
  stop();
  mkdirSync(supabaseDir,{recursive:true});
  writeFileSync(join(supabaseDir,'config.toml'),config,'utf8');
  run(cmd,args(['start']),'Start disposable M52 Supabase stack',{cwd:work});
  const db=`supabase_db_${PROJECT}`;
  const schema=spawnSync('docker',['exec','-i',db,'psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{input:readFileSync(resolve(root,'supabase/schema.sql'),'utf8'),encoding:'utf8',shell:false,cwd:work});
  if(schema.stdout) process.stdout.write(schema.stdout);
  if(schema.stderr) process.stderr.write(schema.stderr);
  if(schema.error) throw schema.error;
  if(schema.status!==0) throw new Error('M52 schema bootstrap failed.');
  run(cmd,args(['test','db','--local',resolve(root,'supabase/tests/m52')]),'Run M52 pgTAP role matrix suite',{cwd:work});
  console.log('\nStage G M52 database RBAC verification: PASS');
} finally {
  cleanup();
}
