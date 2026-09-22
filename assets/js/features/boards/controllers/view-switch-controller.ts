import type { BoardViewMode } from '../../../../../src/features/boards/contracts/domain.ts';
import type { BoardId } from '../../../../../src/types/identifiers.ts';
import type { ToastRenderer } from '../../../../../src/platform/contracts/ui.ts';

export interface BoardViewSwitchControllerDependencies {
  readonly getBoardIdentity: () => Readonly<{ id: BoardId; view: BoardViewMode }> | null;
  readonly applyLocalView: (boardId: BoardId, view: BoardViewMode) => void;
  readonly persistView: (boardId: BoardId, view: BoardViewMode) => Promise<void>;
  readonly renderBoard: () => void;
  readonly toast: ToastRenderer;
}

export interface BoardViewSwitchController {
  adopt(boardId: BoardId, view: BoardViewMode): void;
  request(view: BoardViewMode): Promise<boolean>;
  reset(): void;
  readonly pending: boolean;
  readonly confirmedView: BoardViewMode | null;
  readonly desiredView: BoardViewMode | null;
}

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : 'The Board view could not be changed.';

/**
 * Serializes Table/Kanban persistence while keeping rendering optimistic.
 * A failed latest request rolls back to the last server-confirmed view. Older
 * failures never overwrite a newer desired view that is still queued.
 */
export function createBoardViewSwitchController({
  getBoardIdentity,
  applyLocalView,
  persistView,
  renderBoard,
  toast,
}: BoardViewSwitchControllerDependencies): BoardViewSwitchController {
  let boardId: BoardId | null = null;
  let confirmed: BoardViewMode | null = null;
  let desired: BoardViewMode | null = null;
  let queue: Promise<void> = Promise.resolve();
  let pendingCount = 0;
  let latestTicket = 0;

  function reset(): void {
    boardId = null;
    confirmed = null;
    desired = null;
    pendingCount = 0;
    latestTicket += 1;
    queue = Promise.resolve();
  }

  function adopt(nextBoardId: BoardId, view: BoardViewMode): void {
    if (pendingCount > 0 && String(boardId) === String(nextBoardId)) return;
    boardId = nextBoardId;
    confirmed = view;
    desired = view;
  }

  async function request(view: BoardViewMode): Promise<boolean> {
    const identity = getBoardIdentity();
    if (!identity) return false;
    if (String(boardId) !== String(identity.id) || confirmed === null) adopt(identity.id, identity.view);
    const activeBoardId = identity.id;
    if (desired === view && pendingCount === 0 && confirmed === view) return true;

    desired = view;
    applyLocalView(activeBoardId, view);
    renderBoard();
    const ticket = ++latestTicket;
    pendingCount += 1;

    let result = false;
    const task = queue.then(async () => {
      try {
        await persistView(activeBoardId, view);
        if (String(boardId) === String(activeBoardId)) confirmed = view;
        result = true;
      } catch (error) {
        const stillCurrentBoard = String(boardId) === String(activeBoardId);
        const isLatestIntent = ticket === latestTicket && desired === view;
        if (stillCurrentBoard && isLatestIntent && confirmed) {
          desired = confirmed;
          applyLocalView(activeBoardId, confirmed);
          renderBoard();
        }
        toast(`${errorMessage(error)}${stillCurrentBoard && isLatestIntent ? ' The previous view was restored.' : ''}`, 'warning');
        result = false;
      } finally {
        pendingCount = Math.max(0, pendingCount - 1);
      }
    });
    queue = task.catch(() => undefined);
    await task;
    return result;
  }

  return Object.freeze({
    adopt,
    request,
    reset,
    get pending() { return pendingCount > 0; },
    get confirmedView() { return confirmed; },
    get desiredView() { return desired; },
  });
}
