import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const verifier='verify-stage-g-m50-rich-item-workspace-file-recovery.mjs';
const nodeArgs=['--experimental-strip-types','--disable-warning=ExperimentalWarning',verifier];
const run=(cwd,context)=>spawnSync(process.execPath,nodeArgs,{
  cwd,
  encoding:'utf8',
  env:{...process.env,WM_M50_PROVENANCE_CONTEXT:context},
});
const fail=(message,result)=>{
  if(result){
    process.stderr.write(result.stdout||'');
    process.stderr.write(result.stderr||'');
  }
  throw new Error(`M50 M49-certified provenance-context regression failed: ${message}`);
};
const expectPass=(cwd,context,label)=>{
  const result=run(cwd,context);
  if(result.status!==0) fail(`${label} must pass`,result);
};

const forceActivationState=(file,state)=>{
  const source=fs.readFileSync(file,'utf8');
  const next=source.replace(/activationState:\s*'[^']+'/m,`activationState: '${state}'`);
  if(next===source&&!source.includes(`activationState: '${state}'`)) fail(`could not force activation state ${state} in ${file}`);
  fs.writeFileSync(file,next);
};
const forceReleaseState=(file,state)=>{
  const source=fs.readFileSync(file,'utf8');
  let next=source;
  if(/\*\*State:\*\*\s*[^\n]+/m.test(source)) next=source.replace(/\*\*State:\*\*\s*[^\n]+/m,`**State:** ${state}`);
  else if(/^State:\s*[^\n]+/m.test(source)) next=source.replace(/^State:\s*[^\n]+/m,`State: ${state}`);
  const already=source.includes(`**State:** ${state}`)||source.includes(`State: ${state}`);
  if(next===source&&!already) fail(`could not force release state ${state} in ${file}`);
  fs.writeFileSync(file,next);
};
const expectFail=(cwd,context,label,expected)=>{
  const result=run(cwd,context);
  if(result.status===0) fail(`${label} must fail closed`,result);
  const output=`${result.stdout||''}\n${result.stderr||''}`;
  if(expected&&!output.includes(expected)) fail(`${label} failed for the wrong reason; expected ${expected}`,result);
};

expectPass(root,'repository-source','authoritative repository-source context');
expectFail(root,'m49-certified-artifact','artifact context against pending repository source','M49 certified-artifact context requires the staged M49 target to be active-certified.');
expectFail(root,'unknown-context','unknown provenance context','M50 provenance context must be repository-source, m49-certified-artifact, or m49-certified-artifact-current-source.');

const temp=fs.mkdtempSync(path.join(os.tmpdir(),'m50-m49-certified-context-'));
const staged=path.join(temp,'project');
const excluded=new Set(['node_modules','dist','coverage','test-results','playwright-report','.vite','.vitest','.wm-modern-test-toolchain','m37-evidence','m50-certified-artifacts-upload','m49-certified-artifacts-upload','.git','supabase/.temp']);
try{
  fs.cpSync(root,staged,{
    recursive:true,
    filter:(source)=>{
      const rel=path.relative(root,source).replaceAll('\\','/');
      if(!rel) return true;
      return ![...excluded].some((entry)=>rel===entry||rel.startsWith(`${entry}/`));
    },
  });
  const m49Target=path.join(staged,'config/stage-g-m49-boards-kanban-drag-drop-recovery-target.ts');
  const m49Status=path.join(staged,'RELEASE-STATUS-v1.43.2-STAGE-G-M49-BOARDS-KANBAN-DRAG-DROP-RECOVERY.md');
  const m50Target=path.join(staged,'config/stage-g-m50-rich-item-workspace-file-recovery-target.ts');

  // Historical M49 artifact context must be constructed explicitly, regardless of today's certified source states.
  forceActivationState(m49Target,'active-certified');
  forceReleaseState(m49Status,'active-certified');
  forceActivationState(m50Target,'implementation-complete-pending-certification');
  fs.appendFileSync(m49Status,'\n\n## Final certified baseline — 2026-09-23T00:00:00Z\n\nThe fail-closed M49 certification passed for source commit `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`. The packaged Boards Kanban & Drag/Drop Recovery state is **active-certified**.\n');

  expectFail(staged,'repository-source','repository context against active-certified staged M49 artifact','M49 repository source must retain its fail-closed pending-certification state.');
  expectPass(staged,'m49-certified-artifact','explicit historical M49 certified-artifact context');

  forceActivationState(m50Target,'active-certified');
  const m50Status=path.join(staged,'RELEASE-STATUS-v1.43.2-STAGE-G-M50-RICH-ITEM-WORKSPACE-FILE-RECOVERY.md');
  forceReleaseState(m50Status,'active-certified');
  expectFail(staged,'m49-certified-artifact','historical M49 artifact context with already-certified M50','Historical M49 certified-artifact context must keep M50 pending.');
  expectPass(staged,'m49-certified-artifact-current-source','current-source M49 certification preserves already-certified M50');
}finally{
  fs.rmSync(temp,{recursive:true,force:true});
}

console.log('Stage G M50 historical M49 certified-artifact provenance-context regression: PASS (repository=pending M49; historical artifact=pending M50; current-source artifact=certified M50; unknown/mixed states fail closed)');
