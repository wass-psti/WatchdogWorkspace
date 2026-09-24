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
  readonly syncRetryMs?: number;
  readonly fallbackPollMs?: number;
  readonly setTimeoutFn?: typeof globalThis.setTimeout;
  readonly clearTimeoutFn?: typeof globalThis.clearTimeout;
  readonly setIntervalFn?: typeof globalThis.setInterval;
  readonly clearIntervalFn?: typeof globalThis.clearInterval;
}

const COALESCE_MS = 100;
const INTERACTION_DEFERRAL_MS = 250;
const SYNC_RETRY_MS = 1_000;
const FALLBACK_POLL_MS = 30_000;
const isDegraded = (state: BoardRealtimeSnapshot['state']): boolean => state === 'reconnecting' || state === 'offline' || state === 'error';

export function createBoardRealtimeController(options: BoardRealtimeControllerOptions) {
  const coalesceMs = options.coalesceMs ?? COALESCE_MS;
  const interactionDeferralMs = options.interactionDeferralMs ?? INTERACTION_DEFERRAL_MS;
  const syncRetryMs = options.syncRetryMs ?? SYNC_RETRY_MS;
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
  let syncRequested = false;
  let syncInFlight = false;
  let syncFailureCount = 0;
  let lastSnapshot: BoardRealtimeSnapshot = Object.freeze({ state: 'idle', boardId: null, collaborators: [], lastEventAt: null, lastError: null, fallbackPolling: false });

  const stopFallback = (): void => {
    if (fallbackTimer !== null) clearIntervalFn(fallbackTimer);
    fallbackTimer = null;
  };
  const publishCurrentSnapshot = (patch: Partial<BoardRealtimeSnapshot> = {}): void => {
    lastSnapshot = Object.freeze({ ...lastSnapshot, ...patch, fallbackPolling: fallbackTimer !== null });
    options.onSnapshot(lastSnapshot);
  };
  const canonicalReload = async (boardId: BoardId): Promise<void> => {
    options.boardService.invalidate();
    await options.reloadBoard(boardId);
  };
  const startFallback = (): void => {
    if (fallbackTimer !== null || !currentBoardId) return;
    const boardId = currentBoardId;
    fallbackTimer = setIntervalFn(() => {
      if (currentBoardId !== boardId || options.shouldDeferSync?.() || syncInFlight) return;
      syncInFlight = true;
      void canonicalReload(boardId)
        .catch((error: unknown) => options.onWarning?.(error instanceof Error ? error.message : 'Fallback Board synchronization failed.'))
        .finally(() => { syncInFlight = false; });
    }, fallbackPollMs);
  };
  const scheduleFlush = (expectedGeneration: number, delay: number): void => {
    if (flushTimer !== null) return;
    flushTimer = setTimeoutFn(() => { void flush(expectedGeneration); }, delay);
  };
  const requestSync = (delay = coalesceMs): void => {
    if (!currentBoardId) return;
    syncRequested = true;
    scheduleFlush(generation, delay);
  };
  const publishSnapshot = (snapshot: BoardRealtimeSnapshot): void => {
    const wasDegraded = isDegraded(lastSnapshot.state);
    const degraded = isDegraded(snapshot.state);
    if (degraded) startFallback();
    else if (syncFailureCount === 0) stopFallback();
    lastSnapshot = Object.freeze({ ...snapshot, fallbackPolling: fallbackTimer !== null });
    options.onSnapshot(lastSnapshot);
    if (snapshot.state === 'live' && wasDegraded) requestSync(0);
  };

  async function flush(expectedGeneration: number): Promise<void> {
    flushTimer = null;
    if (expectedGeneration !== generation || !currentBoardId || !syncRequested || syncInFlight) return;
    if (options.shouldDeferSync?.()) {
      scheduleFlush(expectedGeneration, interactionDeferralMs);
      return;
    }
    const boardId = currentBoardId;
    const changes = pendingChanges;
    pendingChanges = [];
    syncRequested = false;
    syncInFlight = true;
    const activeItemIds = new Set(changes.map((change) => change.itemId).filter((value): value is string => Boolean(value)));
    try {
      await canonicalReload(boardId);
      if (expectedGeneration !== generation) return;
      for (const itemId of activeItemIds) await options.reloadItemWorkspace?.(itemId);
      syncFailureCount = 0;
      if (!isDegraded(lastSnapshot.state)) stopFallback();
      publishCurrentSnapshot({ lastError: null });
    } catch (error: unknown) {
      if (expectedGeneration !== generation) return;
      pendingChanges = [...changes, ...pendingChanges];
      syncRequested = true;
      syncFailureCount += 1;
      startFallback();
      const message = error instanceof Error ? error.message : 'Live Board changes could not be synchronized.';
      options.onWarning?.(message);
      publishCurrentSnapshot({ lastError: message });
      scheduleFlush(expectedGeneration, Math.min(syncRetryMs * syncFailureCount, 5_000));
    } finally {
      syncInFlight = false;
      if (expectedGeneration === generation && syncRequested && flushTimer === null && !options.shouldDeferSync?.()) scheduleFlush(expectedGeneration, coalesceMs);
    }
  }

  const onChange = (change: BoardRealtimeChange): void => {
    if (!currentBoardId || String(change.boardId) !== String(currentBoardId)) return;
    pendingChanges.push(change);
    requestSync();
  };

  async function connect(boardIdInput: BoardId): Promise<void> {
    const boardId = String(boardIdInput || '').trim() as BoardId;
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
    syncRequested = false;
    syncInFlight = false;
    syncFailureCount = 0;
    if (flushTimer !== null) clearTimeoutFn(flushTimer);
    flushTimer = null;
    stopFallback();
    lastSnapshot = Object.freeze({ state: 'idle', boardId: null, collaborators: [], lastEventAt: lastSnapshot.lastEventAt, lastError: null, fallbackPolling: false });
    options.onSnapshot(lastSnapshot);
  }

  return Object.freeze({ connect, disconnect, snapshot: () => lastSnapshot });
}
