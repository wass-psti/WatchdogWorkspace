import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import { findBrowserBinary } from './lib/browser-cdp-smoke.mjs';
const root=path.resolve(import.meta.dirname,'..'); const url=(process.env.WM_M54_PRODUCTION_URL||'').trim(); const email=(process.env.WM_M54_E2E_ADMIN_EMAIL||'').trim(); const password=process.env.WM_M54_E2E_ADMIN_PASSWORD||'';
if(!/^https:\/\//.test(url)) throw new Error('WM_M54_PRODUCTION_URL must be the HTTPS GitHub Pages deployment URL.'); if(!email||!password) throw new Error('WM_M54_E2E_ADMIN_EMAIL and WM_M54_E2E_ADMIN_PASSWORD are required for live authenticated production verification.');
const base=url.replace(/\/?$/,'/');
for(const resource of ['', 'service-worker.js', 'manifest.webmanifest']) {
  const response=await fetch(new URL(resource,base),{redirect:'follow'});
  if(!response.ok) throw new Error(`M54 production HTTP smoke failed for ${resource||'index'}: HTTP ${response.status}.`);
  const text=await response.text();
  if(resource==='service-worker.js'&&!text.includes('work-management-v1.43.2')) throw new Error('M54 production service worker does not carry the expected v1.43.2 cache identity.');
}
console.log(`M54 live HTTP artifact smoke: PASS (${base})`);
const bootstrap=spawnSync(process.execPath,['scripts/ensure-modern-test-toolchain.mjs'],{cwd:root,stdio:'inherit'}); if(bootstrap.status!==0) throw new Error('M54 modern test toolchain bootstrap failed.'); const browser=await findBrowserBinary(); const playwright=path.join(root,'node_modules','.bin','playwright'); if(!fs.existsSync(playwright)) throw new Error('M54 live production E2E requires the exact Playwright toolchain.');
const result=spawnSync(playwright,['test','--config','playwright.config.mjs','tests/modern/e2e/functional-production-readiness-live.spec.mjs'],{cwd:root,stdio:'inherit',env:{...process.env,WM_PLAYWRIGHT_BASE_URL:url,WM_PLAYWRIGHT_EXECUTABLE_PATH:browser,WM_M54_E2E_ADMIN_EMAIL:email,WM_M54_E2E_ADMIN_PASSWORD:password}}); if(result.error) throw result.error; if(result.status!==0) throw new Error(`M54 live authenticated production E2E failed with exit code ${result.status??'unknown'}.`); console.log(`Stage G M54 live authenticated production workflows: PASS (${url})`);
