import type { BoardCommandService } from '../../../../../src/features/boards/contracts/commands.ts';
import type { BoardItem } from '../../../../../src/features/boards/contracts/domain.ts';
import type { MutableBoardViewState } from '../../../../../src/features/boards/contracts/view-state.ts';
import type { ToastRenderer } from '../../../../../src/platform/contracts/ui.ts';
import type { BoardGroupId, BoardItemId, StatusLabelId } from '../../../../../src/types/identifiers.ts';
import type { BoardHistoryController } from './history-controller.ts';
import {
  applyBoardItemMove,
  assertUniqueCanonicalItemIds,
  restoreBoardItemMoveState,
  snapshotBoardItemMoveState,
  type BoardItemMoveMode,
  type BoardItemMoveSnapshot,
} from '../services/board-move-state.ts';

interface BoardDragDropDependencies {
  readonly commands: BoardCommandService;
  readonly state: MutableBoardViewState;
  readonly canEdit: () => boolean;
  readonly getItems: () => readonly BoardItem[];
  readonly toast: ToastRenderer;
  readonly renderBoard: () => void;
  readonly history?: BoardHistoryController | null;
  readonly isBlocked?: (() => boolean) | null;
}

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : 'The item could not be moved.';
const eventElement = (event: Event): Element | null => event.target instanceof Element ? event.target : null;
const isArchived = (item: BoardItem): boolean => Boolean(item.archived || item.archived_at);
const asStatus = (value: string | undefined): StatusLabelId | null => value ? value as StatusLabelId : null;

/**
 * Work Board item drag/drop controller.
 * Supports Table reordering, cross-group movement, Kanban status movement,
 * keyboard lane movement, optimistic local updates, rollback-safe history,
 * and explicit listener cleanup.
 */
export function createBoardDragDropController({ commands, state: _state, canEdit, getItems, toast, renderBoard, history, isBlocked = null }: BoardDragDropDependencies) {
  let dragItemId: BoardItemId | null = null;
  let cleanup: (() => void) | null = null;
  let pendingMutation = false;
  const blocked = (): boolean => pendingMutation || Boolean(isBlocked?.());

  const clearVisualState = (root: HTMLElement | null): void => {
    root?.querySelectorAll<HTMLElement>('.dragging').forEach((node) => {
      node.classList.remove('dragging');
      node.removeAttribute('aria-grabbed');
    });
    root?.querySelectorAll<HTMLElement>('.drag-over,.item-drop-before,.item-drop-after').forEach((node) => node.classList.remove('drag-over', 'item-drop-before', 'item-drop-after'));
  };

  function announce(root: HTMLElement, message: string): void {
    let live = root.querySelector<HTMLElement>('[data-board-drag-live]');
    if (!live) {
      live = document.createElement('div');
      live.className = 'wm-visually-hidden';
      live.dataset.boardDragLive = '1';
      live.setAttribute('role', 'status');
      live.setAttribute('aria-live', 'polite');
      root.appendChild(live);
    }
    live.textContent = '';
    requestAnimationFrame(() => { if (live) live.textContent = message; });
  }

  function setPending(root: HTMLElement | null, pending: boolean): void {
    pendingMutation = pending;
    if (!root) return;
    root.classList.toggle('board-item-mutation-pending', pending);
    if (pending) root.setAttribute('aria-busy', 'true');
    else root.removeAttribute('aria-busy');
  }

  function reset(root: HTMLElement | null = null): void {
    dragItemId = null;
    clearVisualState(root);
  }

  function restoreItemFocus(root: HTMLElement, itemId: BoardItemId, selector: 'table' | 'kanban'): void {
    requestAnimationFrame(() => {
      const attr = selector === 'kanban' ? 'data-kanban-item-drag' : 'data-item-drag';
      root.querySelector<HTMLElement>(`[${attr}="${CSS.escape(String(itemId))}"]`)?.focus();
    });
  }

  async function persistSnapshot(
    root: HTMLElement,
    items: readonly BoardItem[],
    itemId: BoardItemId,
    target: readonly BoardItemMoveSnapshot[],
    rollback: readonly BoardItemMoveSnapshot[],
    focus: 'table' | 'kanban' | null = null,
  ): Promise<void> {
    if (blocked()) throw new Error('Wait for the current Board movement to finish before changing Board order again.');
    setPending(root, true);
    try {
      restoreBoardItemMoveState(items, target);
      renderBoard();
      if (focus) restoreItemFocus(root, itemId, focus);
      const moved = items.find((entry) => String(entry.id) === String(itemId));
      if (!moved) throw new Error('The moved Board item is no longer available. Reload the Board before retrying.');
      try {
        await commands.moveItem({ itemId: moved.id, groupId: moved.group_id, position: moved.position, status: moved.status });
      } catch (error) {
        restoreBoardItemMoveState(items, rollback);
        renderBoard();
        if (focus) restoreItemFocus(root, itemId, focus);
        throw error;
      }
    } finally {
      setPending(root, false);
    }
  }

  function pushMoveHistory(root: HTMLElement, items: readonly BoardItem[], itemId: BoardItemId, before: readonly BoardItemMoveSnapshot[], after: readonly BoardItemMoveSnapshot[], focus: 'table' | 'kanban' | null): void {
    history?.push({
      label: 'item move',
      undo: () => persistSnapshot(root, items, itemId, before, after, focus),
      redo: () => persistSnapshot(root, items, itemId, after, before, focus),
    });
  }

  async function keyboardReorder(root: HTMLElement, itemId: BoardItemId, targetPosition: number): Promise<void> {
    if (!canEdit()) return;
    if (blocked()) { announce(root, 'Wait for the current Board movement to finish.'); return; }
    const items = getItems();
    assertUniqueCanonicalItemIds(items);
    const item = items.find((entry) => String(entry.id) === String(itemId));
    if (!item || isArchived(item)) return;
    const peers = items
      .filter((entry) => !isArchived(entry) && String(entry.group_id) === String(item.group_id))
      .sort((a, b) => a.position - b.position || String(a.id).localeCompare(String(b.id)));
    const currentIndex = peers.findIndex((entry) => String(entry.id) === String(item.id));
    if (currentIndex < 0) return;
    const nextIndex = Math.max(0, Math.min(targetPosition, peers.length - 1));
    if (nextIndex === currentIndex) {
      announce(root, 'Item is already at that boundary.');
      return;
    }

    const before = snapshotBoardItemMoveState(items);
    setPending(root, true);
    applyBoardItemMove(items, item, item.group_id, nextIndex, item.status, 'positioned');
    const after = snapshotBoardItemMoveState(items);
    renderBoard();
    restoreItemFocus(root, item.id, 'table');
    try {
      await commands.moveItem({ itemId: item.id, groupId: item.group_id, position: item.position, status: item.status });
      announce(root, `Item moved to position ${nextIndex + 1} of ${peers.length}.`);
      pushMoveHistory(root, items, item.id, before, after, 'table');
    } catch (error) {
      restoreBoardItemMoveState(items, before);
      renderBoard();
      restoreItemFocus(root, item.id, 'table');
      toast(errorMessage(error), 'warning');
      announce(root, 'Item could not be reordered.');
    } finally {
      setPending(root, false);
    }
  }

  async function keyboardMoveKanban(root: HTMLElement, handle: HTMLElement, itemId: BoardItemId, key: string): Promise<void> {
    if (!canEdit()) return;
    if (blocked()) { announce(root, 'Wait for the current Board movement to finish.'); return; }
    const items = getItems();
    assertUniqueCanonicalItemIds(items);
    const item = items.find((entry) => String(entry.id) === String(itemId));
    if (!item || isArchived(item)) return;

    const allLanes = [...root.querySelectorAll<HTMLElement>('[data-kanban-lane]')];
    const currentLane = handle.closest<HTMLElement>('[data-kanban-lane]');
    const currentLaneIndex = currentLane ? allLanes.indexOf(currentLane) : -1;
    const targetLanes = allLanes.filter((lane) => Object.prototype.hasOwnProperty.call(lane.dataset, 'dropStatus'));
    if (!targetLanes.length) {
      announce(root, 'No active status lane is available.');
      return;
    }

    let targetLane: HTMLElement | undefined;
    if (key === 'Home') targetLane = targetLanes[0];
    else if (key === 'End') targetLane = targetLanes.at(-1);
    else if (key === 'ArrowRight') targetLane = allLanes.slice(currentLaneIndex + 1).find((lane) => Object.prototype.hasOwnProperty.call(lane.dataset, 'dropStatus'));
    else if (key === 'ArrowLeft') targetLane = allLanes.slice(0, Math.max(0, currentLaneIndex)).reverse().find((lane) => Object.prototype.hasOwnProperty.call(lane.dataset, 'dropStatus'));
    if (!targetLane) {
      announce(root, 'Item is already at that status boundary.');
      return;
    }

    const nextStatus = asStatus(targetLane.dataset.dropStatus);
    if (String(nextStatus ?? '') === String(item.status ?? '')) {
      announce(root, 'Item is already in that status lane.');
      return;
    }

    const before = snapshotBoardItemMoveState(items);
    setPending(root, true);
    applyBoardItemMove(items, item, item.group_id, item.position, nextStatus, 'status-only');
    const after = snapshotBoardItemMoveState(items);
    renderBoard();
    restoreItemFocus(root, item.id, 'kanban');
    try {
      await commands.moveItem({ itemId: item.id, groupId: item.group_id, position: item.position, status: item.status });
      const laneName = targetLane.dataset.kanbanLaneName || 'selected status';
      announce(root, `Item moved to ${laneName}.`);
      pushMoveHistory(root, items, item.id, before, after, 'kanban');
    } catch (error) {
      restoreBoardItemMoveState(items, before);
      renderBoard();
      restoreItemFocus(root, item.id, 'kanban');
      toast(errorMessage(error), 'warning');
      announce(root, 'Item status could not be changed.');
    } finally {
      setPending(root, false);
    }
  }

  function bind(root: HTMLElement): () => void {
    cleanup?.();
    const abort = new AbortController();
    const options: AddEventListenerOptions = { signal: abort.signal };

    root.addEventListener('keydown', (event: KeyboardEvent) => {
      const target = eventElement(event);
      const kanbanHandle = target?.closest<HTMLElement>('[data-kanban-item-drag]') ?? null;
      if (kanbanHandle && canEdit() && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        const id = kanbanHandle.dataset.kanbanItemDrag;
        if (!id) return;
        event.preventDefault();
        void keyboardMoveKanban(root, kanbanHandle, id, event.key);
        return;
      }

      const handle = target?.closest<HTMLElement>('[data-item-drag]') ?? null;
      if (!handle || !canEdit() || handle.closest<HTMLElement>('[data-item-id]')?.getAttribute('draggable') !== 'true' || !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      const id = handle.dataset.itemDrag;
      if (!id) return;
      const item = getItems().find((entry) => String(entry.id) === String(id));
      if (!item || isArchived(item)) return;
      const peers = getItems()
        .filter((entry) => !isArchived(entry) && String(entry.group_id) === String(item.group_id))
        .sort((a, b) => a.position - b.position || String(a.id).localeCompare(String(b.id)));
      const current = peers.findIndex((entry) => String(entry.id) === String(id));
      if (current < 0) return;
      let next = current;
      if (event.key === 'ArrowUp') next = Math.max(0, current - 1);
      if (event.key === 'ArrowDown') next = Math.min(peers.length - 1, current + 1);
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = peers.length - 1;
      event.preventDefault();
      void keyboardReorder(root, id, next);
    }, options);

    root.addEventListener('dragstart', (event: DragEvent) => {
      const target = eventElement(event);
      if (!target || target.closest('[data-column-drag],[data-group-drag]')) return;
      if (blocked()) { announce(root, 'Wait for the current Board movement to finish.'); return; }
      const interactive = target.closest('button,input,select,textarea,a,summary,[contenteditable="true"]');
      if (interactive && !target.closest('.drag-handle,.kanban-drag-handle')) return;
      const item = target.closest<HTMLElement>('[data-item-id]');
      if (!item || !canEdit() || item.getAttribute('draggable') !== 'true' || !event.dataTransfer) return;
      const id = item.dataset.itemId;
      if (!id) return;
      const record = getItems().find((entry) => String(entry.id) === String(id));
      if (!record || isArchived(record)) return;
      dragItemId = id;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', id);
      item.classList.add('dragging');
      item.setAttribute('aria-grabbed', 'true');
      announce(root, 'Item picked up. Drop it on another row, group, or active status lane.');
    }, options);

    root.addEventListener('dragend', () => {
      reset(root);
      announce(root, 'Drag ended.');
    }, options);

    root.addEventListener('dragover', (event: DragEvent) => {
      if (!dragItemId || !canEdit() || blocked()) return;
      const target = eventElement(event);
      const row = target?.closest<HTMLElement>('.board-item-row[data-item-id]') ?? null;
      const zone = target?.closest<HTMLElement>('[data-drop-group],[data-drop-status]') ?? null;
      if (!row && !zone) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      clearVisualState(root);
      root.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(String(dragItemId))}"]`)?.classList.add('dragging');
      if (row && String(row.dataset.itemId) !== String(dragItemId)) {
        const rect = row.getBoundingClientRect();
        row.classList.add(event.clientY > rect.top + rect.height / 2 ? 'item-drop-after' : 'item-drop-before');
      } else {
        zone?.classList.add('drag-over');
      }
    }, options);

    root.addEventListener('dragleave', (event: DragEvent) => {
      const target = eventElement(event);
      const node = target?.closest<HTMLElement>('.board-item-row,[data-drop-group],[data-drop-status]') ?? null;
      if (!node) return;
      if (event.relatedTarget instanceof Node && node.contains(event.relatedTarget)) return;
      node.classList.remove('drag-over', 'item-drop-before', 'item-drop-after');
    }, options);

    root.addEventListener('drop', (event: DragEvent) => {
      void (async () => {
        const activeId = dragItemId;
        if (!activeId || !canEdit() || blocked()) return;
        const items = getItems();
        assertUniqueCanonicalItemIds(items);
        const item = items.find((entry) => String(entry.id) === String(activeId));
        if (!item || isArchived(item)) {
          reset(root);
          return;
        }
        const target = eventElement(event);
        const row = target?.closest<HTMLElement>('.board-item-row[data-item-id]') ?? null;
        const zone = target?.closest<HTMLElement>('[data-drop-group],[data-drop-status]') ?? null;
        if (!row && !zone) return;
        event.preventDefault();

        let groupId: BoardGroupId = item.group_id;
        let status: StatusLabelId | null = item.status;
        let position = item.position;
        let mode: BoardItemMoveMode = 'positioned';
        if (row && String(row.dataset.itemId) !== String(item.id)) {
          const targetItem = items.find((entry) => String(entry.id) === String(row.dataset.itemId));
          if (!targetItem) return;
          groupId = targetItem.group_id;
          status = item.status;
          const rect = row.getBoundingClientRect();
          position = targetItem.position + (event.clientY > rect.top + rect.height / 2 ? 1 : 0);
          if (String(groupId) === String(item.group_id) && item.position < position) position -= 1;
        } else if (zone) {
          const hasGroupTarget = Object.prototype.hasOwnProperty.call(zone.dataset, 'dropGroup');
          const hasStatusTarget = Object.prototype.hasOwnProperty.call(zone.dataset, 'dropStatus');
          if (hasGroupTarget) {
            groupId = (zone.dataset.dropGroup || item.group_id) as BoardGroupId;
            position = items.filter((entry) => !isArchived(entry) && String(entry.group_id) === String(groupId) && String(entry.id) !== String(item.id)).length;
          }
          if (hasStatusTarget) status = asStatus(zone.dataset.dropStatus);
          if (hasStatusTarget && !hasGroupTarget) {
            mode = 'status-only';
            position = item.position;
          }
        }

        const noChange = String(groupId) === String(item.group_id) && String(status ?? '') === String(item.status ?? '') && (mode === 'status-only' || position === item.position);
        if (noChange) {
          reset(root);
          announce(root, 'Item stayed in its current position.');
          return;
        }

        const before = snapshotBoardItemMoveState(items);
        setPending(root, true);
        applyBoardItemMove(items, item, groupId, position, status, mode);
        const after = snapshotBoardItemMoveState(items);
        reset(root);
        renderBoard();
        try {
          await commands.moveItem({ itemId: item.id, groupId: item.group_id, position: item.position, status: item.status });
          toast('Item moved.');
          announce(root, 'Item moved successfully.');
          pushMoveHistory(root, items, item.id, before, after, mode === 'status-only' ? 'kanban' : null);
        } catch (error) {
          restoreBoardItemMoveState(items, before);
          renderBoard();
          toast(errorMessage(error), 'warning');
          announce(root, 'Item couldn’t be moved. Try again.');
        } finally {
          setPending(root, false);
        }
      })();
    }, options);

    cleanup = () => {
      abort.abort();
      reset(root);
      cleanup = null;
    };
    return cleanup;
  }

  function dispose(): void {
    cleanup?.();
    cleanup = null;
    dragItemId = null;
    pendingMutation = false;
  }

  return Object.freeze({ bind, reset, dispose, get activeItemId() { return dragItemId; }, get pending() { return pendingMutation; } });
}
