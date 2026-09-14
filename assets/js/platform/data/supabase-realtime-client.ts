import type {
  RealtimeChannelSnapshot,
  RealtimeClient,
  RealtimeConnectionState,
  RealtimePresenceEntry,
  RealtimePrivateChannel,
  RealtimePrivateChannelOptions,
} from '../../../../src/platform/contracts/realtime.ts';
import type { SupabaseProjectIdentity } from '../../../../src/platform/contracts/supabase-client.ts';

type UnknownRecord = Record<string, unknown>;
type WireMessage = readonly [string | null, string | null, string, string, unknown];

type WebSocketLike = Pick<WebSocket, 'readyState' | 'send' | 'close' | 'addEventListener' | 'removeEventListener'>;
export interface SupabaseRealtimeClientOptions {
  readonly createWebSocket?: (url: string) => WebSocketLike;
  readonly setTimeoutFn?: typeof globalThis.setTimeout;
  readonly clearTimeoutFn?: typeof globalThis.clearTimeout;
  readonly setIntervalFn?: typeof globalThis.setInterval;
  readonly clearIntervalFn?: typeof globalThis.clearInterval;
  readonly now?: () => number;
}

const recordOf = (value: unknown): UnknownRecord | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
const stringOf = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const arrayOf = (value: unknown): readonly unknown[] => Array.isArray(value) ? value : [];
const HEARTBEAT_MS = 20_000;
const RECONNECT_DELAYS = Object.freeze([1_000, 2_000, 5_000, 10_000] as const);

function normalizeProject(project: SupabaseProjectIdentity): SupabaseProjectIdentity {
  const supabaseUrl = String(project.supabaseUrl || '').trim().replace(/\/+$/, '');
  const publishableKey = String(project.publishableKey || '').trim();
  if (!/^https:\/\/[A-Za-z0-9.-]+\.supabase\.co$/i.test(supabaseUrl)) throw new TypeError('Supabase Realtime requires an HTTPS *.supabase.co project URL.');
  if (!publishableKey) throw new TypeError('Supabase Realtime requires a publishable project key.');
  return Object.freeze({ supabaseUrl, publishableKey });
}

function websocketEndpoint(project: SupabaseProjectIdentity): string {
  const url = new URL(project.supabaseUrl);
  url.protocol = 'wss:';
  url.pathname = '/realtime/v1/websocket';
  url.search = '';
  url.searchParams.set('apikey', project.publishableKey);
  url.searchParams.set('vsn', '2.0.0');
  return url.toString();
}

function parseWireMessage(raw: unknown): WireMessage | null {
  let value: unknown = raw;
  if (typeof raw === 'string') {
    try { value = JSON.parse(raw) as unknown; } catch { return null; }
  }
  if (!Array.isArray(value) || value.length < 5) return null;
  const topic = stringOf(value[2]);
  const event = stringOf(value[3]);
  if (!topic || !event) return null;
  return [typeof value[0] === 'string' ? value[0] : null, typeof value[1] === 'string' ? value[1] : null, topic, event, value[4]];
}

function presenceEntries(state: unknown): readonly RealtimePresenceEntry[] {
  const source = recordOf(state);
  if (!source) return [];
  const output: RealtimePresenceEntry[] = [];
  for (const [presenceKey, metasValue] of Object.entries(source)) {
    const metaRecord = recordOf(metasValue);
    const metas = Array.isArray(metaRecord?.metas) ? metaRecord?.metas : arrayOf(metasValue);
    for (const metaValue of metas) {
      const meta = recordOf(metaValue);
      if (!meta) continue;
      const presenceRef = stringOf(meta.phx_ref) || stringOf(meta.presence_ref) || `${presenceKey}:${output.length}`;
      const userId = stringOf(meta.user_id) || presenceKey;
      const displayName = stringOf(meta.display_name) || stringOf(meta.email) || 'Collaborator';
      const joinedAt = stringOf(meta.joined_at) || new Date().toISOString();
      output.push(Object.freeze({ presenceRef, userId, displayName, joinedAt }));
    }
  }
  return Object.freeze(output);
}

function applyPresenceDiff(current: readonly RealtimePresenceEntry[], payload: unknown): readonly RealtimePresenceEntry[] {
  const body = recordOf(payload);
  if (!body) return current;
  const joins = presenceEntries(body.joins);
  const leaves = presenceEntries(body.leaves);
  const removed = new Set(leaves.map((entry) => entry.presenceRef));
  const next = current.filter((entry) => !removed.has(entry.presenceRef));
  const byRef = new Map(next.map((entry) => [entry.presenceRef, entry]));
  joins.forEach((entry) => byRef.set(entry.presenceRef, entry));
  return Object.freeze([...byRef.values()]);
}

export function createSupabaseRealtimeClient(projectInput: SupabaseProjectIdentity, options: SupabaseRealtimeClientOptions = {}): RealtimeClient {
  const project = normalizeProject(projectInput);
  const createWebSocket = options.createWebSocket ?? ((url: string) => new WebSocket(url));
  const setTimeoutFn = options.setTimeoutFn ?? globalThis.setTimeout.bind(globalThis);
  const clearTimeoutFn = options.clearTimeoutFn ?? globalThis.clearTimeout.bind(globalThis);
  const setIntervalFn = options.setIntervalFn ?? globalThis.setInterval.bind(globalThis);
  const clearIntervalFn = options.clearIntervalFn ?? globalThis.clearInterval.bind(globalThis);
  const now = options.now ?? Date.now;

  function connectPrivateChannel<TBroadcast = unknown>(channelOptions: RealtimePrivateChannelOptions<TBroadcast>, initialToken: string): RealtimePrivateChannel {
    const topic = String(channelOptions.topic || '').trim();
    const accessToken = String(initialToken || '').trim();
    if (!topic) throw new TypeError('Realtime channel topic is required.');
    if (!accessToken) throw new TypeError('Realtime private channels require an authenticated access token.');

    const wireTopic = `realtime:${topic}`;
    let token = accessToken;
    let socket: WebSocketLike | null = null;
    let state: RealtimeConnectionState = 'idle';
    let lastEventAt: number | null = null;
    let lastError: string | null = null;
    let presence: readonly RealtimePresenceEntry[] = Object.freeze([]);
    let disposed = false;
    let joined = false;
    let joinRef: string | null = null;
    let refCounter = 0;
    let reconnectAttempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let presencePayload = Object.freeze({ ...(channelOptions.presencePayload ?? {}) });

    const nextRef = (): string => String(++refCounter);
    const snapshot = (): RealtimeChannelSnapshot => Object.freeze({ state, topic, lastEventAt, lastError, presence });
    const publish = (): void => channelOptions.onState?.(snapshot());
    const publishPresence = (): void => channelOptions.onPresence?.(presence);
    const setState = (next: RealtimeConnectionState, error: string | null = lastError): void => {
      state = next;
      lastError = error;
      publish();
    };
    const send = (event: string, payload: unknown, withJoinRef = true): string | null => {
      if (!socket || socket.readyState !== 1) return null;
      const ref = nextRef();
      socket.send(JSON.stringify([withJoinRef ? joinRef : null, ref, event === 'heartbeat' ? 'phoenix' : wireTopic, event, payload]));
      return ref;
    };

    const clearHeartbeat = (): void => {
      if (heartbeatTimer !== null) clearIntervalFn(heartbeatTimer);
      heartbeatTimer = null;
    };
    const clearReconnect = (): void => {
      if (reconnectTimer !== null) clearTimeoutFn(reconnectTimer);
      reconnectTimer = null;
    };
    const scheduleReconnect = (): void => {
      if (disposed || reconnectTimer !== null) return;
      clearHeartbeat();
      joined = false;
      const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)] ?? 10_000;
      reconnectAttempt += 1;
      setState(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'reconnecting');
      reconnectTimer = setTimeoutFn(() => {
        reconnectTimer = null;
        openSocket();
      }, delay);
    };
    const trackPresence = (payload: Readonly<Record<string, unknown>> = presencePayload): void => {
      presencePayload = Object.freeze({ ...presencePayload, ...payload });
      if (!joined) return;
      send('presence', { type: 'track', event: 'track', payload: presencePayload });
    };
    const startHeartbeat = (): void => {
      clearHeartbeat();
      heartbeatTimer = setIntervalFn(() => {
        if (!socket || socket.readyState !== 1) return;
        send('heartbeat', {}, false);
      }, HEARTBEAT_MS);
    };

    const onOpen = (): void => {
      if (disposed) return;
      joined = false;
      joinRef = nextRef();
      setState('connecting', null);
      socket?.send(JSON.stringify([
        joinRef,
        joinRef,
        wireTopic,
        'phx_join',
        {
          config: {
            private: true,
            broadcast: { ack: false, self: false },
            presence: { enabled: true, key: channelOptions.presenceKey ?? undefined },
          },
          access_token: token,
        },
      ]));
      startHeartbeat();
    };

    const onMessage = (event: Event): void => {
      if (disposed) return;
      const data = 'data' in event ? (event as MessageEvent<unknown>).data : null;
      const message = parseWireMessage(data);
      if (!message || message[2] !== wireTopic) return;
      const [, ref, , eventType, payload] = message;
      if (eventType === 'phx_reply') {
        const reply = recordOf(payload);
        if (ref === joinRef && stringOf(reply?.status) === 'ok') {
          joined = true;
          reconnectAttempt = 0;
          setState('live', null);
          trackPresence();
        } else if (stringOf(reply?.status) === 'error') {
          joined = false;
          lastError = stringOf(recordOf(reply?.response)?.reason) || 'Realtime channel join failed.';
          setState('error', lastError);
          scheduleReconnect();
        }
        return;
      }
      if (eventType === 'broadcast') {
        const broadcast = recordOf(payload);
        if (!broadcast) return;
        const eventName = stringOf(broadcast.event);
        if (!eventName) return;
        lastEventAt = now();
        channelOptions.onBroadcast?.(eventName, broadcast.payload as TBroadcast);
        publish();
        return;
      }
      if (eventType === 'presence_state') {
        presence = presenceEntries(payload);
        lastEventAt = now();
        publishPresence();
        publish();
        return;
      }
      if (eventType === 'presence_diff') {
        presence = applyPresenceDiff(presence, payload);
        lastEventAt = now();
        publishPresence();
        publish();
        return;
      }
      if (eventType === 'system') {
        const system = recordOf(payload);
        if (stringOf(system?.status).toLowerCase() === 'error') {
          lastError = stringOf(system?.message) || 'Realtime channel reported an error.';
          setState('error', lastError);
        }
        return;
      }
      if (eventType === 'phx_error') {
        joined = false;
        lastError = 'Realtime channel connection was interrupted.';
        scheduleReconnect();
        return;
      }
      if (eventType === 'phx_close') {
        joined = false;
        lastError = 'Realtime channel closed unexpectedly.';
        scheduleReconnect();
      }
    };

    const onClose = (): void => {
      clearHeartbeat();
      joined = false;
      socket = null;
      if (!disposed) scheduleReconnect();
    };
    const onError = (): void => {
      if (disposed) return;
      lastError = 'Realtime WebSocket transport failed.';
      setState('error', lastError);
      scheduleReconnect();
    };
    const detachSocket = (target: WebSocketLike): void => {
      target.removeEventListener('open', onOpen);
      target.removeEventListener('message', onMessage);
      target.removeEventListener('close', onClose);
      target.removeEventListener('error', onError);
    };

    function openSocket(): void {
      if (disposed) return;
      clearReconnect();
      if (socket) {
        const previous = socket;
        socket = null;
        detachSocket(previous);
        try { previous.close(); } catch {}
      }
      setState(reconnectAttempt > 0 ? 'reconnecting' : 'connecting', null);
      try {
        const nextSocket = createWebSocket(websocketEndpoint(project));
        socket = nextSocket;
        nextSocket.addEventListener('open', onOpen);
        nextSocket.addEventListener('message', onMessage);
        nextSocket.addEventListener('close', onClose);
        nextSocket.addEventListener('error', onError);
      } catch (error: unknown) {
        lastError = error instanceof Error ? error.message : 'Realtime WebSocket could not be created.';
        setState('error', lastError);
        scheduleReconnect();
      }
    }

    function updateAccessToken(nextToken: string): void {
      const normalized = String(nextToken || '').trim();
      if (!normalized) return;
      token = normalized;
      // Re-send even when the JWT string is unchanged. Supabase Realtime
      // re-evaluates private-channel RLS when access_token is received, which
      // bounds stale Board authorization after membership changes.
      if (joined) send('access_token', { access_token: token });
    }

    function dispose(): void {
      if (disposed) return;
      disposed = true;
      clearReconnect();
      clearHeartbeat();
      joined = false;
      if (socket) {
        try {
          if (socket.readyState === 1) send('phx_leave', {});
          detachSocket(socket);
          socket.close();
        } catch {}
      }
      socket = null;
      presence = Object.freeze([]);
      state = 'idle';
      lastError = null;
      publishPresence();
      publish();
    }

    openSocket();
    return Object.freeze({ snapshot, updateAccessToken, trackPresence, dispose });
  }

  return Object.freeze({ connectPrivateChannel } satisfies RealtimeClient);
}
