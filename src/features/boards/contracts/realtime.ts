import type { BoardId, BoardItemId, UserId } from '../../../types/identifiers.ts';
import type { RealtimeConnectionState } from '../../../platform/contracts/realtime.ts';

export type BoardRealtimeEntity = 'board' | 'member' | 'group' | 'item' | 'column' | 'cell' | 'update' | 'file';
export type BoardRealtimeAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface BoardRealtimeChange {
  readonly boardId: BoardId;
  readonly entity: BoardRealtimeEntity;
  readonly entityId: string | null;
  readonly itemId: BoardItemId | null;
  readonly action: BoardRealtimeAction;
  readonly actorId: UserId | null;
  readonly occurredAt: string;
}

export interface BoardRealtimeCollaborator {
  readonly userId: UserId;
  readonly displayName: string;
  readonly presenceRef: string;
  readonly joinedAt: string;
}

export interface BoardRealtimeSnapshot {
  readonly state: RealtimeConnectionState;
  readonly boardId: BoardId | null;
  readonly collaborators: readonly BoardRealtimeCollaborator[];
  readonly lastEventAt: number | null;
  readonly lastError: string | null;
  readonly fallbackPolling: boolean;
}

export interface BoardRealtimeSubscription {
  snapshot(): BoardRealtimeSnapshot;
  refreshAccessToken(): Promise<void>;
  dispose(): void;
}

export interface BoardRealtimeService {
  subscribe(
    boardId: BoardId,
    handlers: Readonly<{
      onChange(change: BoardRealtimeChange): void;
      onSnapshot(snapshot: BoardRealtimeSnapshot): void;
    }>,
  ): Promise<BoardRealtimeSubscription>;
}
