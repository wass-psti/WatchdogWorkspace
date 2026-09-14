export type RealtimeConnectionState = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'offline' | 'error';

export interface RealtimePresenceEntry {
  readonly presenceRef: string;
  readonly userId: string;
  readonly displayName: string;
  readonly joinedAt: string;
}

export interface RealtimeChannelSnapshot {
  readonly state: RealtimeConnectionState;
  readonly topic: string | null;
  readonly lastEventAt: number | null;
  readonly lastError: string | null;
  readonly presence: readonly RealtimePresenceEntry[];
}

export interface RealtimeChannelHandlers<TBroadcast = unknown> {
  readonly onState?: (snapshot: RealtimeChannelSnapshot) => void;
  readonly onBroadcast?: (event: string, payload: TBroadcast) => void;
  readonly onPresence?: (presence: readonly RealtimePresenceEntry[]) => void;
}

export interface RealtimePrivateChannelOptions<TBroadcast = unknown> extends RealtimeChannelHandlers<TBroadcast> {
  readonly topic: string;
  readonly presenceKey?: string | null;
  readonly presencePayload?: Readonly<Record<string, unknown>>;
}

export interface RealtimePrivateChannel {
  snapshot(): RealtimeChannelSnapshot;
  updateAccessToken(accessToken: string): void;
  trackPresence(payload?: Readonly<Record<string, unknown>>): void;
  dispose(): void;
}

export interface RealtimeClient {
  connectPrivateChannel<TBroadcast = unknown>(options: RealtimePrivateChannelOptions<TBroadcast>, accessToken: string): RealtimePrivateChannel;
}
