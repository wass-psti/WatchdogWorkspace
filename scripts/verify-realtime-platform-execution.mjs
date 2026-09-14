import assert from 'node:assert/strict';
import { createRealtimePlatform, resolveRealtimeTopic } from '../assets/js/platform/realtime/realtime-platform.ts';
import { createBoardRealtimeService } from '../assets/js/features/boards/services/board-realtime-service.ts';

const boardId = '11111111-1111-4111-8111-111111111111';
const boardId2 = '22222222-2222-4222-8222-222222222222';
const updates = [];
const channels = new Map();
let connectCalls = 0;
let token = 'token-1';
let intervalStarts = 0;
let intervalStops = 0;

const fakeClient = Object.freeze({
  connectPrivateChannel(options, initialToken) {
    connectCalls += 1;
    const record = {
      options,
      tokens: [initialToken],
      presencePayloads: [],
      disposed: false,
      snapshot: Object.freeze({ state: 'live', topic: options.topic, lastEventAt: null, lastError: null, presence: Object.freeze([]) }),
    };
    channels.set(options.topic, record);
    options.onState?.(record.snapshot);
    return Object.freeze({
      snapshot: () => record.snapshot,
      updateAccessToken(nextToken) { record.tokens.push(nextToken); },
      trackPresence(payload = {}) { record.presencePayloads.push(payload); },
      dispose() { record.disposed = true; },
    });
  },
});

const auth = Object.freeze({
  isAuthenticated: true,
  user: Object.freeze({ id: 'user-1' }),
  backend: Object.freeze({ supabaseUrl: 'https://example.supabase.co', publishableKey: 'publishable' }),
  supabase: Object.freeze({ project: Object.freeze({ supabaseUrl: 'https://example.supabase.co', publishableKey: 'publishable' }) }),
  async ensureAccessToken() { return token; },
  headers() { return {}; },
  async request() { return null; },
});

const enabled = new Set(['board']);
assert.equal(resolveRealtimeTopic({ namespace: 'board', key: boardId }, enabled).topic, `board:${boardId}`);
assert.throws(() => resolveRealtimeTopic({ namespace: 'board', key: 'not-a-uuid' }, enabled), /canonical UUID/);
assert.equal(resolveRealtimeTopic({ namespace: 'module', key: 'time-tracker' }, enabled).enabled, false);

const realtime = createRealtimePlatform({
  auth,
  client: fakeClient,
  enabledNamespaces: ['board'],
  tokenRefreshMs: 1_000,
  setIntervalFn(callback) { intervalStarts += 1; return Object.freeze({ callback }); },
  clearIntervalFn() { intervalStops += 1; },
  now: () => 1234,
});

const eventsA = [];
const eventsB = [];
const subscriptionA = await realtime.subscribe({
  topic: { namespace: 'board', key: boardId },
  presenceKey: 'user-1',
  presencePayload: { user_id: 'user-1' },
  onBroadcast: (event, payload) => eventsA.push([event, payload]),
});
const subscriptionB = await realtime.subscribe({
  topic: { namespace: 'board', key: boardId },
  presenceKey: 'user-1',
  presencePayload: { user_id: 'user-1' },
  onBroadcast: (event, payload) => eventsB.push([event, payload]),
});

assert.equal(connectCalls, 1, 'same-topic subscriptions must share one transport channel');
assert.equal(intervalStarts, 1, 'the platform must own one shared token refresh timer');
assert.deepEqual(realtime.snapshot(), {
  activeChannelCount: 1,
  activeSubscriptionCount: 2,
  liveChannelCount: 1,
  degradedChannelCount: 0,
  lastTokenRefreshAt: null,
  lastError: null,
  channels: [{
    topic: `board:${boardId}`,
    namespace: 'board',
    state: 'live',
    subscriberCount: 2,
    presenceCount: 0,
    lastEventAt: null,
    lastError: null,
  }],
});

channels.get(`board:${boardId}`).options.onBroadcast?.('probe', { ok: true });
assert.equal(eventsA.length, 1);
assert.equal(eventsB.length, 1);

token = '';
await assert.rejects(realtime.refreshAccessToken(), /authenticated session/);
assert.equal(subscriptionA.snapshot().state, 'error', 'token refresh failure must degrade feature-visible channel state so fallback synchronization can engage');
token = 'token-2';
await realtime.refreshAccessToken();
assert.deepEqual(channels.get(`board:${boardId}`).tokens, ['token-1', 'token-2']);
assert.equal(subscriptionA.snapshot().state, 'live', 'successful token refresh must recover the transport-visible channel state');
assert.equal(realtime.snapshot().lastTokenRefreshAt, 1234);

await assert.rejects(
  realtime.subscribe({ topic: { namespace: 'module', key: 'time-tracker' } }),
  /reserved but not enabled/,
);

subscriptionA.dispose();
assert.equal(channels.get(`board:${boardId}`).disposed, false, 'shared channel must survive until final subscriber releases it');
assert.equal(realtime.snapshot().activeSubscriptionCount, 1);
subscriptionB.dispose();
assert.equal(channels.get(`board:${boardId}`).disposed, true);
assert.equal(realtime.snapshot().activeChannelCount, 0);
assert.equal(intervalStops, 1, 'shared token timer must stop when no channels remain');

const bounded = createRealtimePlatform({ auth, client: fakeClient, enabledNamespaces: ['board'], maxChannels: 1, setIntervalFn: () => 1, clearIntervalFn: () => {} });
const boundedOne = await bounded.subscribe({ topic: { namespace: 'board', key: boardId }, presenceKey: 'user-1' });
await assert.rejects(bounded.subscribe({ topic: { namespace: 'board', key: boardId2 }, presenceKey: 'user-1' }), /channel limit/);
boundedOne.dispose();
bounded.dispose();

const boardRealtime = createRealtimePlatform({ auth, client: fakeClient, enabledNamespaces: ['board'], setIntervalFn: () => 1, clearIntervalFn: () => {}, now: () => 2000 });
const boardService = createBoardRealtimeService(auth, { realtime: boardRealtime, now: () => 2000 });
const boardChanges = [];
const boardSnapshots = [];
const boardSubscription = await boardService.subscribe(boardId, {
  onChange: (change) => boardChanges.push(change),
  onSnapshot: (snapshot) => boardSnapshots.push(snapshot),
});
channels.get(`board:${boardId}`).options.onBroadcast?.('board-change', {
  board_id: boardId,
  entity: 'item',
  entity_id: 'item-1',
  item_id: 'item-1',
  action: 'UPDATE',
  actor_id: 'user-2',
  occurred_at: '2026-09-10T00:00:00.000Z',
});
assert.equal(boardChanges.length, 1);
assert.equal(boardChanges[0].boardId, boardId);
assert.equal(boardChanges[0].entity, 'item');
assert.equal(boardChanges[0].action, 'UPDATE');
assert.ok(boardSnapshots.length >= 1);
boardSubscription.dispose();
boardRealtime.dispose();

realtime.dispose();
updates.push('topic-policy', 'shared-channel', 'shared-token-refresh', 'bounded-channels', 'board-adapter');
console.log(`Stage F M27 realtime platform execution vectors: PASS (${updates.join(', ')})`);
