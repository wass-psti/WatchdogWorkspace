import assert from 'node:assert/strict';
import { createEdgeFunctionClient } from '../assets/js/platform/data/edge-function-client.ts';
import { createAdminSyncAuthAccessHandler } from '../supabase/functions/admin-sync-auth-access/handler.ts';

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ADMIN_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const calls = [];
const auth = {
  isAuthenticated: true,
  user: { id: ADMIN_ID },
  backend: { supabaseUrl: 'https://example.supabase.co', publishableKey: 'sb_publishable_test' },
  headers(token, extra = {}) { return { apikey: 'sb_publishable_test', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...extra }; },
  async ensureAccessToken() { return 'user-jwt'; },
  async request() { throw new Error('unexpected auth.request'); },
  supabase: {
    project: { supabaseUrl: 'https://example.supabase.co', publishableKey: 'sb_publishable_test' },
    headers(token, extra = {}) { return { apikey: 'sb_publishable_test', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra }; },
    async request(path, init) {
      calls.push({ path, init });
      return { ok: true, requestId: 'wm-edge-response', userId: USER_ID, authAccess: 'banned' };
    },
  },
};
const diagnostics = { debug() {}, warn() {} };
const client = createEdgeFunctionClient(auth, diagnostics);
assert.deepEqual(client.functions(), ['admin-sync-auth-access']);
assert.equal(client.isAllowed('admin-sync-auth-access'), true);
assert.equal(client.isAllowed('arbitrary-function'), false);
await assert.rejects(() => client.invoke('arbitrary-function', {}), /not registered/i);
const clientResult = await client.invoke('admin-sync-auth-access', { userId: USER_ID, status: 'disabled' });
assert.equal(clientResult.authAccess, 'banned');
assert.equal(calls.length, 1);
assert.equal(calls[0].path, '/functions/v1/admin-sync-auth-access');
assert.equal(calls[0].init.method, 'POST');
assert.match(calls[0].init.headers.Authorization, /^Bearer user-jwt$/);
assert.equal(calls[0].init.headers.apikey, 'sb_publishable_test');
assert.ok(!JSON.stringify(calls[0]).includes('server-secret'));

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const adminCalls = [];
const handler = createAdminSyncAuthAccessHandler({
  environment: {
    supabaseUrl: 'https://example.supabase.co',
    publishableKey: 'sb_publishable_test',
    serverSecretKey: 'sb_secret_server_only',
    allowedOrigins: 'https://work.example.com,http://127.0.0.1:4173',
  },
  async fetch(url, init = {}) {
    adminCalls.push({ url: String(url), init });
    if (String(url).endsWith('/auth/v1/user')) return jsonResponse({ id: ADMIN_ID });
    if (String(url).includes('/rest/v1/profiles?')) return jsonResponse([{ id: ADMIN_ID, platform_role: 'admin_general_manager', status: 'active' }]);
    if (String(url).includes(`/auth/v1/admin/users/${USER_ID}`)) return jsonResponse({ id: USER_ID });
    return jsonResponse({ message: 'unexpected' }, 500);
  },
});
const request = new Request('https://example.supabase.co/functions/v1/admin-sync-auth-access', {
  method: 'POST',
  headers: {
    Origin: 'https://work.example.com',
    Authorization: 'Bearer caller-jwt',
    apikey: 'sb_publishable_test',
    'Content-Type': 'application/json',
    'x-wm-request-id': 'wm-test-request-1234',
  },
  body: JSON.stringify({ userId: USER_ID, status: 'disabled' }),
});
const response = await handler(request);
assert.equal(response.status, 200);
assert.equal(response.headers.get('access-control-allow-origin'), 'https://work.example.com');
assert.equal(response.headers.get('cache-control'), 'no-store');
const payload = await response.json();
assert.deepEqual(payload, { ok: true, requestId: 'wm-test-request-1234', userId: USER_ID, authAccess: 'banned' });
assert.equal(adminCalls.length, 3);
assert.match(adminCalls[0].init.headers.Authorization, /^Bearer caller-jwt$/);
assert.equal(adminCalls[1].init.headers.apikey, 'sb_publishable_test');
assert.equal(adminCalls[2].init.headers.apikey, 'sb_secret_server_only');
assert.equal(adminCalls[2].init.headers.Authorization, undefined);
assert.deepEqual(JSON.parse(adminCalls[2].init.body), { ban_duration: '876000h' });

const unbanCalls = [];
const unbanHandler = createAdminSyncAuthAccessHandler({
  environment: {
    supabaseUrl: 'https://example.supabase.co', publishableKey: 'pub', serverSecretKey: 'secret', allowedOrigins: 'https://work.example.com',
  },
  async fetch(url, init = {}) {
    unbanCalls.push({ url: String(url), init });
    if (String(url).endsWith('/auth/v1/user')) return jsonResponse({ id: ADMIN_ID });
    if (String(url).includes('/rest/v1/profiles?')) return jsonResponse([{ id: ADMIN_ID, platform_role: 'admin_general_manager', status: 'active' }]);
    return jsonResponse({ id: USER_ID });
  },
});
const unbanResponse = await unbanHandler(new Request('https://example.supabase.co/functions/v1/admin-sync-auth-access', {
  method: 'POST', headers: { Origin: 'https://work.example.com', Authorization: 'Bearer jwt', 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: USER_ID, status: 'active' }),
}));
assert.equal(unbanResponse.status, 200);
assert.deepEqual(JSON.parse(unbanCalls[2].init.body), { ban_duration: 'none' });

const deniedOrigin = await handler(new Request('https://example.supabase.co/functions/v1/admin-sync-auth-access', {
  method: 'POST', headers: { Origin: 'https://evil.example', Authorization: 'Bearer jwt', 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: USER_ID, status: 'disabled' }),
}));
assert.equal(deniedOrigin.status, 403);

const nonAdminHandler = createAdminSyncAuthAccessHandler({
  environment: { supabaseUrl: 'https://example.supabase.co', publishableKey: 'pub', serverSecretKey: 'secret', allowedOrigins: 'https://work.example.com' },
  async fetch(url) {
    if (String(url).endsWith('/auth/v1/user')) return jsonResponse({ id: ADMIN_ID });
    return jsonResponse([{ id: ADMIN_ID, platform_role: 'employee', status: 'active' }]);
  },
});
const nonAdmin = await nonAdminHandler(new Request('https://example.supabase.co/functions/v1/admin-sync-auth-access', {
  method: 'POST', headers: { Origin: 'https://work.example.com', Authorization: 'Bearer jwt', 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: USER_ID, status: 'disabled' }),
}));
assert.equal(nonAdmin.status, 403);

let servedHandler = null;
const originalDeno = globalThis.Deno;
globalThis.Deno = {
  env: {
    get(name) {
      const values = {
        SUPABASE_URL: 'https://example.supabase.co',
        WM_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
        WM_SUPABASE_SECRET_KEY: 'sb_secret_server_only',
        WM_EDGE_ALLOWED_ORIGINS: 'https://work.example.com',
      };
      return values[name];
    },
  },
  serve(handler) { servedHandler = handler; return { shutdown() {} }; },
};
try {
  await import(`../supabase/functions/admin-sync-auth-access/index.ts?execution=${Date.now()}`);
  assert.equal(typeof servedHandler, 'function');
} finally {
  if (originalDeno === undefined) delete globalThis.Deno;
  else globalThis.Deno = originalDeno;
}

console.log('Stage F M28 Edge Functions execution vectors: PASS (allowlist, JWT propagation, origin policy, live-admin authorization, server-secret isolation, ban/unban, Deno entrypoint)');
