import type { BoardCommandService } from '../../../../../src/features/boards/contracts/commands.ts';
import type { BoardColumn, BoardGroup } from '../../../../../src/features/boards/contracts/domain.ts';
import type { MutableBoardViewState } from '../../../../../src/features/boards/contracts/view-state.ts';
import type { ToastRenderer } from '../../../../../src/platform/contracts/ui.ts';
import type { BoardHistoryController } from './history-controller.ts';

interface StructureDragDependencies {
  readonly state: MutableBoardViewState;
  readonly commands: BoardCommandService;
  readonly canEdit: () => boolean;
  readonly toast: ToastRenderer;
  readonly renderBoardData: () => void;
  readonly history?: BoardHistoryController | null;
  readonly isBlocked?: (() => boolean) | null;
}

type StructureType = 'column' | 'group';
interface ActiveStructureDrag { readonly type: StructureType; readonly id: string; }
interface Positionable { readonly id: string; position: number; }
export interface PositionSnapshot { readonly id: string; readonly position: number; }
export interface ReorderResult<T extends Positionable> {
  readonly before: readonly PositionSnapshot[];
  readonly after: readonly PositionSnapshot[];
  readonly source: T;
  readonly index: number;
}

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : 'Unknown error.';

export function reorderBoardStructureLocal<T extends Positionable>(list: readonly T[], sourceId: string, targetIndex: number): ReorderResult<T> | null {
  const ordered = [...list].sort((a, b) => a.position - b.position || String(a.id).localeCompare(String(b.id)));
  const sourceIndex = ordered.findIndex((entry) => String(entry.id) === String(sourceId));
  if (sourceIndex < 0) return null;
  const before = ordered.map((entry) => Object.freeze({ id: entry.id, position: entry.position }));
  const source = ordered.splice(sourceIndex, 1)[0];
  if (!source) return null;
  const index = Math.max(0, Math.min(Math.trunc(Number(targetIndex) || 0), ordered.length));
  ordered.splice(index, 0, source);
  ordered.forEach((entry, idx) => { entry.position = idx; });
  return { before, after: ordered.map((entry) => Object.freeze({ id: entry.id, position: entry.position })), source, index };
}

export function restoreBoardStructurePositions<T extends Positionable>(list: readonly T[], snapshot: readonly PositionSnapshot[]): void {
  const map = new Map(snapshot.map((entry) => [String(entry.id), entry.position] as const));
  list.forEach((entry) => {
    const position = map.get(String(entry.id));
    if (position !== undefined) entry.position = position;
  });
}

/** Drag ordering for groups and columns. Keeps structural ordering server-authoritative with optimistic local feedback. */
export function createBoardStructureDragController({ state, commands, canEdit, toast, renderBoardData, history, isBlocked = null }: StructureDragDependencies) {
  let active: ActiveStructureDrag | null = null;
  let cleanup: (() => void) | null = null;
  let pendingMutation = false;
  const blocked = (): boolean => pendingMutation || Boolean(isBlocked?.());

  function announce(root: HTMLElement, message: string): void {
    let live = root.querySelector<HTMLElement>('[data-board-structure-live]');
    if (!live) {
      live = document.createElement('div');
      live.className = 'wm-visually-hidden';
      live.dataset.boardStructureLive = '1';
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
    root.classList.toggle('board-structure-mutation-pending', pending);
    if (pending) root.setAttribute('aria-busy', 'true');
    else if (!root.classList.contains('board-item-mutation-pending')) root.removeAttribute('aria-busy');
  }

  function restoreHandleFocus(root: HTMLElement, type: StructureType, id: string): void {
    requestAnimationFrame(() => {
      const attr = type === 'column' ? 'data-column-drag' : 'data-group-drag';
      root.querySelector<HTMLElement>(`[${attr}="${CSS.escape(id)}"]`)?.focus();
    });
  }

  async function persistPositionSnapshot<T extends Positionable>(
    root: HTMLElement,
    list: readonly T[],
    sourceId: string,
    target: readonly PositionSnapshot[],
    rollback: readonly PositionSnapshot[],
    persist: (position: number) => Promise<void>,
  ): Promise<void> {
    if (blocked()) throw new Error('Wait for the current Board movement to finish before changing Board order again.');
    setPending(root, true);
    try {
      restoreBoardStructurePositions(list, target);
      renderBoardData();
      const source = target.find((entry) => String(entry.id) === String(sourceId));
      if (!source) throw new Error('The moved Board structure is no longer available. Reload the Board before retrying.');
      try {
        await persist(source.position);
      } catch (error) {
        restoreBoardStructurePositions(list, rollback);
        renderBoardData();
        throw error;
      }
    } finally {
      setPending(root, false);
    }
  }

  function pushHistory<T extends Positionable>(
    root: HTMLElement,
    list: readonly T[],
    sourceId: string,
    before: readonly PositionSnapshot[],
    after: readonly PositionSnapshot[],
    persist: (position: number) => Promise<void>,
    label: string,
  ): void {
    history?.push({
      label,
      undo: () => persistPositionSnapshot(root, list, sourceId, before, after, persist),
      redo: () => persistPositionSnapshot(root, list, sourceId, after, before, persist),
    });
  }

  async function keyboardMove(root: HTMLElement, type: StructureType, id: string, targetIndex: number): Promise<void> {
    const board = state.board;
    if (!board || !canEdit()) return;
    if (blocked()) { announce(root, 'Wait for the current Board movement to finish.'); return; }
    if (type === 'column') {
      const list: readonly BoardColumn[] = board.columns;
      const result = reorderBoardStructureLocal(list, id, targetIndex);
      if (!result || result.before.every((entry, index) => entry.id === result.after[index]?.id)) return;
      setPending(root, true);
      renderBoardData();
      restoreHandleFocus(root, type, id);
      const persist = (position: number): Promise<void> => commands.moveColumn({ columnId: id, position });
      try {
        await persist(result.index);
        announce(root, `Column moved to position ${result.index + 1}.`);
        pushHistory(root, list, id, result.before, result.after, persist, 'column order');
      } catch (error) {
        restoreBoardStructurePositions(list, result.before);
        renderBoardData();
        restoreHandleFocus(root, type, id);
        toast(`Column order couldn’t be saved. ${errorMessage(error)}`, 'warning');
        announce(root, 'Column order could not be saved.');
      } finally {
        setPending(root, false);
      }
      return;
    }

    const list: readonly BoardGroup[] = board.groups;
    const result = reorderBoardStructureLocal(list, id, targetIndex);
    if (!result || result.before.every((entry, index) => entry.id === result.after[index]?.id)) return;
    setPending(root, true);
    renderBoardData();
    restoreHandleFocus(root, type, id);
    const persist = (position: number): Promise<void> => commands.moveGroup({ groupId: id, position });
    try {
      await persist(result.index);
      announce(root, `Group moved to position ${result.index + 1}.`);
      pushHistory(root, list, id, result.before, result.after, persist, 'group order');
    } catch (error) {
      restoreBoardStructurePositions(list, result.before);
      renderBoardData();
      restoreHandleFocus(root, type, id);
      toast(`Group order couldn’t be saved. ${errorMessage(error)}`, 'warning');
      announce(root, 'Group order could not be saved.');
    } finally {
      setPending(root, false);
    }
  }

  function bind(root: HTMLElement): void {
    cleanup?.();
    const abort = new AbortController();
    const options: AddEventListenerOptions = { signal: abort.signal };

    root.addEventListener('dragstart', (event: DragEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const handle = target?.closest<HTMLElement>('[data-column-drag],[data-group-drag]') ?? null;
      if (!handle || !canEdit() || !event.dataTransfer) return;
      if (blocked()) { announce(root, 'Wait for the current Board movement to finish.'); return; }
      const type: StructureType = handle.hasAttribute('data-column-drag') ? 'column' : 'group';
      const id = type === 'column' ? handle.dataset.columnDrag : handle.dataset.groupDrag;
      if (!id) return;
      active = { type, id };
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', `${type}:${id}`);
      handle.closest<HTMLElement>('[data-column-id],[data-group-id]')?.classList.add('structure-dragging');
      announce(root, `${type === 'column' ? 'Column' : 'Group'} picked up.`);
    }, options);

    root.addEventListener('keydown', (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-column-drag],[data-group-drag]') : null;
      if (!target || !canEdit()) return;
      if (blocked()) { announce(root, 'Wait for the current Board movement to finish.'); return; }
      const type: StructureType = target.hasAttribute('data-column-drag') ? 'column' : 'group';
      const id = type === 'column' ? target.dataset.columnDrag : target.dataset.groupDrag;
      if (!id) return;
      const allowed = type === 'column' ? ['ArrowLeft', 'ArrowRight', 'Home', 'End'] : ['ArrowUp', 'ArrowDown', 'Home', 'End'];
      if (!allowed.includes(event.key)) return;
      const list = type === 'column' ? state.board?.columns : state.board?.groups;
      if (!list?.length) return;
      const ordered = [...list].sort((a, b) => a.position - b.position || String(a.id).localeCompare(String(b.id)));
      const current = ordered.findIndex((entry) => String(entry.id) === String(id));
      if (current < 0) return;
      let targetIndex = current;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') targetIndex = Math.max(0, current - 1);
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') targetIndex = Math.min(ordered.length - 1, current + 1);
      if (event.key === 'Home') targetIndex = 0;
      if (event.key === 'End') targetIndex = ordered.length - 1;
      event.preventDefault();
      if (targetIndex === current) {
        announce(root, `${type === 'column' ? 'Column' : 'Group'} is already at that boundary.`);
        return;
      }
      void keyboardMove(root, type, id, targetIndex);
    }, options);

    root.addEventListener('dragend', () => {
      root.querySelectorAll('.structure-dragging,.structure-drop-target').forEach((node) => node.classList.remove('structure-dragging', 'structure-drop-target'));
      active = null;
      announce(root, 'Structural drag ended.');
    }, options);

    root.addEventListener('dragover', (event: DragEvent) => {
      if (!active || blocked()) return;
      const targetNode = event.target instanceof Element ? event.target : null;
      const target = active.type === 'column'
        ? targetNode?.closest<HTMLElement>('[data-column-id]')
        : targetNode?.closest<HTMLElement>('.board-group[data-group-id]');
      if (!target) return;
      event.preventDefault();
      target.classList.add('structure-drop-target');
    }, options);

    root.addEventListener('dragleave', (event: DragEvent) => {
      const targetNode = event.target instanceof Element ? event.target : null;
      const target = targetNode?.closest<HTMLElement>('[data-column-id],.board-group[data-group-id]') ?? null;
      if (!target) return;
      if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return;
      target.classList.remove('structure-drop-target');
    }, options);

    root.addEventListener('drop', (event: DragEvent) => {
      void (async () => {
        const current = active;
        if (!current || blocked()) return;
        const targetNode = event.target instanceof Element ? event.target : null;
        const target = current.type === 'column'
          ? targetNode?.closest<HTMLElement>('[data-column-id]')
          : targetNode?.closest<HTMLElement>('.board-group[data-group-id]');
        if (!target) return;
        event.preventDefault();
        const targetId = current.type === 'column' ? target.dataset.columnId : target.dataset.groupId;
        if (!targetId || targetId === current.id) {
          active = null;
          return;
        }
        const board = state.board;
        if (!board) {
          active = null;
          return;
        }

        if (current.type === 'column') {
          const list: readonly BoardColumn[] = board.columns;
          const targetIndex = [...list].sort((a, b) => a.position - b.position || String(a.id).localeCompare(String(b.id))).findIndex((entry) => String(entry.id) === targetId);
          const result = reorderBoardStructureLocal(list, current.id, targetIndex);
          active = null;
          if (!result) return;
          setPending(root, true);
          renderBoardData();
          const persist = (position: number): Promise<void> => commands.moveColumn({ columnId: current.id, position });
          try {
            await persist(result.index);
            toast('Column order updated.');
            announce(root, `Column moved to position ${result.index + 1}.`);
            pushHistory(root, list, current.id, result.before, result.after, persist, 'column order');
          } catch (error) {
            restoreBoardStructurePositions(list, result.before);
            renderBoardData();
            toast(`Column order couldn’t be saved. ${errorMessage(error)}`, 'warning');
            announce(root, 'Column order could not be saved.');
          } finally {
            setPending(root, false);
          }
          return;
        }

        const list: readonly BoardGroup[] = board.groups;
        const targetIndex = [...list].sort((a, b) => a.position - b.position || String(a.id).localeCompare(String(b.id))).findIndex((entry) => String(entry.id) === targetId);
        const result = reorderBoardStructureLocal(list, current.id, targetIndex);
        active = null;
        if (!result) return;
        setPending(root, true);
        renderBoardData();
        const persist = (position: number): Promise<void> => commands.moveGroup({ groupId: current.id, position });
        try {
          await persist(result.index);
          toast('Group order updated.');
          announce(root, `Group moved to position ${result.index + 1}.`);
          pushHistory(root, list, current.id, result.before, result.after, persist, 'group order');
        } catch (error) {
          restoreBoardStructurePositions(list, result.before);
          renderBoardData();
          toast(`Group order couldn’t be saved. ${errorMessage(error)}`, 'warning');
          announce(root, 'Group order could not be saved.');
        } finally {
          setPending(root, false);
        }
      })();
    }, options);

    cleanup = () => {
      abort.abort();
      active = null;
      setPending(root, false);
      cleanup = null;
    };
  }

  function dispose(): void { cleanup?.(); pendingMutation = false; }
  return Object.freeze({ bind, dispose, get activeDragType() { return active?.type ?? null; }, get pending() { return pendingMutation; } });
}
