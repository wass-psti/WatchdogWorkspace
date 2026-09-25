import assert from 'node:assert/strict';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync as fsSymlink, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root=resolve(import.meta.dirname,'..');
const base='Work-Management-App-v1.43.2-Stage-G-M49-Certified-Baseline';
function prepare(){
  const sandbox=mkdtempSync(join(tmpdir(),'wm-m49-finalizer-')); const project=join(sandbox,'project'); const bin=join(sandbox,'bin');
  for(const d of ['scripts/lib','config','src'])mkdirSync(join(project,d),{recursive:true}); mkdirSync(bin,{recursive:true});
  for(const file of [
    'scripts/finalize-stage-g-m49.sh',
    'scripts/lib/stage-g-m49-certification-tree.mjs',
    'config/stage-g-m49-boards-kanban-drag-drop-recovery-target.ts',
    'config/stage-g-m48-boards-columns-cells-status-recovery-target.ts',
    'config/stage-g-m46-board-backend-contract.ts',
    'RELEASE-STATUS-v1.43.2-STAGE-G-M49-BOARDS-KANBAN-DRAG-DROP-RECOVERY.md',
  ]) { const dest=join(project,file); mkdirSync(join(dest,'..'),{recursive:true}); cpSync(join(root,file),dest); }
  for(const [file,body] of [
    ['verify-stage-g-m49-boards-kanban-drag-drop-recovery.mjs','process.exit(0);\n'],
    ['verify-stage-g-m48-boards-columns-cells-status-system-recovery.mjs','process.exit(0);\n'],
    ['scripts/verify-stage-g-m49-production-boundary.mjs','process.exit(0);\n'],
    ['scripts/verify-stage-g-m47-production-invariants.mjs','process.exit(0);\n'],
    ['scripts/verify-stage-g-m46-production-contract.mjs','process.exit(0);\n'],
    ['scripts/verify-stage-g-m49-certified-artifact.mjs','process.exit(0);\n'],
    ['scripts/scan-secrets.mjs','process.exit(0);\n'],
    ['verify-project.sh','#!/bin/sh\nexit 0\n'],
  ]) { const p=join(project,file); mkdirSync(join(p,'..'),{recursive:true}); writeFileSync(p,body); if(file.endsWith('.sh'))chmodSync(p,0o755); }
  writeFileSync(join(project,'src/m49-certification-source.txt'),'stable-source\n');
  writeFileSync(join(project,'src/m49-executable-fixture.sh'),'#!/bin/sh\nexit 0\n'); chmodSync(join(project,'src/m49-executable-fixture.sh'),0o755);
  try{fsSymlink('m49-certification-source.txt',join(project,'src/m49-source-link'));}catch{}
  return {sandbox,project,bin};
}
function commitFixture(c){
  const git=(...args)=>spawnSync('git',args,{cwd:c.project,encoding:'utf8'});
  for(const args of [['init','-q'],['config','user.name','M49 Finalizer Fixture'],['config','user.email','m49-fixture@example.invalid'],['add','-A'],['commit','-qm','fixture']]){const r=git(...args);assert.equal(r.status,0,`git ${args.join(' ')} failed: ${r.stderr||r.stdout}`);}
  const rev=git('rev-parse','HEAD');assert.equal(rev.status,0);c.commit=rev.stdout.trim();return c.commit;
}
function installNpmStub(c,body){const p=join(c.bin,'npm');writeFileSync(p,`#!/bin/sh\n${body}\n`);chmodSync(p,0o755);}
function run(c,extra={}){return spawnSync('bash',['scripts/finalize-stage-g-m49.sh'],{cwd:c.project,encoding:'utf8',env:{...process.env,PATH:`${c.bin}:${process.env.PATH||''}`,M49_SOURCE_COMMIT:c.commit||'0123456789abcdef0123456789abcdef01234567',...extra}});}
function assertNoNewPass(c){const out=join(c.project,'m49-certified-artifacts-upload');assert.equal(existsSync(join(out,`${base}.zip`)),false);assert.equal(existsSync(join(out,`${base}-PASS.txt`)),false);}

{
  const c=prepare();try{installNpmStub(c,'exit 0');commitFixture(c);const r=run(c,{M49_SOURCE_COMMIT:'not-a-commit'});assert.notEqual(r.status,0);assert.match(`${r.stdout}${r.stderr}`,/invalid M49 source commit binding/i);assertNoNewPass(c);}finally{rmSync(c.sandbox,{recursive:true,force:true});}
}
{
  const c=prepare();try{installNpmStub(c,'echo simulated-release-failure >&2; exit 41');const out=join(c.project,'m49-certified-artifacts-upload');mkdirSync(out,{recursive:true});const prior=join(out,'prior-certified-sentinel.txt');writeFileSync(prior,'prior-certified-artifact\n');commitFixture(c);const r=run(c);assert.notEqual(r.status,0);assert.match(`${r.stdout}${r.stderr}`,/simulated-release-failure/);assert.equal(readFileSync(prior,'utf8'),'prior-certified-artifact\n');assertNoNewPass(c);}finally{rmSync(c.sandbox,{recursive:true,force:true});}
}
{
  const c=prepare();try{installNpmStub(c,`printf '%s\\n' 'mutated-during-gate' >> src/m49-certification-source.txt\nexit 0`);commitFixture(c);const r=run(c);assert.notEqual(r.status,0);assert.match(`${r.stdout}${r.stderr}`,/source tree changed during pre-certification gates/i);assertNoNewPass(c);}finally{rmSync(c.sandbox,{recursive:true,force:true});}
}
{
  const c=prepare();try{installNpmStub(c,'exit 0');writeFileSync(join(c.project,'verify-project.sh'),'#!/bin/sh\necho reached-post-state-gate\nexit 73\n');chmodSync(join(c.project,'verify-project.sh'),0o755);commitFixture(c);mkdirSync(join(c.project,'node_modules/.bin'),{recursive:true});writeFileSync(join(c.project,'node_modules/.bin/vite'),'#!/bin/sh\nexit 0\n');chmodSync(join(c.project,'node_modules/.bin/vite'),0o755);const r=run(c);const output=`${r.stdout}${r.stderr}`;assert.equal(r.status,73,`expected deliberate post-state sentinel failure\n${output}`);assert.match(output,/M49 certification tree parity: PASS/i);assert.match(output,/reached-post-state-gate/i);assertNoNewPass(c);}finally{rmSync(c.sandbox,{recursive:true,force:true});}
}
{
  const sandbox=mkdtempSync(join(tmpdir(),'wm-m49-active-static-'));
  const staged=join(sandbox,'active-certified');
  try {
    const excluded=new Set(['.git','node_modules','dist','coverage','test-results','playwright-report','.vite','.vitest','.wm-modern-test-toolchain','m37-evidence','m49-certified-artifacts-upload']);
    cpSync(root,staged,{recursive:true,filter:(source)=>{
      const rel=relative(root,source);
      if(!rel)return true;
      return !rel.split(/[\\/]/).some((part)=>excluded.has(part));
    }});
    const target=join(staged,'config/stage-g-m49-boards-kanban-drag-drop-recovery-target.ts');
    const status=join(staged,'RELEASE-STATUS-v1.43.2-STAGE-G-M49-BOARDS-KANBAN-DRAG-DROP-RECOVERY.md');
    writeFileSync(target,readFileSync(target,'utf8').replace("activationState: 'implementation-complete-pending-certification'","activationState: 'active-certified'"));
    writeFileSync(status,readFileSync(status,'utf8').replace('**State:** implementation-complete-pending-certification','**State:** active-certified')+'\n\n## Final certified baseline — fixture\n\nPost-promotion verifier fixture.\n');
    const r=spawnSync(process.execPath,['--experimental-strip-types','--disable-warning=ExperimentalWarning','verify-stage-g-m49-boards-kanban-drag-drop-recovery.mjs'],{cwd:staged,encoding:'utf8'});
    assert.equal(r.status,0,`active-certified staged static verifier failed:\n${r.stdout}${r.stderr}`);
    assert.match(r.stdout,/Stage G M49 static recovery verification: PASS/);
  } finally { rmSync(sandbox,{recursive:true,force:true}); }
}
{
  const c=prepare();try{const alias=join(c.sandbox,'project-alias');fsSymlink(c.project,alias,'dir');const script=join('scripts/lib/stage-g-m49-certification-tree.mjs');const direct=spawnSync(process.execPath,[join(c.project,script),c.project],{encoding:'utf8'});const aliased=spawnSync(process.execPath,[join(alias,script),alias],{encoding:'utf8'});assert.equal(direct.status,0);assert.equal(aliased.status,0);assert.match(direct.stdout.trim(),/^[a-f0-9]{64}$/i);assert.equal(aliased.stdout.trim(),direct.stdout.trim());}finally{rmSync(c.sandbox,{recursive:true,force:true});}
}

{
  const finalizer=readFileSync(join(root,'scripts/finalize-stage-g-m49.sh'),'utf8');
  assert.match(finalizer,/WM_M50_PROVENANCE_CONTEXT='m49-certified-artifact-current-source'/,'M49 finalizer must distinguish a current-source historical certification transaction from a reconstructed historical M49-only artifact.');
}
console.log('Stage G M49 finalizer fail-closed verification: PASS (invalid binding, gate failure, prior-artifact preservation, source-drift rejection, deterministic staging parity, active-certified staged static verifier, explicit current-source M50 provenance, realpath-stable tree CLI)');
