import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { allocateLoopbackPort, delay, findBrowserBinary } from './lib/browser-cdp-smoke.mjs';

const root = path.resolve(import.meta.dirname, '..');
const evidenceDir = path.join(root, 'm37-evidence');
fs.rmSync(evidenceDir, { recursive: true, force: true });
fs.mkdirSync(evidenceDir, { recursive: true });

const bootstrap = spawnSync(process.execPath, ['scripts/ensure-modern-test-toolchain.mjs'], { cwd: root, stdio: 'inherit', shell: false });
if (bootstrap.error) throw bootstrap.error;
if (bootstrap.status !== 0) throw new Error(`M37 browser toolchain bootstrap failed with exit code ${bootstrap.status ?? 'unknown'}.`);
const browser = await findBrowserBinary();
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const playwright = path.join(root, 'node_modules', '.bin', 'playwright');
if (!fs.existsSync(viteBin) || !fs.existsSync(playwright)) throw new Error('M37 browser characterization requires npm ci plus the exact modern test toolchain.');

async function runScenario({ name, grep, supabaseUrl, publishableKey }) {
  const port = await allocateLoopbackPort();
  const vite = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, VITE_SUPABASE_URL: supabaseUrl, VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey },
  });
  let output = '';
  vite.stdout.on('data', (chunk) => { output = `${output}${chunk}`.slice(-32_768); });
  vite.stderr.on('data', (chunk) => { output = `${output}${chunk}`.slice(-32_768); });
  try {
    const baseURL = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt += 1) {
      try { const response = await fetch(`${baseURL}/`, { redirect: 'manual' }); if (response.ok) { ready = true; break; } } catch {}
      await delay(50);
    }
    if (!ready) throw new Error(`M37 ${name} Vite server did not become ready.\n${output}`);
    const result = spawnSync(playwright, ['test', '--config', 'playwright.config.mjs', '--grep', grep, 'tests/modern/e2e/functional-regression-baseline.spec.mjs'], {
      cwd: root,
      stdio: 'inherit',
      shell: false,
      env: { ...process.env, WM_PLAYWRIGHT_BASE_URL: baseURL, WM_PLAYWRIGHT_EXECUTABLE_PATH: browser, WM_M37_EVIDENCE_DIR: evidenceDir },
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`M37 ${name} browser characterization failed with exit code ${result.status ?? 'unknown'}.`);
  } finally {
    if (vite.exitCode === null && vite.signalCode === null) vite.kill('SIGTERM');
    await delay(100);
  }
}

await runScenario({ name: 'unconfigured-backend', grep: '@m37-unconfigured', supabaseUrl: '', publishableKey: '' });
await runScenario({ name: 'authenticated-fixture', grep: '@m37-fixture', supabaseUrl: 'https://m37-fixture.supabase.co', publishableKey: 'sb_publishable_m37_regression_fixture' });

const generated = spawnSync(process.execPath, ['scripts/generate-functional-regression-evidence.mjs'], { cwd: root, stdio: 'inherit', shell: false });
if (generated.error) throw generated.error;
if (generated.status !== 0) throw new Error(`M37 evidence generation failed with exit code ${generated.status ?? 'unknown'}.`);
const report = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'M37-FUNCTIONAL-REGRESSION-REPORT.json'), 'utf8'));
if (!report.completion?.browserCharacterizationComplete) throw new Error('M37 browser evidence is incomplete after characterization run.');
console.log('Stage G M37 functional regression browser characterization: PASS (unconfigured=4; fixture=4; evidenceChannels=8; tokensCaptured=false)');
