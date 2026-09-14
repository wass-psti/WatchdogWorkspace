import type { BoardDomainService } from '../../../../../src/features/boards/contracts/service.ts';
import type { BoardRealtimeChange, BoardRealtimeService, BoardRealtimeSnapshot, BoardRealtimeSubscription } from '../../../../../src/features/boards/contracts/realtime.ts';
import type { BoardId } from '../../../../../src/types/identifiers.ts';

export interface BoardRealtimeControllerOptions {
  readonly service: BoardRealtimeService;
  readonly boardService: BoardDomainService;
  readonly reloadBoard: (boardId: BoardId) => Promise<unknown>;
  readonly reloadItemWorkspace?: (itemId: string) => Promise<unknown>;
  readonly onSnapshot: (snapshot: BoardRealtimeSnapshot) => void;
  readonly onWarning?: (message: string) => void;
  readonly shouldDeferSync?: () => boolean;
  readonly coalesceMs?: number;
  readonly interactionDeferralMs?: number;
  readonly fallbackPollMs?: number;
  readonly setTimeoutFn?: typeof globalThis.setTimeout;
  readonly clearTimeoutFn?: typeof globalThis.clearTimeout;
  readonly setIntervalFn?: typeof globalThis.setInterval;
  readonly clearIntervalFn?: typeof globalThis.clearInterval;
}

const COALESCE_MS = 100;
const INTERACTION_DEFERRAL_MS = 250;
const FALLBACK_POLL_MS = 30_000;

export function createBoardRealtimeController(options: BoardRealtimeControllerOptions) {
  const coalesceMs = options.coalesceMs ?? COALESCE_MS;
  const interactionDeferralMs = options.interactionDeferralMs ?? INTERACTION_DEFERRAL_MS;
  const fallbackPollMs = options.fallbackPollMs ?? FALLBACK_POLL_MS;
  const setTimeoutFn = options.setTimeoutFn ?? globalThis.setTimeout.bind(globalThis);
  const clearTimeoutFn = options.clearTimeoutFn ?? globalThis.clearTimeout.bind(globalThis);
  const setIntervalFn = options.setIntervalFn ?? globalThis.setInterval.bind(globalThis);
  const clearIntervalFn = options.clearIntervalFn ?? globalThis.clearInterval.bind(globalThis);

  let currentBoardId: BoardId | null = null;
  let subscription: BoardRealtimeSubscription | null = null;
  let generation = 0;
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let fallbackTimer: ReturnType<typeof setInterval> | null = null;
  let pendingChanges: BoardRealtimeChange[] = [];
  let lastSnapshot: BoardRealtimeSnapshot = Object.freeze({ state: 'idle', boardId: null, collaborators: [], lastEventAt: null, lastError: null, fallbackPolling: false });

  const stopFallback = (): void => {
    if (fallbackTimer !== null) clearIntervalFn(fallbackTimer);
    fallbackTimer = null;
  };
  const startFallback = (): void => {
    if (fallbackTimer !== null || !currentBoardId) return;
    const boardId = currentBoardId;
    fallbackTimer = setIntervalFn(() => {
      if (currentBoardId !== boardId) return;
      options.boardService.invalidate();
      void options.reloadBoard(boardId).catch(() => {});
    }, fallbackPollMs);
  };
  const publishSnapshot = (snapshot: BoardRealtimeSnapshot): void => {
    const degraded = snapshot.state === 'reconnecting' || snapshot.state === 'offline' || snapshot.state === 'error';
    if (degraded) startFallback(); else stopFallback();
    lastSnapshot = Object.freeze({ ...snapshot, fallbackPolling: degraded && fallbackTimer !== null });
    options.onSnapshot(lastSnapshot);
  };

  async function flush(expectedGeneration: number): Promise<void> {
    flushTimer = null;
    if (expectedGeneration !== generation || !currentBoardId || pendingChanges.length === 0) return;
    if (options.shouldDeferSync?.()) {
      flushTimer = setTimeoutFn(() => { void flush(expectedGeneration); }, interactionDeferralMs);
      return;
    }
    const boardId = currentBoardId;
    const changes = pendingChanges;
    pendingChanges = [];
    const activeItemIds = new Set(changes.map((change) => change.itemId).filter((value): value is string => Boolean(value)));
    try {
      options.boardService.invalidate();
      await options.reloadBoard(boardId);
      if (expectedGeneration !== generation) return;
      for (const itemId of activeItemIds) await options.reloadItemWorkspace?.(itemId);
    } catch (error: unknown) {
      options.onWarning?.(error instanceof Error ? error.message : 'Live Board changes could not be synchronized.');
    }
  }

  const onChange = (change: BoardRealtimeChange): void => {
    if (!currentBoardId || String(change.boardId) !== String(currentBoardId)) return;
    pendingChanges.push(change);
    if (flushTimer !== null) return;
    const expectedGeneration = generation;
    flushTimer = setTimeoutFn(() => { void flush(expectedGeneration); }, coalesceMs);
  };

  async function connect(boardIdInput: BoardId): Promise<void> {
    const boardId = String(boardIdInput || '').trim();
    if (!boardId) return;
    if (currentBoardId === boardId && subscription) return;
    disconnect();
    currentBoardId = boardId;
    const expectedGeneration = ++generation;
    publishSnapshot(Object.freeze({ state: 'connecting', boardId, collaborators: [], lastEventAt: null, lastError: null, fallbackPolling: false }));
    try {
      const next = await options.service.subscribe(boardId, { onChange, onSnapshot: publishSnapshot });
      if (expectedGeneration !== generation || currentBoardId !== boardId) {
        next.dispose();
        return;
      }
      subscription = next;
    } catch (error: unknown) {
      if (expectedGeneration !== generation) return;
      publishSnapshot(Object.freeze({
        state: 'error',
        boardId,
        collaborators: [],
        lastEventAt: null,
        lastError: error instanceof Error ? error.message : 'Board Realtime could not connect.',
        fallbackPolling: true,
      }));
      startFallback();
    }
  }

  function disconnect(): void {
    generation += 1;
    currentBoardId = null;
    subscription?.dispose();
    subscription = null;
    pendingChanges = [];
    if (flushTimer !== null) clearTimeoutFn(flushTimer);
    flushTimer = null;
    stopFallback();
    lastSnapshot = Object.freeze({ state: 'idle', boardId: null, collaborators: [], lastEventAt: lastSnapshot.lastEventAt, lastError: null, fallbackPolling: false });
    options.onSnapshot(lastSnapshot);
  }

  return Object.freeze({ connect, disconnect, snapshot: () => lastSnapshot });
}
