import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { allocateLoopbackPort, delay, findBrowserBinary } from './lib/browser-cdp-smoke.mjs';
const root=path.resolve(import.meta.dirname,'..');
const profile=process.argv[2];
if(!['auth','route','quality'].includes(profile)) throw Error('M145 browser profile must be auth, route or quality');
const bootstrap=spawnSync(process.execPath,['scripts/ensure-modern-test-toolchain.mjs'],{cwd:root,stdio:'inherit'});
if(bootstrap.error)throw bootstrap.error;
if(bootstrap.status!==0)throw Error(`M145 browser preflight failed: ${bootstrap.status}`);
const executable=await findBrowserBinary();
const viteBin=path.join(root,'node_modules/vite/bin/vite.js');
const playwright=path.join(root,'node_modules/.bin/playwright');
if(!fs.existsSync(viteBin)||!fs.existsSync(playwright))throw Error('M145 requires locked Vite/Playwright dependencies');
const port=await allocateLoopbackPort();
const vite=spawn(process.execPath,[viteBin,'--host','127.0.0.1','--port',String(port),'--strictPort'],{
  cwd:root,stdio:['ignore','pipe','pipe'],env:{...process.env,VITE_RUNTIME_ENV:'ci',VITE_SUPABASE_URL:'https://m39-fixture.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_m39_auth_fixture'}
});
let out='';for(const stream of [vite.stdout,vite.stderr])stream.on('data',chunk=>{out=(out+chunk).slice(-32768);});
const selected={
  auth:['--grep','@m145-auth'],
  route:['--grep','@m145-route'],
  quality:['--grep','@m145-quality'],
}[profile];
try{
  const url=`http://127.0.0.1:${port}`;let ready=false;
  for(let i=0;i<120;i++){try{const r=await fetch(url+'/');if(r.ok){ready=true;break;}}catch{}await delay(50);}
  if(!ready)throw Error(`Vite QA server unavailable: ${out}`);
  const result=spawnSync(playwright,['test','--config','playwright.config.mjs','tests/modern/e2e/m145-current-core.spec.mjs',...selected],{
    cwd:root,stdio:'inherit',shell:false,env:{...process.env,WM_PLAYWRIGHT_BASE_URL:url,WM_PLAYWRIGHT_EXECUTABLE_PATH:executable}
  });
  if(result.error)throw result.error;
  if(result.status!==0)throw Error(`M145 current-core ${profile} browser FAIL: ${result.status}`);
  console.log(`M145 current-core ${profile} synthetic browser: PASS (no production or database writes)`);
}finally{if(vite.exitCode===null&&vite.signalCode===null)vite.kill('SIGTERM');await delay(100);}
