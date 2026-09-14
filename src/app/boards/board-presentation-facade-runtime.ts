export type BoardPresentationView = 'hidden' | 'boards' | 'board';

export interface BoardPresentationFacadeSnapshot {
  readonly view: BoardPresentationView;
  readonly boardId: string | null;
  readonly revision: number;
}

const DEFAULT_SNAPSHOT: BoardPresentationFacadeSnapshot = Object.freeze({
  view: 'hidden',
  boardId: null,
  revision: 0,
});

let snapshot = DEFAULT_SNAPSHOT;
const listeners = new Set<() => void>();

function publish(view: BoardPresentationView, boardId: string | null): BoardPresentationFacadeSnapshot {
  const normalizedBoardId = view === 'board' ? String(boardId ?? '').trim() || null : null;
  if (view === snapshot.view && normalizedBoardId === snapshot.boardId) return snapshot;
  snapshot = Object.freeze({ view, boardId: normalizedBoardId, revision: snapshot.revision + 1 });
  for (const listener of listeners) listener();
  return snapshot;
}

export const boardPresentationFacadeRuntime = Object.freeze({
  getSnapshot: (): BoardPresentationFacadeSnapshot => snapshot,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  showBoards(): BoardPresentationFacadeSnapshot {
    return publish('boards', null);
  },
  showBoard(boardId: string): BoardPresentationFacadeSnapshot {
    const normalized = String(boardId ?? '').trim();
    if (!normalized) throw new TypeError('Board presentation requires a board identifier.');
    return publish('board', normalized);
  },
  hide(): BoardPresentationFacadeSnapshot {
    return publish('hidden', null);
  },
  resetForTest(): BoardPresentationFacadeSnapshot {
    snapshot = DEFAULT_SNAPSHOT;
    for (const listener of listeners) listener();
    return snapshot;
  },
});
