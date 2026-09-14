import assert from 'node:assert/strict';
import { createSupabaseClientAdapter, SupabaseClientAdapterError } from '../assets/js/platform/data/supabase-client-adapter.ts';

const originalFetch = globalThis.fetch;
const calls = [];
let next = { status: 200, body: { ok: true } };

globalThis.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), init });
  const response = next;
  next = { status: 200, body: { ok: true } };
  return new Response(response.body == null ? null : JSON.stringify(response.body), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
};

try {
  const client = createSupabaseClientAdapter({
    supabaseUrl: 'https://project.supabase.co/',
    publishableKey: 'sb_publishable_example',
  });
  assert.equal(client.project.supabaseUrl, 'https://project.supabase.co');
  assert.deepEqual(client.headers('token', { Prefer: 'return=representation' }), {
    apikey: 'sb_publishable_example',
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    Authorization: 'Bearer token',
  });

  next = { status: 200, body: [{ id: 'row-1' }] };
  const rpc = await client.rpc('wm_test', { p_id: 'row-1' }, 'token-1');
  assert.deepEqual(rpc, [{ id: 'row-1' }]);
  assert.equal(calls.at(-1).url, 'https://project.supabase.co/rest/v1/rpc/wm_test');
  assert.equal(new Headers(calls.at(-1).init.headers).get('authorization'), 'Bearer token-1');
  assert.equal(new Headers(calls.at(-1).init.headers).get('apikey'), 'sb_publishable_example');

  next = { status: 200, body: { signedURL: '/object/sign/work-board-files/a%20b?token=x' } };
  const signed = await client.storageSign('work-board-files', 'folder/a b', 'token-2', 120);
  assert.equal(signed.signedURL.startsWith('/object/sign/'), true);
  assert.equal(calls.at(-1).url.includes('/storage/v1/object/sign/work-board-files/folder/a%20b'), true);

  const blob = new Blob(['abc'], { type: 'text/plain' });
  next = { status: 200, body: { Key: 'file' } };
  assert.equal(await client.storageUpload('work-board-files', 'folder/a b.txt', blob, 'token-3', { upsert: false }), true);
  assert.equal(new Headers(calls.at(-1).init.headers).get('x-upsert'), 'false');
  assert.equal(new Headers(calls.at(-1).init.headers).get('content-type'), 'text/plain');

  next = { status: 404, body: { message: 'not found' } };
  assert.equal(await client.storageDelete('work-board-files', 'missing.txt', 'token-4', { ignoreMissing: true }), true);

  next = { status: 409, body: { code: '23505', message: 'duplicate key' } };
  await assert.rejects(
    client.rpc('wm_conflict', {}, 'token-5'),
    (error) => error instanceof SupabaseClientAdapterError && error.status === 409 && error.code === '23505' && /duplicate key/.test(error.message),
  );

  assert.equal(client.resolveStorageSignedUrl('/object/sign/bucket/file?token=x'), 'https://project.supabase.co/storage/v1/object/sign/bucket/file?token=x');
  assert.equal(client.resolveStorageSignedUrl('https://project.supabase.co/storage/v1/object/sign/bucket/file?token=x'), 'https://project.supabase.co/storage/v1/object/sign/bucket/file?token=x');
  assert.throws(() => client.resolveStorageSignedUrl('https://evil.example/file'), /origin/);
  await assert.rejects(client.request('https://evil.example/rest/v1/profiles'), /project-relative/);
  assert.throws(() => createSupabaseClientAdapter({ supabaseUrl: 'http://project.supabase.co', publishableKey: 'key' }), /HTTPS/);
  assert.throws(() => createSupabaseClientAdapter({ supabaseUrl: 'https://project.supabase.co', publishableKey: 'sb_secret_do_not_ship' }), /privileged browser keys/);
  const serviceRolePayload = Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url');
  assert.throws(() => createSupabaseClientAdapter({ supabaseUrl: 'https://project.supabase.co', publishableKey: `eyJheader.${serviceRolePayload}.signature` }), /privileged browser keys/);
  await assert.rejects(client.storageSign('work-board-files', '../secret.txt', 'token-6'), /invalid segment/);
  await assert.rejects(client.storageSign('../bucket', 'safe.txt', 'token-6'), /bucket name is invalid/);

  const responseFetch = globalThis.fetch;
  globalThis.fetch = (url, init = {}) => new Promise((resolve, reject) => {
    calls.push({ url: String(url), init });
    const signal = init.signal;
    const fail = () => reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
    if (signal?.aborted) fail();
    else signal?.addEventListener('abort', fail, { once: true });
    void resolve;
  });
  await assert.rejects(client.request('/auth/v1/health', { timeoutMs: 5 }), (error) => error instanceof Error && error.name === 'TimeoutError');
  const controller = new AbortController();
  controller.abort(new DOMException('Caller cancelled', 'AbortError'));
  await assert.rejects(client.request('/auth/v1/health', { signal: controller.signal, timeoutMs: 100 }), (error) => error instanceof Error && error.name === 'AbortError');
  globalThis.fetch = responseFetch;

  next = { status: 200, body: { version: 'ok' } };
  assert.deepEqual(await client.health(), { ok: true, status: 200 });

  console.log('Stage B M7 Supabase client adapter execution vectors: PASS');
} finally {
  globalThis.fetch = originalFetch;
}
