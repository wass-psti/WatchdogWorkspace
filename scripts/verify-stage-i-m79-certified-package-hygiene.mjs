import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
const root=process.cwd();
const zip=path.resolve(process.argv[2]||path.join(root,'m79-certified-artifacts-upload','Work-Management-App-v1.43.2-Stage-I-M79-Certified-Baseline.zip'));
const fail=(message)=>{console.error(`M79 certified package hygiene FAILED: ${message}`);process.exit(1)};
if(!fs.existsSync(zip))fail(`missing certified ZIP: ${zip}`);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'wm-m79-hygiene-'));
try{
 const unzip=spawnSync('unzip',['-q',zip,'-d',tmp],{encoding:'utf8'}); if(unzip.status!==0)fail(unzip.stderr||'unable to extract certified ZIP');
 const dirs=fs.readdirSync(tmp,{withFileTypes:true}).filter(e=>e.isDirectory()); if(dirs.length!==1)fail('certified ZIP must contain one root directory');
 const project=path.join(tmp,dirs[0].name);
 const symlink=spawnSync('find',[project,'-type','l','-print','-quit'],{encoding:'utf8'}); if(symlink.stdout.trim())fail(`symbolic link found in payload: ${symlink.stdout.trim()}`);
 const envFile=spawnSync('find',[project,'-type','f','-name','.env*','!','-name','*.example','-print','-quit'],{encoding:'utf8'}); if(envFile.stdout.trim())fail(`concrete environment file found in payload: ${envFile.stdout.trim()}`);
 const secret=spawnSync(process.execPath,[path.join(project,'scripts/scan-secrets.mjs')],{cwd:project,encoding:'utf8'}); if(secret.status!==0)fail(secret.stderr||secret.stdout||'secret scan failed');
 const sums=spawnSync('sha256sum',['-c','CHECKSUMS.sha256'],{cwd:project,encoding:'utf8'}); if(sums.status!==0)fail('checksum manifest validation failed');
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
console.log('M79 certified package hygiene verification: PASS');
