import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { allocateLoopbackPort, delay, findBrowserBinary } from './lib/browser-cdp-smoke.mjs';

const root = path.resolve(import.meta.dirname, '..');
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const beforePackage = hash('package.json');
const beforeLock = hash('package-lock.json');

const bootstrap = spawnSync(process.execPath, ['scripts/ensure-modern-test-toolchain.mjs'], { cwd: root, stdio: 'inherit', shell: false });
if (bootstrap.error) throw bootstrap.error;
if (bootstrap.status !== 0) throw new Error(`Modern browser toolchain bootstrap failed with exit code ${bootstrap.status ?? 'unknown'}.`);

const browser = await findBrowserBinary();
const port = await allocateLoopbackPort();
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
if (!fs.existsSync(viteBin)) throw new Error('Vite binary is missing. Run npm ci before M30 browser tests.');
const vite = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
});
let output='';
vite.stdout.on('data',(chunk)=>{output=`${output}${chunk}`.slice(-32_768);});
vite.stderr.on('data',(chunk)=>{output=`${output}${chunk}`.slice(-32_768);});
const stop=()=>{if(vite.exitCode===null&&vite.signalCode===null)vite.kill('SIGTERM');};

try {
  const baseURL=`http://127.0.0.1:${port}`;
  let ready=false;
  for(let attempt=0;attempt<120;attempt+=1){
    try{const response=await fetch(`${baseURL}/`,{redirect:'manual'});if(response.ok){ready=true;break;}}catch{}
    await delay(50);
  }
  if(!ready)throw new Error(`M30 Playwright Vite server did not become ready.\n${output}`);
  const playwright=path.join(root,'node_modules','.bin','playwright');
  if(!fs.existsSync(playwright))throw new Error('Playwright binary is unavailable after M30 toolchain bootstrap.');
  const result=spawnSync(playwright,['test','--config','playwright.config.mjs','tests/modern/e2e/application-smoke.spec.mjs'],{
    cwd:root,
    stdio:'inherit',
    shell:false,
    env:{...process.env,WM_PLAYWRIGHT_BASE_URL:baseURL,WM_PLAYWRIGHT_EXECUTABLE_PATH:browser},
  });
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error(`M30 Playwright application smoke failed with exit code ${result.status??'unknown'}.`);
} finally {
  stop();
  await delay(100);
}

if(hash('package.json')!==beforePackage)throw new Error('M30 Playwright execution modified package.json.');
if(hash('package-lock.json')!==beforeLock)throw new Error('M30 Playwright execution modified package-lock.json.');
console.log('\nStage F M30 Playwright real-browser smoke: PASS (system Chromium-family executable; application lockfile preserved)');
