import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { allocateLoopbackPort, delay } from './lib/browser-cdp-smoke.mjs';
const root=path.resolve(import.meta.dirname,'..');
const ensure=spawnSync(process.execPath,['scripts/ensure-stage-h-m77-browser-matrix.mjs'],{cwd:root,stdio:'inherit'});
if(ensure.error) throw ensure.error;
if(ensure.status!==0) throw new Error(`M77 browser provisioning failed with exit code ${ensure.status??'unknown'}.`);
const viteBin=path.join(root,'node_modules','vite','bin','vite.js');
const playwright=path.join(root,'node_modules','.bin','playwright');
if(!fs.existsSync(viteBin)||!fs.existsSync(playwright)) throw new Error('M77 browser matrix requires npm ci plus the governed Playwright toolchain.');
const port=await allocateLoopbackPort();
const vite=spawn(process.execPath,[viteBin,'--configLoader','native','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:['ignore','pipe','pipe'],env:{...process.env,VITE_RUNTIME_ENV:'ci',VITE_SUPABASE_URL:'https://m39-fixture.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_m77_final_ui_fixture'}});
let output='';vite.stdout.on('data',c=>{output=`${output}${c}`.slice(-32768)});vite.stderr.on('data',c=>{output=`${output}${c}`.slice(-32768)});
try{
  const baseURL=`http://127.0.0.1:${port}`;let ready=false;
  for(let i=0;i<180;i+=1){try{const r=await fetch(`${baseURL}/`,{redirect:'manual'});if(r.ok){ready=true;break}}catch{}await delay(50)}
  if(!ready) throw new Error(`M77 Vite server did not become ready.\n${output}`);
  const result=spawnSync(playwright,['test','--config','playwright.m77.config.mjs','tests/modern/e2e/final-ui-production-certification.spec.mjs'],{cwd:root,stdio:'inherit',env:{...process.env,WM_PLAYWRIGHT_BASE_URL:baseURL}});
  if(result.error) throw result.error;
  if(result.status!==0) throw new Error(`M77 cross-browser/device matrix failed with exit code ${result.status??'unknown'}.`);
}finally{if(vite.exitCode===null&&vite.signalCode===null)vite.kill('SIGTERM');await delay(100)}
console.log('M77 cross-device/cross-browser matrix: PASS (chromium, firefox, webkit × mobile/tablet/laptop/desktop)');
