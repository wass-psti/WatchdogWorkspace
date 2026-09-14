import type { DiagnosticsPort } from './diagnostics.ts';
import type { RealtimeChannelSnapshot, RealtimeClient, RealtimePresenceEntry } from './realtime.ts';
import type { AuthTransportPort } from './transport.ts';

export type RealtimeTopicNamespace = 'board' | 'module' | 'platform';

export interface RealtimeTopicDescriptor {
  readonly namespace: RealtimeTopicNamespace;
  readonly key: string;
}

export interface ResolvedRealtimeTopic extends RealtimeTopicDescriptor {
  readonly topic: string;
  readonly enabled: boolean;
}

export interface RealtimePlatformChannelSnapshot {
  readonly topic: string;
  readonly namespace: RealtimeTopicNamespace;
  readonly state: RealtimeChannelSnapshot['state'];
  readonly subscriberCount: number;
  readonly presenceCount: number;
  readonly lastEventAt: number | null;
  readonly lastError: string | null;
}

export interface RealtimePlatformSnapshot {
  readonly activeChannelCount: number;
  readonly activeSubscriptionCount: number;
  readonly liveChannelCount: number;
  readonly degradedChannelCount: number;
  readonly lastTokenRefreshAt: number | null;
  readonly lastError: string | null;
  readonly channels: readonly RealtimePlatformChannelSnapshot[];
}

export interface RealtimePlatformSubscriptionOptions<TBroadcast = unknown> {
  readonly topic: RealtimeTopicDescriptor;
  readonly presenceKey?: string | null;
  readonly presencePayload?: Readonly<Record<string, unknown>>;
  readonly onState?: (snapshot: RealtimeChannelSnapshot) => void;
  readonly onBroadcast?: (event: string, payload: TBroadcast) => void;
  readonly onPresence?: (presence: readonly RealtimePresenceEntry[]) => void;
}

export interface RealtimePlatformSubscription {
  readonly id: string;
  readonly topic: string;
  snapshot(): RealtimeChannelSnapshot;
  refreshAccessToken(): Promise<void>;
  trackPresence(payload?: Readonly<Record<string, unknown>>): void;
  dispose(): void;
}

export interface RealtimePlatform {
  resolveTopic(descriptor: RealtimeTopicDescriptor): ResolvedRealtimeTopic;
  subscribe<TBroadcast = unknown>(options: RealtimePlatformSubscriptionOptions<TBroadcast>): Promise<RealtimePlatformSubscription>;
  refreshAccessToken(): Promise<void>;
  snapshot(): RealtimePlatformSnapshot;
  dispose(): void;
}

export interface RealtimePlatformOptions {
  readonly auth: AuthTransportPort;
  readonly client?: RealtimeClient | null;
  readonly diagnostics?: DiagnosticsPort | null;
  readonly enabledNamespaces?: readonly RealtimeTopicNamespace[];
  readonly tokenRefreshMs?: number;
  readonly maxChannels?: number;
  readonly setIntervalFn?: typeof globalThis.setInterval;
  readonly clearIntervalFn?: typeof globalThis.clearInterval;
  readonly now?: () => number;
}
