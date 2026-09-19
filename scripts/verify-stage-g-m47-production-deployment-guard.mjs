import assert from 'node:assert/strict';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root=resolve(import.meta.dirname,'..');
const M46_DEPLOYMENT='20260917142647_stage_g_m46_boards_backend_data_contract_recovery.sql';
const M47_DEPLOYMENT='20260919165239_stage_g_m47_boards_table_group_item_recovery.sql';

function fixture(){
  const dir=mkdtempSync(join(tmpdir(),'wm-m47-resume-guard-'));
  const bin=join(dir,'bin');
  for(const sub of ['scripts','supabase/migrations','supabase/deployments/m46','supabase/deployments/m47']) mkdirSync(join(dir,sub),{recursive:true});
  mkdirSync(bin,{recursive:true});
  cpSync(join(root,'scripts/deploy-stage-g-m47-production-recovery.sh'),join(dir,'scripts/deploy-stage-g-m47-production-recovery.sh'));
  cpSync(join(root,'supabase/migrations/v1.43.2-stage-g-m46-boards-backend-data-contract-recovery.sql'),join(dir,'supabase/migrations/v1.43.2-stage-g-m46-boards-backend-data-contract-recovery.sql'));
  cpSync(join(root,'supabase/deployments/m46',M46_DEPLOYMENT),join(dir,'supabase/deployments/m46',M46_DEPLOYMENT));
  cpSync(join(root,'supabase/migrations/v1.43.2-stage-g-m47-boards-table-group-item-recovery.sql'),join(dir,'supabase/migrations/v1.43.2-stage-g-m47-boards-table-group-item-recovery.sql'));
  cpSync(join(root,'supabase/deployments/m47',M47_DEPLOYMENT),join(dir,'supabase/deployments/m47',M47_DEPLOYMENT));
  writeFileSync(join(dir,'scripts/verify-stage-g-m47-production-invariants.mjs'),`import fs from 'node:fs';\nprocess.exit(fs.existsSync(process.env.M47_FIXTURE_ROOT+'/production-live')?0:1);\n`);
  writeFileSync(join(bin,'node'),`#!/bin/sh\nif [ "$1" = "--version" ]; then echo v22.16.0; exit 0; fi\nexec "${process.execPath}" "$@"\n`);
  chmodSync(join(bin,'node'),0o755);
  writeFileSync(join(bin,'supabase'),`#!/bin/sh\nif [ "$1" = "--version" ]; then echo 2.117.0; exit 0; fi\nprintf '%s\\n' "$*" >> "${dir}/supabase-calls.log"\necho 'fixture: unexpected Supabase CLI mutation/query call in post-deployment resume mode' >&2\nexit 91\n`);
  chmodSync(join(bin,'supabase'),0o755);
  return {dir,bin};
}

function run(c,extra={}){
  return spawnSync('bash',['scripts/deploy-stage-g-m47-production-recovery.sh'],{
    cwd:c.dir,
    encoding:'utf8',
    env:{...process.env,PATH:`${c.bin}:${process.env.PATH||''}`,M47_FIXTURE_ROOT:c.dir,SUPABASE_PROJECT_REF:'abc123',VITE_SUPABASE_URL:'https://abc123.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fixture',...extra},
  });
}

{
  const c=fixture();
  try{
    const r=run(c);
    assert.notEqual(r.status,0);
    assert.match(`${r.stdout}${r.stderr}`,/WM_M47_ALLOW_PRODUCTION_MIGRATION=1/);
  }finally{rmSync(c.dir,{recursive:true,force:true});}
}
{
  const c=fixture();
  try{
    const r=run(c,{WM_M47_ALLOW_PRODUCTION_MIGRATION:'1',VITE_SUPABASE_URL:'https://wrong.supabase.co'});
    assert.notEqual(r.status,0);
    assert.match(`${r.stdout}${r.stderr}`,/does not match VITE_SUPABASE_URL/);
  }finally{rmSync(c.dir,{recursive:true,force:true});}
}
{
  const c=fixture();
  try{
    writeFileSync(join(c.dir,'production-live'),'live');
    const r=run(c,{WM_M47_ALLOW_PRODUCTION_MIGRATION:'1'});
    assert.equal(r.status,0,`${r.stdout}\n${r.stderr}`);
    assert.match(r.stdout,/migration replay skipped \(provenance=20260919165239_stage_g_m47_boards_table_group_item_recovery\.sql\)/);
    assert.match(r.stdout,/post-deployment resume attestation: PASS \(replay-forbidden=true\)/);
    assert.equal(existsSync(join(c.dir,'supabase-calls.log')),false,'compatible resume must not invoke Supabase CLI after version preflight');
  }finally{rmSync(c.dir,{recursive:true,force:true});}
}
{
  const c=fixture();
  try{
    const r=run(c,{WM_M47_ALLOW_PRODUCTION_MIGRATION:'1'});
    assert.notEqual(r.status,0);
    assert.match(`${r.stdout}${r.stderr}`,/production was already deployed, but semantic attestation no longer matches/);
    assert.match(`${r.stdout}${r.stderr}`,/forbids migration replay/);
    assert.equal(existsSync(join(c.dir,'supabase-calls.log')),false,'failed resume attestation must not invoke Supabase CLI mutation/query commands');
  }finally{rmSync(c.dir,{recursive:true,force:true});}
}
{
  const c=fixture();
  try{
    rmSync(join(c.dir,'supabase/deployments/m47',M47_DEPLOYMENT));
    writeFileSync(join(c.dir,'production-live'),'live');
    const r=run(c,{WM_M47_ALLOW_PRODUCTION_MIGRATION:'1'});
    assert.notEqual(r.status,0);
    assert.match(`${r.stdout}${r.stderr}`,/certified M47 timestamped deployment provenance is missing/);
  }finally{rmSync(c.dir,{recursive:true,force:true});}
}
{
  const c=fixture();
  try{
    writeFileSync(join(c.dir,'supabase/deployments/m47',M47_DEPLOYMENT),'drift');
    writeFileSync(join(c.dir,'production-live'),'live');
    const r=run(c,{WM_M47_ALLOW_PRODUCTION_MIGRATION:'1'});
    assert.notEqual(r.status,0);
    assert.match(`${r.stdout}${r.stderr}`,/certified M47 source migration and timestamped deployment provenance differ/);
  }finally{rmSync(c.dir,{recursive:true,force:true});}
}
{
  const c=fixture();
  try{
    cpSync(join(c.dir,'supabase/deployments/m47',M47_DEPLOYMENT),join(c.dir,'supabase/deployments/m47','20260919165240_stage_g_m47_boards_table_group_item_recovery.sql'));
    writeFileSync(join(c.dir,'production-live'),'live');
    const r=run(c,{WM_M47_ALLOW_PRODUCTION_MIGRATION:'1'});
    assert.notEqual(r.status,0);
    assert.match(`${r.stdout}${r.stderr}`,/requires exactly one M47 deployment provenance file; found 2/);
  }finally{rmSync(c.dir,{recursive:true,force:true});}
}
{
  const c=fixture();
  try{
    rmSync(join(c.dir,'supabase/deployments/m46',M46_DEPLOYMENT));
    writeFileSync(join(c.dir,'production-live'),'live');
    const r=run(c,{WM_M47_ALLOW_PRODUCTION_MIGRATION:'1'});
    assert.notEqual(r.status,0);
    assert.match(`${r.stdout}${r.stderr}`,/certified M46 timestamped deployment provenance is missing/);
  }finally{rmSync(c.dir,{recursive:true,force:true});}
}
{
  const c=fixture();
  try{
    writeFileSync(join(c.dir,'supabase/deployments/m46',M46_DEPLOYMENT),'drift');
    writeFileSync(join(c.dir,'production-live'),'live');
    const r=run(c,{WM_M47_ALLOW_PRODUCTION_MIGRATION:'1'});
    assert.notEqual(r.status,0);
    assert.match(`${r.stdout}${r.stderr}`,/certified M46 migration and timestamped deployment provenance differ/);
  }finally{rmSync(c.dir,{recursive:true,force:true});}
}

const source=readFileSync(join(root,'scripts/deploy-stage-g-m47-production-recovery.sh'),'utf8');
assert(source.includes("M46_DEPLOYMENT_NAME='20260917142647_stage_g_m46_boards_backend_data_contract_recovery.sql'"),'M47 resume helper must bind the certified M46 ledger timestamp.');
assert(source.includes("M47_DEPLOYMENT_NAME='20260919165239_stage_g_m47_boards_table_group_item_recovery.sql'"),'M47 resume helper must bind the exact already-applied M47 ledger timestamp.');
assert(source.includes('cmp -s "$M46_MIGRATION" "$M46_DEPLOYMENT"'),'M47 resume helper must prove M46 semantic/provenance byte identity.');
assert(source.includes('cmp -s "$MIGRATION" "$M47_DEPLOYMENT"'),'M47 resume helper must prove M47 semantic/provenance byte identity.');
assert(source.includes('verify-stage-g-m47-production-invariants.mjs'),'M47 resume helper must require live production semantic attestation before continuing.');
assert(source.includes('migration replay skipped'),'M47 resume helper must explicitly record the no-replay path.');
assert(source.includes('forbids migration replay'),'M47 resume helper must fail closed if the already-deployed production semantic contract drifts.');
assert(!source.includes('db push'),'M47 post-deployment resume helper must never push a migration again.');
assert(!source.includes('migration new'),'M47 post-deployment resume helper must never mint a second migration ledger filename.');
assert(!source.includes('migration repair'),'M47 resume helper must never rewrite production migration history.');
assert(!source.includes('db reset'),'M47 resume helper must never destructively reset production.');
assert(!source.includes('PASSWORD_ARGS=()')&&!source.includes('${PASSWORD_ARGS[@]}'),'M47 resume helper must remain macOS Bash 3.2 safe.');
console.log('Stage G M47 production deployment guard verification: PASS (post-deployment-resume-only=true; certified-M46/M47-ledger-provenance=true; semantic-attestation=true; replay-forbidden=true)');
