import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const prepublish=process.argv.includes('--prepublish');
const fail=m=>{console.error(`M82 ${prepublish?'prepublication':'certified'} package hygiene FAILED: ${m}`);process.exit(1)};
const run=(cmd,args,opts={})=>{const r=spawnSync(cmd,args,{encoding:'utf8',...opts});if(r.status!==0)fail(`${cmd} ${args.join(' ')} failed: ${(r.stderr||r.stdout||'').trim()}`);return r};
const verifyExtracted=(zip)=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'wm-m82-hygiene-'));
  try{
    run('unzip',['-q',zip,'-d',tmp]);
    const dirs=fs.readdirSync(tmp,{withFileTypes:true}).filter(e=>e.isDirectory());
    if(dirs.length!==1)fail('one root required');
    const project=path.join(tmp,dirs[0].name);
    const l=run('find',[project,'-type','l','-print','-quit']); if(l.stdout.trim())fail('symlink found');
    const e=run('find',[project,'-type','f','-name','.env*','!','-name','*.example','-print','-quit']); if(e.stdout.trim())fail('concrete env found');
    run(process.execPath,[path.join(project,'scripts/scan-secrets.mjs')],{cwd:project});
    run('sha256sum',['-c','CHECKSUMS.sha256'],{cwd:project});
  } finally { fs.rmSync(tmp,{recursive:true,force:true}); }
};

if(prepublish){
  const state=run(process.execPath,['scripts/verify-stage-i-m82-post-certification-state.mjs',root],{cwd:root});
  if(!state.stdout.includes('PASS'))fail('post-certification pending state is not valid');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'wm-m82-prepublish-'));
  try{
    const stage=path.join(tmp,'Work-Management-App-v1.43.2-Stage-I-M82-Prepublication-Candidate');
    fs.mkdirSync(stage,{recursive:true});
    const excludes=['.git','node_modules','dist','coverage','test-results','playwright-report','.wm-modern-test-toolchain'];
    for(let i=55;i<=82;i++)excludes.push(`m${i}-certified-artifacts-upload`);
    const args=['-a',...excludes.map(x=>`--exclude=${x}`),`${root}/`,`${stage}/`];
    run('rsync',args);
    run(process.execPath,[path.join(stage,'scripts/scan-secrets.mjs')],{cwd:stage});
    run('bash',['-lc',"find . -type f ! -name CHECKSUMS.sha256 -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > CHECKSUMS.sha256 && sha256sum -c CHECKSUMS.sha256 >/dev/null"],{cwd:stage});
    const zip=path.join(tmp,'M82-Prepublication-Candidate.zip');
    run('bash',['-lc',`cd ${JSON.stringify(tmp)} && zip -qry ${JSON.stringify(path.basename(zip))} ${JSON.stringify(path.basename(stage))}`]);
    run('unzip',['-t',zip]);
    verifyExtracted(zip);
    console.log('M82 prepublication checksum/package hygiene verification: PASS (temporary candidate only; no certified artifact/PASS record published)');
  } finally { fs.rmSync(tmp,{recursive:true,force:true}); }
} else {
  const zip=path.resolve(process.argv.find(a=>a.endsWith('.zip'))||path.join(root,'m82-certified-artifacts-upload','Work-Management-App-v1.43.2-Stage-I-M82-Certified-Baseline.zip'));
  if(!fs.existsSync(zip))fail('certified ZIP missing');
  verifyExtracted(zip);
  console.log('M82 certified package hygiene verification: PASS');
}
