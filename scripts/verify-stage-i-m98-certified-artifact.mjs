import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import process from 'node:process';

const artifact=process.argv[2] || 'm98-certified-artifacts-upload/Work-Management-App-v1.43.2-Stage-I-M98-Certified-Baseline.zip';
const fail=(message)=>{console.error(`M98 certified artifact verification FAILED: ${message}`);process.exit(1)};
if(!fs.existsSync(artifact)) fail('missing zip');
const zipSha=crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex');
const test=spawnSync('unzip',['-tq',artifact],{stdio:'inherit'}); if(test.status!==0) fail('ZIP integrity test failed');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'m98-certified-'));
try {
  const unzip=spawnSync('unzip',['-q',path.resolve(artifact),'-d',tmp],{stdio:'inherit'}); if(unzip.status!==0) fail('ZIP extraction failed');
  const checks=path.join(tmp,'CHECKSUMS.sha256'); if(!fs.existsSync(checks)) fail('internal CHECKSUMS.sha256 missing');
  const verify=spawnSync('shasum',['-a','256','-c','CHECKSUMS.sha256'],{cwd:tmp,stdio:'ignore'}); if(verify.status!==0) fail('internal repository checksum verification failed');
  const attestation=path.join(tmp,'m98-browser-evidence','M98-BROWSER-ATTESTATION.json'); if(!fs.existsSync(attestation)) fail('M98 browser attestation missing from artifact');
  const screenshotManifest=path.join(tmp,'m97-browser-evidence','M97-SCREENSHOT-MANIFEST.json'); if(!fs.existsSync(screenshotManifest)) fail('M97 screenshot evidence manifest missing from artifact');
  const m=JSON.parse(fs.readFileSync(screenshotManifest,'utf8')); if(m.screenshotCount!==84) fail('published screenshot count is not 84');
} finally { fs.rmSync(tmp,{recursive:true,force:true}); }
console.log(`M98 certified artifact verification: PASS (zipSha=${zipSha}; internalChecksums=PASS; screenshots=84; browserAttestation=PASS)`);
