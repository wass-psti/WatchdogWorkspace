import { spawn } from 'node:child_process';
import net from 'node:net';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { delimiter, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

export async function findBrowserBinary() {
  const explicit = [process.env.BROWSER_BIN, process.env.CHROME_BIN, process.env.CHROMIUM_BIN]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  const platformCandidates = process.platform === 'darwin'
    ? [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        `${process.env.HOME || ''}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
        `${process.env.HOME || ''}/Applications/Chromium.app/Contents/MacOS/Chromium`,
      ]
    : process.platform === 'win32'
      ? [
          `${process.env.PROGRAMFILES || ''}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env['PROGRAMFILES(X86)'] || ''}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env.LOCALAPPDATA || ''}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env.PROGRAMFILES || ''}\\Microsoft\\Edge\\Application\\msedge.exe`,
          `${process.env['PROGRAMFILES(X86)'] || ''}\\Microsoft\\Edge\\Application\\msedge.exe`,
        ]
      : [
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser',
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable',
          '/usr/bin/microsoft-edge',
          '/usr/bin/microsoft-edge-stable',
        ];

  const pathNames = process.platform === 'win32'
    ? ['chrome.exe', 'chromium.exe', 'msedge.exe']
    : ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable', 'microsoft-edge', 'microsoft-edge-stable'];

  const pathDirectories = String(process.env.PATH || '').split(delimiter).filter(Boolean);
  const pathCandidates = pathDirectories.flatMap((directory) => pathNames.map((name) => resolve(directory, name)));
  const candidates = [...new Set([...explicit, ...platformCandidates, ...pathCandidates].filter(Boolean))];

  for (const candidate of candidates) {
    try {
      await access(candidate, process.platform === 'win32' ? constants.F_OK : constants.X_OK);
      return candidate;
    } catch {}
  }

  throw new Error([
    'No supported Chromium-based browser executable was found for the Vite smoke test.',
    'Install Google Chrome/Chromium/Microsoft Edge or set BROWSER_BIN to the executable path.',
    process.platform === 'darwin'
      ? 'Example: BROWSER_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run release:check'
      : 'Example: BROWSER_BIN=/path/to/chromium npm run release:check',
  ].join('\n'));
}

export const delay = (ms) => new Promise((resolveDelay) => {
  setTimeout(resolveDelay, ms);
});

export async function allocateLoopbackPort() {
  return new Promise((resolvePort, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Unable to allocate a loopback port.')));
        return;
      }
      server.close(() => resolvePort(address.port));
    });
  });
}

async function waitForChildExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return true;
  return new Promise((resolveWait) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.off('close', onClose);
      resolveWait(value);
    };
    const onClose = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);
    child.once('close', onClose);
  });
}

async function openDevToolsWebSocket(endpoint, browser, deadline, stderrText) {
  let target = null;
  while (Date.now() < deadline) {
    if (browser.exitCode !== null || browser.signalCode !== null) {
      throw new Error(`Chromium exited before its DevTools endpoint became available.\n${stderrText()}`);
    }
    try {
      const response = await fetch(`${endpoint}/json/list`, { signal: AbortSignal.timeout(750) });
      if (response.ok) {
        const rows = await response.json();
        target = Array.isArray(rows) ? rows.find((row) => row?.type === 'page' && row?.webSocketDebuggerUrl) : null;
        if (!target?.webSocketDebuggerUrl) {
          const createResponse = await fetch(`${endpoint}/json/new?about%3Ablank`, {
            method: 'PUT',
            signal: AbortSignal.timeout(750),
          }).catch(() => null);
          if (createResponse?.ok) {
            const created = await createResponse.json();
            if (created?.webSocketDebuggerUrl) target = created;
          }
        }
        if (target?.webSocketDebuggerUrl) break;
      }
    } catch {}
    await delay(50);
  }
  if (!target?.webSocketDebuggerUrl) {
    throw new Error(`Chromium DevTools startup timed out before a page target became available.\n${stderrText()}`);
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    let settled = false;
    const finish = (error = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      ws.removeEventListener('open', onOpen);
      ws.removeEventListener('error', onError);
      if (error) rejectOpen(error);
      else resolveOpen();
    };
    const onOpen = () => finish();
    const onError = () => finish(new Error('Chromium DevTools WebSocket failed to open.'));
    const remaining = Math.max(250, deadline - Date.now());
    const timer = setTimeout(() => finish(new Error('Chromium DevTools WebSocket open timed out.')), remaining);
    ws.addEventListener('open', onOpen, { once: true });
    ws.addEventListener('error', onError, { once: true });
  });
  return ws;
}

export async function captureBrowserDom(binary, url, { timeoutMs = 20_000, startupTimeoutMs = 15_000, ready, documentHtml = null } = {}) {
  const debugPort = await allocateLoopbackPort();
  const browserProfile = await mkdtemp(join(tmpdir(), 'wm-vite-browser-'));
  const browserArgs = [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-background-networking',
    '--no-proxy-server',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-address=127.0.0.1',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${browserProfile}`,
    'about:blank',
  ];
  const browser = spawn(binary, browserArgs, { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  browser.stderr.on('data', (chunk) => {
    stderr = `${stderr}${chunk}`.slice(-32_768);
  });
  const stderrText = () => stderr.trim();
  const startupDeadline = Date.now() + Math.max(1_000, startupTimeoutMs);
  let deadline = startupDeadline;
  let ws = null;
  let closeBrowserViaCdp = null;
  const pending = new Map();
  let sequence = 0;

  try {
    ws = await openDevToolsWebSocket(`http://127.0.0.1:${debugPort}`, browser, startupDeadline, stderrText);
    deadline = Date.now() + Math.max(250, timeoutMs);
    ws.addEventListener('message', (event) => {
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      if (!message?.id) return;
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      clearTimeout(request.timer);
      if (message.error) request.reject(new Error(message.error.message || 'Chromium DevTools command failed.'));
      else request.resolve(message.result);
    });

    const call = (method, params = {}) => {
      const id = ++sequence;
      return new Promise((resolveCall, rejectCall) => {
        const remaining = Math.max(250, Math.min(5_000, deadline - Date.now()));
        const timer = setTimeout(() => {
          pending.delete(id);
          rejectCall(new Error(`Chromium DevTools command timed out: ${method}`));
        }, remaining);
        pending.set(id, { resolve: resolveCall, reject: rejectCall, timer });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    closeBrowserViaCdp = async () => {
      await call('Browser.close');
    };

    const evaluate = async (expression) => {
      const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: false });
      if (result?.exceptionDetails) {
        const detail = result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Browser evaluation failed.';
        throw new Error(detail);
      }
      return result?.result?.value;
    };

    await call('Runtime.enable');
    await call('Page.enable');
    if (documentHtml !== null) {
      const frameTree = await call('Page.getFrameTree');
      const frameId = frameTree?.frameTree?.frame?.id;
      if (!frameId) throw new Error('Chromium DevTools did not expose a main-frame identifier.');
      await call('Page.setDocumentContent', { frameId, html: String(documentHtml) });
    } else {
      const navigation = await call('Page.navigate', { url });
      if (navigation?.errorText) throw new Error(`Chromium could not navigate to ${url}: ${navigation.errorText}`);
    }

    let lastDom = '';
    let lastState = null;
    while (Date.now() < deadline) {
      if (browser.exitCode !== null || browser.signalCode !== null) {
        throw new Error(`Chromium exited before the expected DOM state was reached.\n${stderrText()}`);
      }
      try {
        lastState = await evaluate(`({
          readyState: document.readyState,
          href: location.href,
          authView: document.querySelector('[data-wm-authentication-ui-view]')?.getAttribute('data-wm-authentication-ui-view') ?? null,
          authForm: document.querySelector('[data-wm-authentication-ui-form]')?.getAttribute('data-wm-authentication-ui-form') ?? null,
          appEmpty: Boolean(document.querySelector('#app:empty')),
        })`);
        lastDom = String(await evaluate('document.documentElement?.outerHTML ?? ""') || '');
        if (lastDom && (!ready || ready(lastDom, lastState))) return { dom: lastDom, state: lastState, stderr: stderrText() };
      } catch (error) {
        if (Date.now() + 100 >= deadline) throw error;
      }
      await delay(100);
    }

    throw new Error([
      `Browser DOM smoke timed out after ${timeoutMs}ms for ${url}.`,
      `Last observed state: ${JSON.stringify(lastState)}`,
      stderrText() ? `Chromium stderr:\n${stderrText()}` : '',
    ].filter(Boolean).join('\n'));
  } finally {
    for (const request of pending.values()) {
      clearTimeout(request.timer);
      request.reject(new Error('Chromium DevTools session closed.'));
    }
    pending.clear();
    if (closeBrowserViaCdp && browser.exitCode === null && browser.signalCode === null) {
      await Promise.race([
        closeBrowserViaCdp().catch(() => {}),
        delay(500),
      ]);
    }
    if (ws) {
      try { ws.close(); } catch {}
    }
    if (browser.exitCode === null && browser.signalCode === null) browser.kill('SIGTERM');
    if (!(await waitForChildExit(browser, 1_500)) && browser.exitCode === null && browser.signalCode === null) {
      browser.kill('SIGKILL');
      await waitForChildExit(browser, 1_000);
    }
    await rm(browserProfile, { recursive: true, force: true }).catch(() => {});
  }
}
