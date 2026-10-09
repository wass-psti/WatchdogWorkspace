import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_WORKSPACE_URL = 'https://wass-psti.github.io/WatchdogWorkspace/';
const DEFAULT_SUPABASE_URL = 'https://jtlusodorfnyzgyuewkz.supabase.co';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_CrkvaTRYTYAMVbieywNMyg_a0F7HpB6';
const WORKSPACE_SESSION_KEY = 'wm.platform.auth.session.v1';
const WORKSPACE_IDENTITY_KEY = 'wm.platform.identity.v1';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function parseSession(raw) {
  if (!raw) return null;
  let session;
  try { session = JSON.parse(raw); }
  catch { throw new Error('MT_E2E_SESSION_JSON is not valid JSON.'); }
  if (!session?.access_token || !session?.user?.id) {
    throw new Error('E2E session must include access_token and user.id.');
  }
  return session;
}

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  return candidates.find(p => fs.existsSync(p)) || null;
}

async function waitForDevtools(port) {
  for (let i = 0; i < 80; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return await response.json();
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome DevTools endpoint unavailable.');
}

async function createCdpClient(port, url) {
  const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method) events.push(message);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };
  const send = (method, params = {}) => new Promise(resolve => {
    const next = ++id;
    pending.set(next, resolve);
    ws.send(JSON.stringify({ id: next, method, params }));
  });
  return { ws, send, events };
}

async function evaluate(send, expression) {
  const response = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text || 'Browser evaluation failed.');
  }
  return response.result?.result?.value;
}

const SESSION_SCAN_EXPRESSION = `(() => {
  try {
    const sessionRaw = localStorage.getItem(${JSON.stringify(WORKSPACE_SESSION_KEY)});
    const identityRaw = localStorage.getItem(${JSON.stringify(WORKSPACE_IDENTITY_KEY)});
    if (!sessionRaw || !identityRaw) return null;
    const authSession = JSON.parse(sessionRaw);
    const identity = JSON.parse(identityRaw);
    const user = identity && identity.user;
    if (!authSession || typeof authSession.access_token !== 'string' || !user || typeof user.id !== 'string') return null;
    return {
      ...authSession,
      user: {
        id: user.id,
        email: typeof user.email === 'string' ? user.email : null,
        user_metadata: {
          full_name: typeof user.displayName === 'string' ? user.displayName : undefined,
          name: typeof user.displayName === 'string' ? user.displayName : undefined
        }
      }
    };
  } catch {
    return null;
  }
})()`;

async function scanWorkspaceSession(port, workspaceOrigin) {
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  for (const page of pages.filter(item => item.type === 'page' && item.webSocketDebuggerUrl)) {
    if (!String(page.url || '').startsWith(workspaceOrigin)) continue;
    const pageWs = new WebSocket(page.webSocketDebuggerUrl);
    try {
      await new Promise((resolve, reject) => { pageWs.onopen = resolve; pageWs.onerror = reject; });
      const response = await new Promise((resolve, reject) => {
        const requestId = 1;
        const timer = setTimeout(() => reject(new Error('Session scan timeout')), 3000);
        pageWs.onmessage = event => {
          const msg = JSON.parse(event.data);
          if (msg.id === requestId) { clearTimeout(timer); resolve(msg); }
        };
        pageWs.send(JSON.stringify({
          id: requestId,
          method: 'Runtime.evaluate',
          params: { expression: SESSION_SCAN_EXPRESSION, returnByValue: true },
        }));
      });
      const session = response.result?.result?.value;
      if (session?.access_token && session?.user?.id) return session;
    } catch {} finally {
      try { pageWs.close(); } catch {}
    }
  }
  return null;
}

async function acquireWorkspaceSession(chrome, port, profile) {
  const workspaceUrl = process.env.MT_E2E_WORKSPACE_URL || DEFAULT_WORKSPACE_URL;
  const timeoutMs = Number(process.env.MT_E2E_AUTH_TIMEOUT_MS || 300000);
  const workspaceOrigin = new URL(workspaceUrl).origin;

  console.log('No MT_E2E_SESSION_JSON supplied.');
  console.log('Opening the live WatchdogWorkspace authentication UI.');
  console.log(`Workspace: ${workspaceUrl}`);
  console.log('If redirected to #/login, sign in there using your existing Work Management account.');
  console.log('Enter credentials only in the Workspace browser page; this test never reads them from Terminal.');
  console.log('GitHub authentication is not expected by this gate because the deployed Workspace login uses Supabase email/password authentication.');

  const proc = spawn(chrome, [
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-popup-blocking',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    workspaceUrl,
  ], { stdio: 'ignore' });

  try {
    await waitForDevtools(port);
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const session = await scanWorkspaceSession(port, workspaceOrigin);
      if (session) return { session, chromeProcess: proc };
      await sleep(750);
    }
    throw new Error(`Timed out after ${Math.round(timeoutMs / 1000)} seconds waiting for an authenticated WatchdogWorkspace session.`);
  } catch (error) {
    proc.kill('SIGTERM');
    throw error;
  }
}

async function validateSession(session) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_PUBLISHABLE_KEY;
  const response = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/user`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Supabase rejected the WatchdogWorkspace browser session (${response.status}).`);
  }
  const user = await response.json();
  if (!user?.id || user.id !== session.user.id) {
    throw new Error('Supabase session user identity mismatch.');
  }
  console.log(`PASS: authenticated WatchdogWorkspace/Supabase session verified for user ${user.id}.`);
}


async function validateImportPreflight(session) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_PUBLISHABLE_KEY;
  const workspaceId = process.env.MT_E2E_WORKSPACE_ID || '00000000-0000-4000-8000-000000000001';
  const marker = `E2E-PREFLIGHT-${Date.now()}`;
  const response = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/rpc/material_tracker_import_preflight`, {
    method: 'POST',
    headers: { apikey: publishableKey, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p_workspace_id: workspaceId,
      p_mode: 'create',
      p_rows: [{ rowNumber: 2, id: null, name: marker, groupId: 'topics', payload: { sourceType: 'Local', materialDescription: 'Authenticated preflight verification', brand: 'Certification', quantity: 1, buyingPrice: 1, currency: 'PHP' } }],
    }),
  });
  if (!response.ok) throw new Error(`Import preflight RPC rejected authenticated E2E request (${response.status}).`);
  const result = await response.json();
  if (result?.rows?.[0]?.status !== 'valid' || !result?.fingerprint) throw new Error('Import preflight RPC returned an invalid certification response.');
  console.log('PASS: authenticated import preflight RPC validated without database mutation.');
}

async function runPreviewE2E(chrome, port, profile, session, chromeProcess = null) {
  if (!fs.existsSync('dist/index.html')) {
    throw new Error('Production dist/index.html is missing. Run npm run build before browser E2E.');
  }

  const workspaceId = process.env.MT_E2E_WORKSPACE_ID || null;
  const viteBin = process.platform === 'win32'
    ? path.resolve('node_modules/.bin/vite.cmd')
    : path.resolve('node_modules/.bin/vite');
  const preview = spawn(
    viteBin,
    ['preview', '--host', '127.0.0.1', '--port', '4176'],
    { cwd: path.resolve('.'), stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, VITE_MATERIAL_TRACKER_WORKSPACE_ID: workspaceId || '00000000-0000-4000-8000-000000000001' } }
  );
  let ready = false;
  preview.stdout.on('data', d => { const text = String(d); process.stdout.write(text); if (text.includes('4176')) ready = true; });
  preview.stderr.on('data', d => process.stderr.write(d));

  try {
    for (let i = 0; i < 80 && !ready; i++) await sleep(250);
    if (!ready) throw new Error('Vite preview did not become ready.');

    let proc = chromeProcess;
    if (!proc) {
      proc = spawn(chrome, [
        '--headless=new', '--no-first-run', '--no-default-browser-check',
        `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'
      ], { stdio: 'ignore' });
      await waitForDevtools(port);
    }

    try {
      const client = await createCdpClient(port, 'about:blank');
      const { ws, send, events } = client;
      await send('Page.enable');
      await send('Runtime.enable');
      const hostContext = { session, ...(workspaceId ? { workspaceId } : {}) };
      await send('Page.addScriptToEvaluateOnNewDocument', {
        source: `globalThis.__WATCHDOG_WORKSPACE__=${JSON.stringify(hostContext)};`
      });
      await send('Page.navigate', { url: 'http://127.0.0.1:4176/' });

      let value = {};
      for (let i = 0; i < 50; i++) {
        await sleep(500);
        value = await evaluate(send, `({text:document.body.innerText.slice(0,12000),title:document.title,url:location.href})`) || {};
        const text = value.text || '';
        if (/Material Tracker could not initialize/i.test(text)) throw new Error(`Material Tracker bootstrap error: ${text}`);
        if (text.trim() && !/Loading Material Tracker/i.test(text)) break;
      }

      const exceptions = events
        .filter(message => message.method === 'Runtime.exceptionThrown')
        .map(message => message.params?.exceptionDetails?.text || 'Runtime exception');

      if (!(value.text || '').trim()) throw new Error('Material Tracker rendered an empty document.');
      if (/Loading Material Tracker/i.test(value.text || '')) throw new Error('Material Tracker remained in loading state during authenticated browser E2E.');
      if (exceptions.length) throw new Error(`Browser runtime exception: ${exceptions[0]}`);

      console.log('PASS: production preview rendered Material Tracker with the real authenticated WatchdogWorkspace Supabase session.');
      ws.close();
    } finally {
      proc.kill('SIGTERM');
    }
  } finally {
    preview.kill('SIGTERM');
  }
}

let session = parseSession(process.env.MT_E2E_SESSION_JSON);
const chrome = findChrome();
if (!chrome) {
  console.error('Chrome/Chromium not found. Set CHROME_BIN.');
  process.exit(2);
}

const port = Number(process.env.MT_E2E_DEBUG_PORT || 9333);
const profile = process.env.MT_E2E_CHROME_PROFILE || path.join(os.tmpdir(), `frt-e2e-${Date.now()}`);
let chromeProcess = null;

try {
  if (!session) {
    const acquired = await acquireWorkspaceSession(chrome, port, profile);
    session = acquired.session;
    chromeProcess = acquired.chromeProcess;
  }
  await validateSession(session);
  await validateImportPreflight(session);
  await runPreviewE2E(chrome, port, profile, session, chromeProcess);
} catch (error) {
  console.error(`Browser E2E failed: ${error.message}`);
  process.exit(2);
}
