import assert from 'node:assert/strict';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync as fsSymlink, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const base='Work-Management-App-v1.43.2-Stage-G-M47-Certified-Baseline';
function prepare(){
  const sandbox=mkdtempSync(join(tmpdir(),'wm-m47-finalizer-')); const project=join(sandbox,'project'); const bin=join(sandbox,'bin');
  for(const d of ['scripts/lib','config','src'])mkdirSync(join(project,d),{recursive:true}); mkdirSync(bin,{recursive:true});
  cpSync(join(root,'scripts/finalize-stage-g-m47.sh'),join(project,'scripts/finalize-stage-g-m47.sh'));
  cpSync(join(root,'scripts/lib/stage-g-m47-certification-tree.mjs'),join(project,'scripts/lib/stage-g-m47-certification-tree.mjs'));
  cpSync(join(root,'config/stage-g-m47-boards-table-group-item-recovery-target.ts'),join(project,'config/stage-g-m47-boards-table-group-item-recovery-target.ts'));
  cpSync(join(root,'config/stage-g-m46-boards-backend-data-contract-recovery-target.ts'),join(project,'config/stage-g-m46-boards-backend-data-contract-recovery-target.ts'));
  cpSync(join(root,'config/stage-g-m46-board-backend-contract.ts'),join(project,'config/stage-g-m46-board-backend-contract.ts'));
  cpSync(join(root,'RELEASE-STATUS-v1.43.2-STAGE-G-M47-BOARDS-TABLE-GROUP-ITEM-RECOVERY.md'),join(project,'RELEASE-STATUS-v1.43.2-STAGE-G-M47-BOARDS-TABLE-GROUP-ITEM-RECOVERY.md'));
  for(const file of ['config/stage-g-m47-boards-table-group-item-recovery-target.ts','RELEASE-STATUS-v1.43.2-STAGE-G-M47-BOARDS-TABLE-GROUP-ITEM-RECOVERY.md']){
    const p=join(project,file); let s=readFileSync(p,'utf8'); s=s.replace("activationState: 'implementation-in-progress'","activationState: 'implementation-complete-pending-certification'").replace('**State:** implementation-in-progress','**State:** implementation-complete-pending-certification'); writeFileSync(p,s);
  }
  for(const [file,body] of [
    ['verify-stage-g-m47-boards-table-group-item-recovery.mjs','process.exit(0);\n'],
    ['scripts/verify-stage-g-m47-production-invariants.mjs','process.exit(0);\n'],
    ['scripts/verify-stage-g-m47-deployment-provenance.mjs','process.exit(0);\n'],
    ['scripts/verify-stage-g-m47-certified-artifact.mjs','process.exit(0);\n'],
    ['scripts/scan-secrets.mjs','process.exit(0);\n'],
    ['verify-project.sh','#!/bin/sh\nexit 0\n'],
  ]){const p=join(project,file);mkdirSync(join(p,'..'),{recursive:true});writeFileSync(p,body);if(file.endsWith('.sh'))chmodSync(p,0o755);}
  writeFileSync(join(project,'src/m47-certification-source.txt'),'stable-source\n');
  writeFileSync(join(project,'src/m47-executable-fixture.sh'),'#!/bin/sh\nexit 0\n'); chmodSync(join(project,'src/m47-executable-fixture.sh'),0o755);
  try{fsSymlink('m47-certification-source.txt',join(project,'src/m47-source-link'));}catch{}
  return {sandbox,project,bin};
}
function commitFixture(c){
  const git=(...args)=>spawnSync('git',args,{cwd:c.project,encoding:'utf8'});
  for(const args of [['init','-q'],['config','user.name','M47 Finalizer Fixture'],['config','user.email','m47-fixture@example.invalid'],['add','-A'],['commit','-qm','fixture']]){const r=git(...args);assert.equal(r.status,0,`git ${args.join(' ')} failed: ${r.stderr||r.stdout}`);}
  const rev=git('rev-parse','HEAD');assert.equal(rev.status,0);c.commit=rev.stdout.trim();return c.commit;
}
function installNpmStub(c,body){const p=join(c.bin,'npm');writeFileSync(p,`#!/bin/sh\n${body}\n`);chmodSync(p,0o755);}
function run(c,extra={}){return spawnSync('bash',['scripts/finalize-stage-g-m47.sh'],{cwd:c.project,encoding:'utf8',env:{...process.env,PATH:`${c.bin}:${process.env.PATH||''}`,M47_SOURCE_COMMIT:c.commit||'0123456789abcdef0123456789abcdef01234567',...extra}});}
function assertNoNewPass(c){const out=join(c.project,'m47-certified-artifacts-upload');assert.equal(existsSync(join(out,`${base}.zip`)),false);assert.equal(existsSync(join(out,`${base}-PASS.txt`)),false);}
{
  const c=prepare();try{installNpmStub(c,'exit 0');commitFixture(c);const r=run(c,{M47_SOURCE_COMMIT:'not-a-commit'});assert.notEqual(r.status,0);assert.match(`${r.stdout}${r.stderr}`,/invalid M47 source commit binding/i);assertNoNewPass(c);}finally{rmSync(c.sandbox,{recursive:true,force:true});}
}
{
  const c=prepare();try{installNpmStub(c,'echo simulated-release-failure >&2; exit 41');const out=join(c.project,'m47-certified-artifacts-upload');mkdirSync(out,{recursive:true});const prior=join(out,'prior-certified-sentinel.txt');writeFileSync(prior,'prior-certified-artifact\n');commitFixture(c);const r=run(c);assert.notEqual(r.status,0);assert.match(`${r.stdout}${r.stderr}`,/simulated-release-failure/);assert.equal(readFileSync(prior,'utf8'),'prior-certified-artifact\n');assertNoNewPass(c);}finally{rmSync(c.sandbox,{recursive:true,force:true});}
}
{
  const c=prepare();try{installNpmStub(c,`printf '%s\\n' 'mutated-during-gate' >> src/m47-certification-source.txt\nexit 0`);commitFixture(c);const r=run(c);assert.notEqual(r.status,0);assert.match(`${r.stdout}${r.stderr}`,/source tree changed during pre-certification gates/i);assertNoNewPass(c);}finally{rmSync(c.sandbox,{recursive:true,force:true});}
}
{
  const c=prepare();try{installNpmStub(c,'exit 0');writeFileSync(join(c.project,'verify-project.sh'),'#!/bin/sh\necho reached-post-state-gate\nexit 73\n');chmodSync(join(c.project,'verify-project.sh'),0o755);commitFixture(c);mkdirSync(join(c.project,'node_modules/.bin'),{recursive:true});writeFileSync(join(c.project,'node_modules/.bin/vite'),'#!/bin/sh\nexit 0\n');chmodSync(join(c.project,'node_modules/.bin/vite'),0o755);const r=run(c);const output=`${r.stdout}${r.stderr}`;assert.equal(r.status,73,`expected deliberate post-state sentinel failure\n${output}`);assert.match(output,/M47 certification tree parity: PASS/i);assert.match(output,/reached-post-state-gate/i);assertNoNewPass(c);}finally{rmSync(c.sandbox,{recursive:true,force:true});}
}
{
  const c=prepare();try{const alias=join(c.sandbox,'project-alias');fsSymlink(c.project,alias,'dir');const script=join('scripts/lib/stage-g-m47-certification-tree.mjs');const direct=spawnSync(process.execPath,[join(c.project,script),c.project],{encoding:'utf8'});const aliased=spawnSync(process.execPath,[join(alias,script),alias],{encoding:'utf8'});assert.equal(direct.status,0);assert.equal(aliased.status,0);assert.match(direct.stdout.trim(),/^[a-f0-9]{64}$/i);assert.equal(aliased.stdout.trim(),direct.stdout.trim());}finally{rmSync(c.sandbox,{recursive:true,force:true});}
}
console.log('Stage G M47 finalizer fail-closed verification: PASS (invalid binding, gate failure, prior-artifact preservation, source-drift rejection, deterministic staging parity, realpath-stable tree CLI)');
