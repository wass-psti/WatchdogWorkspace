import assert from 'node:assert/strict';
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root=resolve(import.meta.dirname,'..');
const deploymentName='20260917142647_stage_g_m46_boards_backend_data_contract_recovery.sql';
function fixture(){
  const dir=mkdtempSync(join(tmpdir(),'wm-m46-deploy-guard-')); const bin=join(dir,'bin');
  mkdirSync(join(dir,'scripts'),{recursive:true}); mkdirSync(join(dir,'supabase','migrations'),{recursive:true}); mkdirSync(join(dir,'supabase','deployments','m46'),{recursive:true}); mkdirSync(bin,{recursive:true});
  cpSync(join(root,'scripts/deploy-stage-g-m46-production-contract.sh'),join(dir,'scripts/deploy-stage-g-m46-production-contract.sh'));
  cpSync(join(root,'supabase/migrations/v1.43.2-stage-g-m46-boards-backend-data-contract-recovery.sql'),join(dir,'supabase/migrations/v1.43.2-stage-g-m46-boards-backend-data-contract-recovery.sql'));
  cpSync(join(root,'supabase/deployments/m46',deploymentName),join(dir,'supabase/deployments/m46',deploymentName));
  writeFileSync(join(dir,'scripts/verify-stage-g-m46-production-contract.mjs'),'process.exit(0);\n');
  writeFileSync(join(bin,'node'),`#!/bin/sh\nif [ "$1" = "--version" ]; then echo v22.16.0; exit 0; fi\nif [ "\${M46_FAKE_ATTESTATION:-pass}" = "fail-first" ] && echo "$*" | grep -q 'verify-stage-g-m46-production-contract.mjs'; then if [ ! -f "${dir}/attestation-seen" ]; then touch "${dir}/attestation-seen"; exit 1; fi; fi\nexit 0\n`); chmodSync(join(bin,'node'),0o755);
  writeFileSync(join(bin,'supabase'),`#!/bin/sh\nif [ "$1" = "--version" ]; then echo 2.117.0; exit 0; fi\nprintf '%s\\n' "$*" >> "${dir}/supabase-calls.log"\nexit 0\n`); chmodSync(join(bin,'supabase'),0o755);
  return {dir,bin};
}
function run(ctx,extra={}){return spawnSync('bash',['scripts/deploy-stage-g-m46-production-contract.sh'],{cwd:ctx.dir,encoding:'utf8',env:{...process.env,PATH:`${ctx.bin}:${process.env.PATH||''}`,SUPABASE_PROJECT_REF:'abc123',VITE_SUPABASE_URL:'https://abc123.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fixture',...extra}});}
{
  const c=fixture(); try{const r=run(c);assert.notEqual(r.status,0);assert.match(`${r.stdout}${r.stderr}`,/WM_M46_ALLOW_PRODUCTION_MIGRATION=1/);}finally{rmSync(c.dir,{recursive:true,force:true});}
}
{
  const c=fixture(); try{const r=run(c,{WM_M46_ALLOW_PRODUCTION_MIGRATION:'1',VITE_SUPABASE_URL:'https://wrong.supabase.co'});assert.notEqual(r.status,0);assert.match(`${r.stdout}${r.stderr}`,/does not match VITE_SUPABASE_URL/);}finally{rmSync(c.dir,{recursive:true,force:true});}
}
{
  const c=fixture(); try{writeFileSync(join(c.dir,'supabase/deployments/m46',deploymentName),'drift\n');const r=run(c,{WM_M46_ALLOW_PRODUCTION_MIGRATION:'1'});assert.notEqual(r.status,0);assert.match(`${r.stdout}${r.stderr}`,/deployment copy differ/);}finally{rmSync(c.dir,{recursive:true,force:true});}
}
{
  const c=fixture(); try{const r=run(c,{WM_M46_ALLOW_PRODUCTION_MIGRATION:'1'});assert.equal(r.status,0,`${r.stdout}\n${r.stderr}`);assert.match(r.stdout,/already matches/);assert.throws(()=>readFileSync(join(c.dir,'supabase-calls.log'),'utf8'),/ENOENT/);}finally{rmSync(c.dir,{recursive:true,force:true});}
}
{
  const c=fixture(); try{const r=run(c,{WM_M46_ALLOW_PRODUCTION_MIGRATION:'1',M46_FAKE_ATTESTATION:'fail-first'});assert.equal(r.status,0,`${r.stdout}\n${r.stderr}`);const calls=readFileSync(join(c.dir,'supabase-calls.log'),'utf8');assert.match(calls,/projects list/);assert.match(calls,/link --project-ref abc123/);assert.match(calls,/db push --linked --include-all --dry-run/);assert.match(calls,/db push --linked --include-all --yes/);assert(!calls.includes('--password'),'passwordless deployment path must not synthesize an empty password argument');assert(calls.indexOf('dry-run')<calls.indexOf('--yes'));}finally{rmSync(c.dir,{recursive:true,force:true});}
}
{
  const c=fixture(); try{const r=run(c,{WM_M46_ALLOW_PRODUCTION_MIGRATION:'1',M46_FAKE_ATTESTATION:'fail-first',SUPABASE_DB_PASSWORD:'db_fixture_secret'});assert.equal(r.status,0,`${r.stdout}\n${r.stderr}`);const calls=readFileSync(join(c.dir,'supabase-calls.log'),'utf8');assert.match(calls,/link --project-ref abc123 --password db_fixture_secret/);assert.match(calls,/db push --linked --include-all --password db_fixture_secret --dry-run/);assert.match(calls,/db push --linked --include-all --password db_fixture_secret --yes/);}finally{rmSync(c.dir,{recursive:true,force:true});}
}
const deploySource=readFileSync(join(root,'scripts/deploy-stage-g-m46-production-contract.sh'),'utf8');
assert(!deploySource.includes('PASSWORD_ARGS=()')&&!deploySource.includes('${PASSWORD_ARGS[@]}'),'production deploy helper must remain compatible with macOS Bash 3.2 + set -u by avoiding empty-array expansion.');
assert(deploySource.includes('verify-stage-g-m46-production-contract.mjs >/dev/null 2>&1')&&deploySource.indexOf('verify-stage-g-m46-production-contract.mjs >/dev/null 2>&1')<deploySource.indexOf('db push --linked'),'production deploy helper must attest before any migration replay.');
assert(deploySource.includes(deploymentName),'production deployment copy must bind the actual Supabase migration-ledger version.');
console.log('Stage G M46 production deployment guard verification: PASS (explicit opt-in, target binding, SQL provenance, attestation-first idempotency, ledger binding, dry-run-before-apply)');
