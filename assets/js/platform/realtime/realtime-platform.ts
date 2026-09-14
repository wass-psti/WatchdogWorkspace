import type {
  RealtimePlatform,
  RealtimePlatformChannelSnapshot,
  RealtimePlatformOptions,
  RealtimePlatformSnapshot,
  RealtimePlatformSubscription,
  RealtimePlatformSubscriptionOptions,
  RealtimeTopicDescriptor,
  RealtimeTopicNamespace,
  ResolvedRealtimeTopic,
} from '../../../../src/platform/contracts/realtime-platform.ts';
import type {
  RealtimeChannelSnapshot,
  RealtimeClient,
  RealtimePresenceEntry,
  RealtimePrivateChannel,
} from '../../../../src/platform/contracts/realtime.ts';
import { createSupabaseRealtimeClient } from '../data/supabase-realtime-client.ts';

const BOARD_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MODULE_IDS = new Set(['time-tracker', 'fueltrack-plus', 'tradelink']);
const PLATFORM_KEY = /^[a-z][a-z0-9-]{0,63}$/;
const TOKEN_REFRESH_MS = 4 * 60_000;
const MAX_CHANNELS = 24;

interface SubscriberRecord {
  readonly id: string;
  readonly onState?: RealtimePlatformSubscriptionOptions<unknown>['onState'];
  readonly onBroadcast?: RealtimePlatformSubscriptionOptions<unknown>['onBroadcast'];
  readonly onPresence?: RealtimePlatformSubscriptionOptions<unknown>['onPresence'];
}

interface ChannelRecord {
  readonly resolved: ResolvedRealtimeTopic;
  readonly subscribers: Map<string, SubscriberRecord>;
  readonly presenceKey: string | null;
  readonly presencePayload: Readonly<Record<string, unknown>>;
  channel: RealtimePrivateChannel | null;
  snapshot: RealtimeChannelSnapshot;
  presence: readonly RealtimePresenceEntry[];
}

const normalizeKey = (value: string): string => String(value || '').trim();

export function resolveRealtimeTopic(descriptor: RealtimeTopicDescriptor, enabledNamespaces: ReadonlySet<RealtimeTopicNamespace>): ResolvedRealtimeTopic {
  const namespace = descriptor.namespace;
  const key = normalizeKey(descriptor.key);
  if (namespace === 'board') {
    if (!BOARD_UUID.test(key)) throw new TypeError('Realtime Board topic requires a canonical UUID.');
  } else if (namespace === 'module') {
    if (!MODULE_IDS.has(key)) throw new TypeError(`Unknown realtime module topic: ${key || '(empty)'}.`);
  } else if (namespace === 'platform') {
    if (!PLATFORM_KEY.test(key)) throw new TypeError('Realtime platform topic key must be a lowercase slug.');
  } else {
    throw new TypeError(`Unsupported realtime topic namespace: ${String(namespace)}.`);
  }
  return Object.freeze({ namespace, key, topic: `${namespace}:${key}`, enabled: enabledNamespaces.has(namespace) });
}

function emptyChannelSnapshot(topic: string): RealtimeChannelSnapshot {
  return Object.freeze({ state: 'idle', topic, lastEventAt: null, lastError: null, presence: Object.freeze([]) });
}

export function createRealtimePlatform(options: RealtimePlatformOptions): RealtimePlatform {
  const auth = options.auth;
  const diagnostics = options.diagnostics ?? null;
  const enabledNamespaces = new Set<RealtimeTopicNamespace>(options.enabledNamespaces ?? ['board']);
  const tokenRefreshMs = options.tokenRefreshMs ?? TOKEN_REFRESH_MS;
  const maxChannels = Math.max(1, Math.floor(options.maxChannels ?? MAX_CHANNELS));
  const setIntervalFn = options.setIntervalFn ?? globalThis.setInterval.bind(globalThis);
  const clearIntervalFn = options.clearIntervalFn ?? globalThis.clearInterval.bind(globalThis);
  const now = options.now ?? Date.now;
  const channels = new Map<string, ChannelRecord>();
  let transport: RealtimeClient | null = options.client ?? null;
  let sequence = 0;
  let tokenTimer: ReturnType<typeof setInterval> | null = null;
  let lastTokenRefreshAt: number | null = null;
  let lastError: string | null = null;
  let disposed = false;

  const resolveTransport = (): RealtimeClient => {
    if (transport) return transport;
    transport = createSupabaseRealtimeClient(auth.supabase.project);
    return transport;
  };

  const fanoutState = (record: ChannelRecord, snapshot: RealtimeChannelSnapshot): void => {
    record.snapshot = snapshot;
    record.presence = snapshot.presence;
    for (const subscriber of record.subscribers.values()) subscriber.onState?.(snapshot);
  };

  const fanoutPresence = (record: ChannelRecord, presence: readonly RealtimePresenceEntry[]): void => {
    record.presence = presence;
    for (const subscriber of record.subscribers.values()) subscriber.onPresence?.(presence);
  };

  const fanoutBroadcast = (record: ChannelRecord, event: string, payload: unknown): void => {
    for (const subscriber of record.subscribers.values()) subscriber.onBroadcast?.(event, payload);
  };

  const startTokenTimer = (): void => {
    if (tokenTimer !== null || channels.size === 0 || disposed) return;
    tokenTimer = setIntervalFn(() => {
      void refreshAccessToken().catch((error: unknown) => {
        lastError = error instanceof Error ? error.message : 'Realtime platform token refresh failed.';
        diagnostics?.warn('WM_REALTIME_TOKEN_REFRESH_FAILED', lastError, { activeChannels: channels.size });
      });
    }, tokenRefreshMs);
  };

  const stopTokenTimer = (): void => {
    if (tokenTimer !== null) clearIntervalFn(tokenTimer);
    tokenTimer = null;
  };

  async function refreshAccessToken(): Promise<void> {
    if (disposed || channels.size === 0) return;
    try {
      const accessToken = await auth.ensureAccessToken();
      if (!accessToken) throw new Error('Realtime platform requires an authenticated session.');
      for (const record of channels.values()) {
        record.channel?.updateAccessToken(accessToken);
        const transportSnapshot = record.channel?.snapshot();
        if (transportSnapshot) fanoutState(record, Object.freeze({ ...transportSnapshot, lastError: null }));
      }
      lastTokenRefreshAt = now();
      lastError = null;
      diagnostics?.debug('WM_REALTIME_TOKEN_REFRESHED', 'Realtime platform refreshed active private-channel authorization.', { activeChannels: channels.size });
    } catch (error: unknown) {
      lastError = error instanceof Error ? error.message : 'Realtime platform token refresh failed.';
      for (const record of channels.values()) fanoutState(record, Object.freeze({ ...record.snapshot, state: 'error', lastError }));
      throw error;
    }
  }

  const removeChannelIfUnused = (record: ChannelRecord): void => {
    if (record.subscribers.size > 0) return;
    record.channel?.dispose();
    record.channel = null;
    channels.delete(record.resolved.topic);
    diagnostics?.debug('WM_REALTIME_CHANNEL_RELEASED', 'Realtime platform released an unused private channel.', { topic: record.resolved.topic, activeChannels: channels.size });
    if (channels.size === 0) stopTokenTimer();
  };

  async function subscribe<TBroadcast = unknown>(subscriptionOptions: RealtimePlatformSubscriptionOptions<TBroadcast>): Promise<RealtimePlatformSubscription> {
    if (disposed) throw new Error('Realtime platform has been disposed.');
    const resolved = resolveRealtimeTopic(subscriptionOptions.topic, enabledNamespaces);
    if (!resolved.enabled) throw new Error(`Realtime namespace ${resolved.namespace} is reserved but not enabled in the current production policy.`);
    let record = channels.get(resolved.topic);
    const presenceKey = normalizeKey(subscriptionOptions.presenceKey ?? '') || null;
    const presencePayload = Object.freeze({ ...(subscriptionOptions.presencePayload ?? {}) });

    if (record) {
      if (record.presenceKey !== presenceKey) throw new Error(`Realtime topic ${resolved.topic} already has a different presence identity.`);
    } else {
      if (channels.size >= maxChannels) throw new Error(`Realtime platform channel limit (${maxChannels}) reached.`);
      const accessToken = await auth.ensureAccessToken();
      if (!accessToken) throw new Error('Realtime platform requires an authenticated session.');
      record = {
        resolved,
        subscribers: new Map<string, SubscriberRecord>(),
        presenceKey,
        presencePayload,
        channel: null,
        snapshot: emptyChannelSnapshot(resolved.topic),
        presence: Object.freeze([]),
      };
      channels.set(resolved.topic, record);
      const stableRecord = record;
      try {
        stableRecord.channel = resolveTransport().connectPrivateChannel<unknown>({
          topic: resolved.topic,
          presenceKey,
          presencePayload,
          onState: (snapshot) => fanoutState(stableRecord, snapshot),
          onPresence: (presence) => fanoutPresence(stableRecord, presence),
          onBroadcast: (event, payload) => fanoutBroadcast(stableRecord, event, payload),
        }, accessToken);
        stableRecord.snapshot = stableRecord.channel.snapshot();
        diagnostics?.debug('WM_REALTIME_CHANNEL_ACQUIRED', 'Realtime platform acquired a private channel.', { topic: resolved.topic, activeChannels: channels.size });
        startTokenTimer();
      } catch (error) {
        channels.delete(resolved.topic);
        if (channels.size === 0) stopTokenTimer();
        throw error;
      }
    }

    const subscriptionId = `rt-${++sequence}`;
    const subscriber: SubscriberRecord = {
      id: subscriptionId,
      onState: subscriptionOptions.onState as RealtimePlatformSubscriptionOptions<unknown>['onState'],
      onBroadcast: subscriptionOptions.onBroadcast as RealtimePlatformSubscriptionOptions<unknown>['onBroadcast'],
      onPresence: subscriptionOptions.onPresence as RealtimePlatformSubscriptionOptions<unknown>['onPresence'],
    };
    record.subscribers.set(subscriptionId, subscriber);
    subscriber.onState?.(record.snapshot);
    subscriber.onPresence?.(record.presence);
    let subscriptionDisposed = false;

    const subscription: RealtimePlatformSubscription = Object.freeze({
      id: subscriptionId,
      topic: resolved.topic,
      snapshot: () => record?.snapshot ?? emptyChannelSnapshot(resolved.topic),
      refreshAccessToken,
      trackPresence(payload = presencePayload) {
        if (subscriptionDisposed) return;
        record?.channel?.trackPresence(payload);
      },
      dispose() {
        if (subscriptionDisposed) return;
        subscriptionDisposed = true;
        record?.subscribers.delete(subscriptionId);
        if (record) removeChannelIfUnused(record);
      },
    });
    return subscription;
  }

  function snapshot(): RealtimePlatformSnapshot {
    const channelSnapshots: RealtimePlatformChannelSnapshot[] = [...channels.values()].map((record) => Object.freeze({
      topic: record.resolved.topic,
      namespace: record.resolved.namespace,
      state: record.snapshot.state,
      subscriberCount: record.subscribers.size,
      presenceCount: record.presence.length,
      lastEventAt: record.snapshot.lastEventAt,
      lastError: record.snapshot.lastError,
    }));
    const liveChannelCount = channelSnapshots.filter((entry) => entry.state === 'live').length;
    const degradedChannelCount = channelSnapshots.filter((entry) => ['reconnecting', 'offline', 'error'].includes(entry.state)).length;
    return Object.freeze({
      activeChannelCount: channelSnapshots.length,
      activeSubscriptionCount: channelSnapshots.reduce((sum, entry) => sum + entry.subscriberCount, 0),
      liveChannelCount,
      degradedChannelCount,
      lastTokenRefreshAt,
      lastError,
      channels: Object.freeze(channelSnapshots),
    });
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    stopTokenTimer();
    for (const record of channels.values()) record.channel?.dispose();
    channels.clear();
    lastError = null;
    diagnostics?.debug('WM_REALTIME_PLATFORM_DISPOSED', 'Realtime platform disposed all private channels.');
  }

  return Object.freeze({
    resolveTopic: (descriptor) => resolveRealtimeTopic(descriptor, enabledNamespaces),
    subscribe,
    refreshAccessToken,
    snapshot,
    dispose,
  } satisfies RealtimePlatform);
}
