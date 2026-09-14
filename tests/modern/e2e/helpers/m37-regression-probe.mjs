import fs from 'node:fs';
import path from 'node:path';

const REDACT_KEYS = /access_token|refresh_token|authorization|apikey|password/i;
const BODY_LIMIT = 2048;

const sanitizeString = (value) => String(value)
  .replace(/Bearer\s+[^\s,;]+/gi, 'Bearer [redacted]')
  .replace(/sb_(?:publishable|secret)_[A-Za-z0-9._-]+/g, 'sb_[redacted]')
  .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted-jwt]')
  .replace(/m37\.fixture\.access\.token/g, '[redacted-access-token]')
  .replace(/m37-fixture-refresh-token/g, '[redacted-refresh-token]');

const sanitize = (value, depth = 0) => {
  if (depth > 8) return '[depth-limited]';
  if (Array.isArray(value)) return value.slice(0, 40).map((item) => sanitize(item, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = REDACT_KEYS.test(key) ? '[redacted]' : sanitize(item, depth + 1);
    return out;
  }
  if (typeof value === 'string') {
    const cleaned = sanitizeString(value);
    return cleaned.length > BODY_LIMIT ? `${cleaned.slice(0, BODY_LIMIT)}…` : cleaned;
  }
  return value;
};

const safeJson = (text) => {
  const bounded = String(text ?? '').slice(0, BODY_LIMIT);
  try { return sanitize(JSON.parse(bounded)); }
  catch { return bounded; }
};

export function createRegressionProbe(page, scenario) {
  const evidence = {
    schemaVersion: 1,
    milestone: 37,
    scenario,
    startedAt: new Date().toISOString(),
    console: [],
    pageErrors: [],
    requests: [],
    requestFailures: [],
    backendResponses: [],
    snapshots: [],
  };

  page.on('console', (message) => {
    if (['error', 'warning', 'warn'].includes(message.type())) {
      evidence.console.push({ type: message.type(), text: message.text().slice(0, BODY_LIMIT) });
    }
  });
  page.on('pageerror', (error) => evidence.pageErrors.push({ name: error.name, message: String(error.message || error).slice(0, BODY_LIMIT), stack: String(error.stack || '').slice(0, 4096) }));
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname.endsWith('.supabase.co')) evidence.requests.push({ method: request.method(), path: `${url.pathname}${url.search}`, resourceType: request.resourceType() });
  });
  page.on('requestfailed', (request) => {
    const url = new URL(request.url());
    evidence.requestFailures.push({ method: request.method(), origin: url.origin, path: `${url.pathname}${url.search}`, failure: request.failure()?.errorText || 'unknown' });
  });
  page.on('response', async (response) => {
    const url = new URL(response.url());
    if (!url.hostname.endsWith('.supabase.co')) return;
    let body = null;
    const contentType = response.headers()['content-type'] || '';
    if (/json|text/i.test(contentType)) {
      try { body = safeJson(await response.text()); } catch { body = '[unavailable]'; }
    }
    evidence.backendResponses.push({
      method: response.request().method(),
      path: `${url.pathname}${url.search}`,
      status: response.status(),
      ok: response.ok(),
      body,
    });
  });

  return Object.freeze({
    evidence,
    async snapshot(label) {
      const snapshot = await page.evaluate((snapshotLabel) => {
        const runtime = globalThis.WorkManagementRuntime;
        let runtimeContext = null;
        try { runtimeContext = runtime?.getContext?.() ?? null; } catch {}
        let identity = null;
        try {
          const raw = localStorage.getItem('wm.platform.identity.v1');
          if (raw) {
            const parsed = JSON.parse(raw);
            identity = {
              version: parsed?.version ?? null,
              user: parsed?.user ? { id: parsed.user.id ?? null, email: parsed.user.email ?? null, displayName: parsed.user.displayName ?? null } : null,
              platformRole: parsed?.platformRole ?? null,
              accountStatus: parsed?.accountStatus ?? null,
              modules: parsed?.modules ?? null,
            };
          }
        } catch {}
        const management = document.querySelector('[data-wm-authenticated-management-ui-host]');
        const board = document.querySelector('[data-wm-board-presentation-host]');
        const runtimeHost = document.querySelector('[data-wm-runtime-host]');
        const authHost = document.querySelector('[data-wm-authentication-ui-host]');
        const routeError = document.querySelector('.error-reference');
        return {
          label: snapshotLabel,
          at: new Date().toISOString(),
          href: location.href,
          hash: location.hash,
          runtimeContext,
          authentication: {
            identity,
            hasSession: Boolean(localStorage.getItem('wm.platform.auth.session.v1')),
            loginVisible: Boolean(document.querySelector('[data-wm-authentication-ui-view="login"]')),
          },
          domOwnership: {
            management: management ? {
              owner: management.getAttribute('data-wm-composition-owner'),
              route: management.getAttribute('data-wm-management-route'),
              hidden: management.hidden,
              inert: management.hasAttribute('inert'),
              view: management.querySelector('[data-wm-management-view]')?.getAttribute('data-wm-management-view') ?? null,
            } : null,
            board: board ? {
              owner: board.getAttribute('data-wm-composition-owner'),
              route: board.getAttribute('data-wm-board-presentation-route'),
              view: board.getAttribute('data-wm-board-presentation-view'),
              boardId: board.getAttribute('data-wm-board-id'),
              hidden: board.hidden,
              inert: board.hasAttribute('inert'),
              childCount: board.childElementCount,
            } : null,
            runtimeHost: runtimeHost ? { hidden: runtimeHost.hidden, inert: runtimeHost.hasAttribute('inert'), childCount: runtimeHost.childElementCount } : null,
            authenticationHost: authHost ? { view: authHost.getAttribute('data-wm-authentication-ui-view'), hidden: authHost.hidden } : null,
          },
          routeFailure: routeError ? { reference: routeError.textContent?.trim() ?? '', message: routeError.closest('.empty')?.querySelector('p')?.textContent?.trim() ?? '' } : null,
          visibleText: (document.querySelector('#main')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1500),
        };
      }, label);
      evidence.snapshots.push(sanitize(snapshot));
      return snapshot;
    },
    finish(extra = {}) {
      evidence.finishedAt = new Date().toISOString();
      evidence.summary = sanitize(extra);
      return sanitize(evidence);
    },
  });
}

export function writeRegressionEvidence(name, evidence) {
  const dir = path.resolve(process.env.WM_M37_EVIDENCE_DIR || 'm37-evidence');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name.replace(/[^a-z0-9._-]+/gi, '-').toLowerCase()}.json`);
  fs.writeFileSync(file, `${JSON.stringify(sanitize(evidence), null, 2)}\n`);
  return file;
}
