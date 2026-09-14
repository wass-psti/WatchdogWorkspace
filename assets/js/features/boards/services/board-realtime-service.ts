import type { AuthTransportPort } from '../../../../../src/platform/contracts/transport.ts';
import type { RealtimeClient, RealtimePresenceEntry } from '../../../../../src/platform/contracts/realtime.ts';
import type { RealtimePlatform } from '../../../../../src/platform/contracts/realtime-platform.ts';
import type {
  BoardRealtimeAction,
  BoardRealtimeChange,
  BoardRealtimeCollaborator,
  BoardRealtimeEntity,
  BoardRealtimeService,
  BoardRealtimeSnapshot,
  BoardRealtimeSubscription,
} from '../../../../../src/features/boards/contracts/realtime.ts';
import type { BoardId } from '../../../../../src/types/identifiers.ts';
import { createRealtimePlatform } from '../../../platform/realtime/realtime-platform.ts';

type UnknownRecord = Record<string, unknown>;

export interface BoardRealtimeServiceOptions {
  readonly realtime?: RealtimePlatform | null;
  /** Compatibility injection retained for the certified M20 execution harness. */
  readonly client?: RealtimeClient | null;
  readonly tokenRefreshMs?: number;
  readonly setIntervalFn?: typeof globalThis.setInterval;
  readonly clearIntervalFn?: typeof globalThis.clearInterval;
  readonly now?: () => number;
}

const recordOf = (value: unknown): UnknownRecord | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
const stringOf = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const CHANGE_EVENT = 'board-change';
const ENTITIES = new Set<BoardRealtimeEntity>(['board', 'member', 'group', 'item', 'column', 'cell', 'update', 'file']);
const ACTIONS = new Set<BoardRealtimeAction>(['INSERT', 'UPDATE', 'DELETE']);

export function normalizeBoardRealtimeChange(value: unknown, expectedBoardId?: string): BoardRealtimeChange | null {
  const record = recordOf(value);
  if (!record) return null;
  const boardId = stringOf(record.board_id ?? record.boardId);
  const entity = stringOf(record.entity).toLowerCase() as BoardRealtimeEntity;
  const action = stringOf(record.action).toUpperCase() as BoardRealtimeAction;
  if (!boardId || (expectedBoardId && boardId !== expectedBoardId) || !ENTITIES.has(entity) || !ACTIONS.has(action)) return null;
  const occurredAt = stringOf(record.occurred_at ?? record.occurredAt) || new Date().toISOString();
  return Object.freeze({
    boardId,
    entity,
    entityId: stringOf(record.entity_id ?? record.entityId) || null,
    itemId: stringOf(record.item_id ?? record.itemId) || null,
    action,
    actorId: stringOf(record.actor_id ?? record.actorId) || null,
    occurredAt,
  });
}

export function normalizeBoardRealtimeCollaborators(entries: readonly RealtimePresenceEntry[]): readonly BoardRealtimeCollaborator[] {
  const seen = new Set<string>();
  const output: BoardRealtimeCollaborator[] = [];
  for (const entry of entries) {
    const userId = stringOf(entry.userId);
    if (!userId || seen.has(userId)) continue;
    seen.add(userId);
    output.push(Object.freeze({
      userId,
      displayName: stringOf(entry.displayName) || 'Collaborator',
      presenceRef: stringOf(entry.presenceRef) || userId,
      joinedAt: stringOf(entry.joinedAt) || new Date().toISOString(),
    }));
  }
  return Object.freeze(output);
}

export function createBoardRealtimeService(auth: AuthTransportPort, options: BoardRealtimeServiceOptions = {}): BoardRealtimeService {
  const now = options.now ?? Date.now;
  const realtime = options.realtime ?? createRealtimePlatform({
    auth,
    client: options.client ?? null,
    ...(options.tokenRefreshMs === undefined ? {} : { tokenRefreshMs: options.tokenRefreshMs }),
    ...(options.setIntervalFn === undefined ? {} : { setIntervalFn: options.setIntervalFn }),
    ...(options.clearIntervalFn === undefined ? {} : { clearIntervalFn: options.clearIntervalFn }),
    now,
    enabledNamespaces: ['board'],
  });

  async function subscribe(boardIdInput: BoardId, handlers: Readonly<{ onChange(change: BoardRealtimeChange): void; onSnapshot(snapshot: BoardRealtimeSnapshot): void }>): Promise<BoardRealtimeSubscription> {
    const boardId = stringOf(boardIdInput);
    if (!boardId) throw new TypeError('Board Realtime subscription requires a Board ID.');
    if (!auth.isAuthenticated) throw new Error('Board Realtime requires an authenticated session.');
    const userId = stringOf(auth.user?.id);
    if (!userId) throw new Error('Board Realtime requires an authenticated user identity.');

    let disposed = false;
    let collaborators: readonly BoardRealtimeCollaborator[] = Object.freeze([]);
    let latest: BoardRealtimeSnapshot = Object.freeze({ state: 'connecting', boardId, collaborators, lastEventAt: null, lastError: null, fallbackPolling: false });
    const publish = (patch: Partial<BoardRealtimeSnapshot> = {}): void => {
      latest = Object.freeze({ ...latest, ...patch, boardId, collaborators });
      handlers.onSnapshot(latest);
    };

    const subscription = await realtime.subscribe<unknown>({
      topic: Object.freeze({ namespace: 'board', key: boardId }),
      presenceKey: userId,
      presencePayload: Object.freeze({ user_id: userId, display_name: userId, joined_at: new Date(now()).toISOString() }),
      onState: (snapshot) => publish({ state: snapshot.state, lastEventAt: snapshot.lastEventAt, lastError: snapshot.lastError }),
      onPresence: (presence) => {
        collaborators = normalizeBoardRealtimeCollaborators(presence);
        publish({ collaborators });
      },
      onBroadcast: (event, payload) => {
        if (event !== CHANGE_EVENT) return;
        const change = normalizeBoardRealtimeChange(payload, boardId);
        if (!change) return;
        publish({ lastEventAt: now(), lastError: null });
        handlers.onChange(change);
      },
    });

    async function refreshAccessToken(): Promise<void> {
      if (disposed) return;
      await subscription.refreshAccessToken();
    }

    function dispose(): void {
      if (disposed) return;
      disposed = true;
      subscription.dispose();
      collaborators = Object.freeze([]);
      latest = Object.freeze({ state: 'idle', boardId: null, collaborators, lastEventAt: latest.lastEventAt, lastError: null, fallbackPolling: false });
      handlers.onSnapshot(latest);
    }

    publish(subscription.snapshot());
    return Object.freeze({ snapshot: () => latest, refreshAccessToken, dispose });
  }

  return Object.freeze({ subscribe });
}
