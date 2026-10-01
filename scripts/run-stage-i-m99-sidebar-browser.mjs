import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const host = '127.0.0.1';
const port = 5173;
const baseURL = `http://${host}:${port}`;
const readinessURL = `${baseURL}/#/`;
const startupTimeoutMs = 30_000;
const pollIntervalMs = 250;

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const waitForReady = async (child) => {
  const deadline = Date.now() + startupTimeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`M99 Vite server exited before readiness (code=${child.exitCode}).`);
    }

    try {
      const response = await fetch(readinessURL, { redirect: 'manual' });
      if (response.status >= 200 && response.status < 500) return;
    } catch (error) {
      lastError = error;
    }

    await sleep(pollIntervalMs);
  }

  const detail = lastError instanceof Error ? ` Last error: ${lastError.message}` : '';
  throw new Error(`Timed out waiting for M99 Vite server at ${readinessURL}.${detail}`);
};

const terminate = async (child) => {
  if (!child || child.exitCode !== null) return;

  child.kill('SIGTERM');
  const deadline = Date.now() + 5_000;
  while (child.exitCode === null && Date.now() < deadline) await sleep(100);
  if (child.exitCode === null) child.kill('SIGKILL');
};

const ensurePlaywright = () => {
  const playwright = path.join(root, 'node_modules', '.bin', 'playwright');
  if (!fs.existsSync(playwright)) {
    throw new Error('Playwright is unavailable. Run the governed modern test-toolchain bootstrap before the M99 browser gate.');
  }
  return playwright;
};

let server;
try {
  const playwright = ensurePlaywright();

  server = spawn(
    process.execPath,
    [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), '--host', host, '--port', String(port), '--strictPort'],
    {
      cwd: root,
      stdio: ['ignore', 'inherit', 'inherit'],
      env: {
        ...process.env,
        VITE_RUNTIME_ENV: 'ci',
        VITE_SUPABASE_URL: 'https://m39-fixture.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_m99_sidebar_fixture',
      },
    },
  );

  server.on('error', (error) => {
    console.error(`M99 Vite server process error: ${error.message}`);
  });

  await waitForReady(server);
  console.log(`M99 browser server readiness: PASS (${readinessURL})`);

  const browser = spawn(
    playwright,
    ['test', 'tests/modern/e2e/m99-sidebar-interaction-containment.spec.mjs'],
    {
      cwd: root,
      stdio: 'inherit',
      env: {
        ...process.env,
        WM_PLAYWRIGHT_BASE_URL: baseURL,
      },
    },
  );

  const browserStatus = await new Promise((resolve, reject) => {
    browser.once('error', reject);
    browser.once('close', (code, signal) => resolve({ code, signal }));
  });

  if (browserStatus.code !== 0) {
    throw new Error(
      `M99 Playwright browser gate failed (code=${browserStatus.code ?? 'null'}, signal=${browserStatus.signal ?? 'none'}).`,
    );
  }

  console.log('M99 sidebar browser/E2E execution: PASS');
} finally {
  await terminate(server);
}
