/** M144 real-Chromium browser tests against actual wizard/parser/request builder and isolated service harness.
 * No hosted authentication or database connection. See M144 status report.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { allocateLoopbackPort, delay, findBrowserBinary } from './lib/browser-cdp-smoke.mjs';

const root=path.resolve(import.meta.dirname,'..');
const digest=(rel)=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex');
const oldPackage=digest('package.json'),oldLock=digest('package-lock.json');
const bootstrap=spawnSync(process.execPath,['scripts/ensure-modern-test-toolchain.mjs'],{cwd:root,stdio:'inherit',shell:false});
if(bootstrap.error)throw bootstrap.error;
if(bootstrap.status!==0)throw new Error(`M144 isolated test toolchain failed: ${bootstrap.status}`);
const browser=await findBrowserBinary();
const port=await allocateLoopbackPort();
const viteBin=path.join(root,'node_modules/vite/bin/vite.js');
if(!fs.existsSync(viteBin))throw new Error('Vite missing; run governed npm ci.');
const vite=spawn(process.execPath,[viteBin,'--host','127.0.0.1','--port',String(port),'--strictPort'],{
 cwd:root,stdio:['ignore','pipe','pipe'],env:{...process.env,VITE_SUPABASE_URL:'',VITE_SUPABASE_PUBLISHABLE_KEY:'',VITE_SUPABASE_ANON_KEY:''},
});
let output='';
for(const stream of [vite.stdout,vite.stderr])stream.on('data',part=>{output=(output+part).slice(-32768);});
try {
 const baseURL=`http://127.0.0.1:${port}`;
 let ready=false;
 for(let n=0;n<150;n++) {
  try {const resp=await fetch(`${baseURL}/tests/modern/e2e/m144-wizard-harness.html`,{redirect:'manual'});if(resp.ok){ready=true;break;}}catch{}
  await delay(60);
 }
 if(!ready)throw new Error(`M144 Vite browser harness failed to start: ${output}`);
 const playwright=path.join(root,'node_modules/.bin/playwright');
 if(!fs.existsSync(playwright))throw new Error('Playwright toolchain not installed.');
 const result=spawnSync(playwright,['test','--config','playwright.config.mjs','tests/modern/e2e/m144-wizard-acceptance.spec.mjs'],{
  cwd:root,stdio:'inherit',shell:false,env:{...process.env,WM_PLAYWRIGHT_BASE_URL:baseURL,WM_PLAYWRIGHT_EXECUTABLE_PATH:browser},
 });
 if(result.error)throw result.error;
 if(result.status!==0)throw new Error(`M144 wizard real-browser acceptance failed: ${result.status}`);
} finally {
 if(vite.exitCode===null&&vite.signalCode===null)vite.kill('SIGTERM');
 await delay(100);
}
if(digest('package.json')!==oldPackage||digest('package-lock.json')!==oldLock)throw new Error('M144 browser tests changed governed lockfile/package identity.');
console.log('PASS: M144 eight real-browser isolated wizard acceptance tests (NOT HOSTED AUTH CERTIFICATION)');
