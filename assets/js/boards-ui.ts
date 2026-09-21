import type { BoardCommandService } from '../../src/features/boards/contracts/commands.ts';
import type { BoardColumn, BoardColumnType, BoardEnvelope, BoardGroup, BoardItem, BoardLifecycleStatus, BoardRecord, BoardViewMode, TimelineValue } from '../../src/features/boards/contracts/domain.ts';
import type { BoardDialogOptions, ConfirmActionOptions } from '../../src/features/boards/contracts/presentation.ts';
import type { BoardDomainService } from '../../src/features/boards/contracts/service.ts';
import type { BoardRealtimeService, BoardRealtimeSnapshot } from '../../src/features/boards/contracts/realtime.ts';
import type { BoardHistorySnapshot } from './features/boards/controllers/history-controller.ts';
import type { UiAuthPort, WorkspaceRenderer, TopbarRenderer, ToastRenderer, Navigate, IconSet } from '../../src/platform/contracts/ui.ts';
import { normalizeAppError } from './platform/errors/app-error.ts';
import { COLUMN_TYPES, startingColumns } from './features/boards/board-schema.ts';
import { createBoardViewState, resetBoardInteractionState } from './features/boards/board-state.ts';
import { renderBoardToolbar, renderBoardListState } from './features/boards/views/board-list-view.ts';
import { renderItemWorkspace } from './features/boards/views/item-workspace-view.ts';
import { renderBoardTableView } from './features/boards/views/table-view.ts';
import type { BoardTableItemRenderContext } from './features/boards/views/table-view.ts';
import { renderBoardKanbanView } from './features/boards/views/kanban-view.ts';
import { renderBoardHeader, renderBoardControls, renderBoardItemRow, renderBoardColumnHeader } from './features/boards/views/board-workspace-view.ts';
import { createBoardDialogController } from './features/boards/controllers/dialog-controller.ts';
import { createColumnWorkflows } from './features/boards/controllers/column-workflows.ts';
import { createGroupWorkflows } from './features/boards/controllers/group-workflows.ts';
import { createItemWorkflows } from './features/boards/controllers/item-workflows.ts';
import { createMemberWorkflows } from './features/boards/controllers/member-workflows.ts';
import { createActivityWorkflows } from './features/boards/controllers/activity-workflows.ts';
import { createItemWorkspaceController } from './features/boards/controllers/item-workspace-controller.ts';
import { createBoardDragDropController } from './features/boards/controllers/drag-drop-controller.ts';
import { createBoardHistoryController } from './features/boards/controllers/history-controller.ts';
import { createBoardSelectionController } from './features/boards/controllers/selection-controller.ts';
import { createBoardInlineEditController } from './features/boards/controllers/inline-edit-controller.ts';
import { createColumnResizeController } from './features/boards/controllers/column-resize-controller.ts';
import { createBoardStructureDragController } from './features/boards/controllers/structure-drag-controller.ts';
import { createBoardMenuController } from './features/boards/controllers/board-menu-controller.ts';
import { createBoardDataController } from './features/boards/controllers/board-data-controller.ts';
import { createBoardPreferencePersistenceController } from './features/boards/controllers/board-preference-controller.ts';
import { createItemPanelRenderer } from './features/boards/controllers/item-panel-renderer.ts';
import { createBoardOverlayCoordinator } from './features/boards/controllers/overlay-coordinator.ts';
import { createBoardTableVirtualizationController } from './features/boards/controllers/board-table-virtualization-controller.ts';
import { createBoardRealtimeController } from './features/boards/controllers/board-realtime-controller.ts';
import { statusConfig } from './features/boards/status-labels.ts';
import { createBoardPreferencePatchService } from './features/boards/services/board-preferences-service.ts';
import { createBoardSelectors } from './features/boards/selectors/board-selectors.ts';
import { CAPABILITIES, hasBoardCapability } from './platform/auth/permissions.ts';
const ESCAPE_MAP: Readonly<Record<string, string>> = Object.freeze({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'});
const esc = (value: unknown): string => String(value ?? '').replace(/[&<>'"]/g, (character) => ESCAPE_MAP[character] ?? character);
const fmtDate = (value: unknown): string => value ? new Date(String(value)).toLocaleString() : '—';
const day = (value: unknown): string => value ? new Date(`${String(value)}T00:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '—';
const eventElement = (event: Event): Element | null => event.target instanceof Element ? event.target : null;
const errorMessage = (error: unknown, fallback = 'The operation could not be completed.'): string => normalizeAppError(error, { fallbackMessage: fallback }).message;
const isTimelineValue = (value: unknown): value is TimelineValue => Boolean(value && typeof value === 'object' && !Array.isArray(value) && 'start' in value && 'end' in value);
const assertNever = (value: never): never => { throw new TypeError(`Unsupported Board column type: ${String(value)}`); };
const boardInitials = (value: unknown): string => {
  const parts = String(value ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : (parts[0]?.[1] ?? '');
  return `${first}${last}`.toUpperCase().slice(0, 2);
};

interface BoardsFeatureOptions {
  readonly auth: UiAuthPort;
  readonly renderWorkspace: WorkspaceRenderer;
  readonly topbar: TopbarRenderer;
  readonly toast: ToastRenderer;
  readonly navigate: Navigate;
  readonly icons: IconSet;
  readonly service?: BoardDomainService | null;
  readonly commands?: BoardCommandService | null;
  readonly realtime?: BoardRealtimeService | null;
}

interface BoardViewGeometry {
  readonly tables: ReadonlyMap<string, number>;
  readonly kanbanLeft: number;
}

interface BoardViewRenderOptions {
  readonly tableScrollLeft?: number | null;
}

interface PendingGridFocus {
  readonly itemId: string;
  readonly groupId: string;
  readonly rowIndex: number;
  readonly totalRows: number;
  readonly columnIndex: number;
  readonly scrollLeft: number | null;
}

export function createBoardsFeature({ auth, renderWorkspace, topbar, toast, navigate, icons, service = null, commands = null, realtime = null }: BoardsFeatureOptions) {
  // Transport injection is the v1.23 feature boundary. The compatibility fallback keeps direct consumers working.
  if (!service) throw new TypeError('Board domain service is required. Construct it through the feature/composition boundary.');
  const api = service;
  if (!commands) throw new TypeError('Board command service is required. Construct it through the feature/composition boundary.');
  const commandService = commands;
  void auth;
  const state = createBoardViewState();
  const preferencePatches = createBoardPreferencePatchService();
  const selectors = createBoardSelectors(state);
  let itemSearchFrame = 0;
  let boardResizeCleanup: (() => void) | null = null;
  let listMenuController: ReturnType<typeof createBoardMenuController> | null = null;
  let boardMenuController: ReturnType<typeof createBoardMenuController> | null = null;
  let listEventBinding: AbortController | null = null;
  let boardEventBinding: AbortController | null = null;
  let selection: ReturnType<typeof createBoardSelectionController>;
  let dragDrop: ReturnType<typeof createBoardDragDropController> | null = null;
  let realtimeController: ReturnType<typeof createBoardRealtimeController> | null = null;
  let realtimeSnapshot: BoardRealtimeSnapshot = Object.freeze({ state:'idle', boardId:null, collaborators:[], lastEventAt:null, lastError:null, fallbackPolling:false });
  const tableVirtualization = createBoardTableVirtualizationController();
  let virtualizationFrame = 0;
  let virtualizationMeasureFrame = 0;
  let boardDetailCommitFrame = 0;
  let boardDetailCommitRevision = 0;
  let boardDetailCommitRetryBoardId: string | null = null;
  let boardDetailCommitRetryCount = 0;
  const BOARD_DETAIL_COMMIT_RETRY_LIMIT = 2;
  let virtualizationRenderDeferredForMenu = false;
  let virtualizationRenderDeferredForEditor = false;
  let fullBoardRenderDeferredForMenu = false;
  let pendingGridFocus: PendingGridFocus | null = null;
  const boardMarkup = new WeakMap<HTMLElement, string>();

  const overlayCoordinator = createBoardOverlayCoordinator();
  const dialogs = createBoardDialogController({ toast, escapeHtml: esc, overlayCoordinator });
  const dialog = (options: BoardDialogOptions) => { overlayCoordinator.closeAll({ restoreFocus:false }); return dialogs.open(options); };
  const confirmBoardAction = (message: string, options: ConfirmActionOptions = {}): Promise<boolean> => dialogs.confirm(message, options);
  const preferencePersistence = createBoardPreferencePersistenceController({
    state,
    commands: commandService,
    patches: preferencePatches,
    onWarning: (message) => toast(message, 'warning'),
  });

  function boardToolbar() {
    return renderBoardToolbar({ state, icons, escapeHtml: esc });
  }

  function renderBoardListBody() {
    listMenuController?.close();
    const main = document.querySelector<HTMLElement>('#boardsMain');
    if (!main) return;
    main.dataset.boardCollectionState = state.loading ? 'loading' : state.error ? 'error' : 'ready';
    main.dataset.boardCollectionStatus = state.status;
    main.innerHTML = renderBoardListState({ state, escapeHtml: esc, formatDate: fmtDate });
  }

  const dataController = createBoardDataController({
    state,
    service: api,
    onListChange: renderBoardListBody,
    onBoardChange: renderBoardData,
    onBoardLoaded: () => {
      selection.normalize();
      const loadedBoardId = state.board?.board?.id;
      if (loadedBoardId) void realtimeController?.connect(loadedBoardId);
    },
    onLifecycleMismatch: (board) => {
      state.status = board.status;
      toast(board.status === 'archived' ? 'Restore this archived board before opening it.' : 'Restore this trashed board before opening it.', 'warning');
      navigate('boards');
    },
    onWarning: (message) => toast(message, 'warning'),
  });
  const loadBoards = (status = state.status) => dataController.loadBoards(status);
  const loadBoard = (boardId: string, options: Readonly<{ quiet?: boolean; force?: boolean }> = {}) => dataController.loadBoard(boardId, options);

  function releaseListEventBinding(): void {
    listEventBinding?.abort();
    listEventBinding = null;
  }

  function releaseBoardEventBinding(): void {
    boardEventBinding?.abort();
    boardEventBinding = null;
  }

  function renderBoards() {
    void preferencePersistence.flushPending();
    releaseBoardEventBinding();
    boardResizeCleanup?.();
    dragDrop?.dispose();
    structureDrag.dispose();
    columnResize.dispose();
    virtualizationRenderDeferredForEditor = false;
    inlineEdit.reset();
    selection.clear();
    history.reset();
    tableVirtualization.reset();
    cancelAnimationFrame(virtualizationFrame);
    virtualizationFrame = 0;
    cancelAnimationFrame(virtualizationMeasureFrame);
    virtualizationMeasureFrame = 0;
    cancelAnimationFrame(boardDetailCommitFrame);
    boardDetailCommitFrame = 0;
    boardDetailCommitRetryBoardId = null;
    boardDetailCommitRetryCount = 0;
    pendingGridFocus = null;
    virtualizationRenderDeferredForMenu = false;
    fullBoardRenderDeferredForMenu = false;
    realtimeController?.disconnect();
    realtimeSnapshot = Object.freeze({ state:'idle', boardId:null, collaborators:[], lastEventAt:null, lastError:null, fallbackPolling:false });
    boardMenuController?.dispose(); boardMenuController = null;
    state.board=null;itemWorkspace.reset();itemPanelRenderer.reset();
    const content=`${topbar('Boards','Plan, track, and collaborate on shared work.')}
      <main id="main" class="page boards-page"><section class="boards-intro"><div><span class="top-eyebrow">WORK MANAGEMENT</span><h2>Boards</h2><p>Plan work, organize items, and collaborate with your team in one place.</p></div></section>${boardToolbar()}<section id="boardsMain" aria-live="polite"></section></main>`;
    renderWorkspace(content,'boards','page'); attachListEvents(); loadBoards();
  }

  function attachListEvents(): void {
    const root = document.querySelector<HTMLElement>('.boards-page');
    if (!root) return;
    releaseListEventBinding();
    listEventBinding = new AbortController();
    const signal = listEventBinding.signal;
    root.dataset.boardListEventsBound = 'true';
    listMenuController?.dispose();
    listMenuController = createBoardMenuController({ root, escapeHtml: esc, overlayCoordinator });

    root.addEventListener('input', (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.matches('[data-board-search]')) {
        state.search = target.value;
        renderBoardListBody();
      }
    }, { signal });

    root.addEventListener('click', async (event: MouseEvent) => {
      const target = eventElement(event);
      if (!target) return;
      if (listMenuController?.handleTrigger(target)) {
        event.preventDefault();
        return;
      }
      const card = target.closest<HTMLElement>('.board-card[data-board-id]');
      const interactive = target.closest('button,summary,details,a,input,select,textarea,label');
      if (card && !interactive) {
        const boardId = card.dataset.boardId;
        if (boardId && card.dataset.boardLifecycle === 'active') navigate(`boards/${boardId}`);
        return;
      }
      const btn = target.closest<HTMLButtonElement>('button');
      if (!btn) return;
      if (btn.closest('.board-floating-menu')) listMenuController?.close();
      if (btn.matches('[data-board-status]')) {
        const status = btn.dataset.boardStatus;
        if (status === 'active' || status === 'archived' || status === 'trashed') {
          state.status = status;
          renderBoards();
        }
        return;
      }
      if (btn.matches('[data-board-retry]')) { void loadBoards(); return; }
      if (btn.matches('[data-board-create]')) { openCreateBoard(); return; }
      if (btn.matches('[data-board-open]')) {
        const boardId = btn.dataset.boardOpen;
        if (boardId) navigate(`boards/${boardId}`);
        return;
      }
      if (btn.matches('[data-board-duplicate]')) {
        const boardId = btn.dataset.boardDuplicate;
        if (!boardId) return;
        try {
          btn.disabled = true;
          const id = await commandService.duplicateBoard(boardId);
          state.status = 'active';
          await loadBoards('active');
          toast('Board duplicated.');
          navigate(`boards/${id}`);
        } catch (error) {
          toast(errorMessage(error, 'The board could not be duplicated.'), 'warning');
        } finally {
          btn.disabled = false;
        }
        return;
      }
      if (btn.matches('[data-board-status-action]')) {
        const status = btn.dataset.status;
        const boardId = btn.dataset.boardStatusAction;
        if (!boardId || (status !== 'active' && status !== 'archived' && status !== 'trashed')) return;
        const message = status === 'trashed'
          ? 'Move this board to trash? You can restore it until it is permanently deleted.'
          : status === 'archived'
            ? 'Archive this board? You can restore it later from Archived.'
            : 'Restore this board to your active boards?';
        if (!await confirmBoardAction(message)) return;
        try {
          await commandService.setBoardLifecycle({ boardId, status });
          toast(status === 'active' ? 'Board restored to active boards.' : status === 'archived' ? 'Board archived.' : 'Board moved to trash.');
          await loadBoards(state.status);
        } catch (error) {
          toast(errorMessage(error, 'The board status could not be changed.'), 'warning');
        }
        return;
      }
      if (btn.matches('[data-board-delete]')) {
        const boardId = btn.dataset.boardDelete;
        if (!boardId || !await confirmBoardAction('Delete this board permanently? All groups, items, values, updates, and attachments associated with it will be removed. This cannot be undone.')) return;
        try {
          await commandService.deleteBoard(boardId);
          toast('Board deleted permanently.');
          await loadBoards(state.status);
        } catch (error) {
          toast(errorMessage(error, 'The board could not be deleted.'), 'warning');
        }
      }
    }, { signal });

    root.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = eventElement(event);
      const card = target?.closest<HTMLElement>('.board-card[data-board-id]');
      if (!card || target !== card) return;
      event.preventDefault();
      const boardId = card.dataset.boardId;
      if (boardId && card.dataset.boardLifecycle === 'active') navigate(`boards/${boardId}`);
    }, { signal });
  }

  function openCreateBoard(): void {
    const typeChoices = Object.entries(COLUMN_TYPES).map(([type, meta]) => `<label class="board-setup-column"><input type="checkbox" name="setup_column" value="${type}"><span class="column-type-icon">${esc(meta.icon)}</span><span><strong>${esc(meta.label)}</strong><small>${esc(meta.hint)}</small></span></label>`).join('');
    const modal = dialog({
      title: 'Create a board',
      body: `<label class="field-label" for="boardCreateName">Board name<input id="boardCreateName" data-board-create-name name="name" required maxlength="120" value="New board" placeholder="For example, Project delivery plan" autocomplete="off"></label><label class="field-label" for="boardCreateDescription">Description<textarea id="boardCreateDescription" data-board-create-description name="description" maxlength="1200" rows="3" placeholder="Describe the purpose of this board"></textarea></label><fieldset class="board-setup-fieldset"><legend>Starting setup</legend><label class="choice-card"><input type="radio" name="setup_mode" value="empty" checked><span><strong>Start empty</strong><small>Create the board without custom columns. Add them whenever you need them.</small></span></label><label class="choice-card"><input type="radio" name="setup_mode" value="custom"><span><strong>Choose starting columns</strong><small>Choose the columns you want to start with. You can change or remove them later.</small></span></label><div class="board-setup-columns" data-board-setup-columns hidden>${typeChoices}</div></fieldset><p class="field-help">Your board stays flexible. Add, rename, reorder, configure, duplicate, hide, or delete columns as your workflow changes.</p>`,
      submitLabel: 'Create board',
      onSubmit: async (fd) => {
        const nameControl = modal.wrap.querySelector<HTMLInputElement>('[data-board-create-name]');
        const descriptionControl = modal.wrap.querySelector<HTMLTextAreaElement>('[data-board-create-description]');
        if (!nameControl || !descriptionControl) throw new Error('The create-board form is not ready. Close it and try again.');
        const submittedName = String(fd.get('name') ?? '');
        const submittedDescription = String(fd.get('description') ?? '');
        if (submittedName !== nameControl.value || submittedDescription !== descriptionControl.value) {
          throw new Error('The create-board form changed during submission. Review the Board name and description, then try again.');
        }
        const draft = Object.freeze({
          name: nameControl.value.trim(),
          description: descriptionControl.value,
        });
        const mode = String(fd.get('setup_mode') || 'empty');
        const types = mode === 'custom' ? fd.getAll('setup_column').map(String) : [];
        if (mode === 'custom' && !types.length) throw new Error('Choose at least one starting column, or select Start empty.');
        const columns = startingColumns(types);
        const id = await commandService.createBoard({
          ...draft,
          columns,
        });
        state.status = 'active';
        await loadBoards('active');
        toast(columns.length ? `Board created with ${columns.length} starting column${columns.length === 1 ? '' : 's'}.` : 'Board created. Add columns whenever you need them.');
        navigate(`boards/${id}`);
      },
    });
    const sync = (): void => {
      const custom = modal.wrap.querySelector<HTMLInputElement>('input[name="setup_mode"][value="custom"]')?.checked === true;
      const panel = modal.wrap.querySelector<HTMLElement>('[data-board-setup-columns]');
      if (panel) panel.hidden = !custom;
    };
    modal.wrap.addEventListener('change', (event: Event) => {
      const target = eventElement(event);
      if (target?.matches('input[name="setup_mode"]')) sync();
    });
    sync();
  }

  function hasActiveBoard(){return state.board?.board?.status === 'active';}
  function canEdit(){return hasActiveBoard() && hasBoardCapability(state.board?.board?.member_role,CAPABILITIES.BOARD_EDIT);}
  function canManage(){return hasActiveBoard() && hasBoardCapability(state.board?.board?.member_role,CAPABILITIES.BOARD_MANAGE);}
  const memberMap = selectors.memberMap;
  const allColumns = selectors.allColumns;
  const visibleColumns = selectors.visibleColumns;
  const columnWidth = selectors.columnWidth;
  const itemNameWidth = selectors.itemNameWidth;
  const isGroupCollapsed = selectors.isGroupCollapsed;
  const isWrapped = selectors.isWrapped;
  const activeColumnFilter = selectors.activeColumnFilter;
  const sortConfig = selectors.sortConfig;
  const populatedColumnValueCount = selectors.populatedColumnValueCount;
  const getCellValue = selectors.getCellValue;
  const optionList = selectors.optionList;
  const systemStatusColumn = selectors.systemStatusColumn;
  const statusLabelsFor = selectors.statusLabelsFor;
  const statusLabelForValue = selectors.statusLabelForValue;
  const boardStatusLabels = selectors.boardStatusLabels;
  const itemMatches = selectors.itemMatches;
  const compareItems = selectors.compareItems;
  function columnTypeLabel(type: BoardColumnType): string { return COLUMN_TYPES[type]?.label || type; }
  const persistBoardPrefs = (): void => { preferencePersistence.schedule(); };
  const removeColumnPreferenceReferences = (columnId: string): void => { preferencePersistence.removeColumnReferences(columnId); };

  function formatCell(item: BoardItem, column: BoardColumn): string {
    const value = getCellValue(item, column);
    if (value === null || value === undefined || value === '') {
      const emptyLabel = column.data_type === 'people' ? 'Unassigned'
        : column.data_type === 'status' ? 'No status'
        : column.data_type === 'date' ? 'No date'
        : column.data_type === 'timeline' ? 'No timeline'
        : '—';
      return `<span class="board-cell-empty board-cell-empty--${column.data_type}">${esc(emptyLabel)}</span>`;
    }
    switch (column.data_type) {
      case 'people': {
        const member = memberMap().get(String(value));
        const displayName = member?.display_name || member?.email || 'Unknown member';
        return `<span class="board-person-cell" title="${esc(displayName)}"><span class="board-person-avatar" aria-hidden="true">${esc(boardInitials(displayName))}</span><span class="board-person-name">${esc(displayName)}</span></span>`;
      }
      case 'date':
        return `<span class="board-date-cell"><span class="board-cell-leading-icon board-date-icon" aria-hidden="true">□</span><span>${esc(day(value))}</span></span>`;
      case 'timeline':
        return isTimelineValue(value)
          ? `<span class="timeline-cell"><span class="timeline-date">${esc(day(value.start))}</span><span class="timeline-arrow" aria-hidden="true">→</span><span class="timeline-date">${esc(day(value.end))}</span></span>`
          : '<span class="board-cell-empty board-cell-empty--timeline">No timeline</span>';
      case 'checkbox': {
        const checked = value === true;
        return `<span class="check-cell ${checked ? 'checked' : ''}" aria-label="${checked ? 'Checked' : 'Unchecked'}"><span aria-hidden="true">${checked ? '✓' : ''}</span></span>`;
      }
      case 'number':
        return `<span class="board-number-cell">${esc(new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(Number(value)))}</span>`;
      case 'status': {
        const label = statusLabelForValue(column, value);
        const name = label?.name || String(value);
        const color = label?.color || '#7f8a9a';
        return `<span class="status-pill configurable-status${label?.active === false ? ' is-inactive' : ''}" style="--status-color:${esc(color)}" data-status-id="${esc(value)}" title="${esc(name)}"><span class="status-pill-dot" aria-hidden="true"></span><span class="status-pill-label">${esc(name)}</span></span>`;
      }
      case 'dropdown':
        return `<span class="choice-pill" title="${esc(value)}"><span class="choice-pill-label">${esc(value)}</span></span>`;
      case 'url':
        return `<span class="link-cell"><span class="board-cell-leading-icon" aria-hidden="true">↗</span><span>${esc(value)}</span></span>`;
      case 'email':
        return `<span class="email-cell"><span class="board-cell-leading-icon" aria-hidden="true">@</span><span>${esc(value)}</span></span>`;
      case 'text':
      case 'long_text': {
        const text = String(value);
        return `<span class="board-text-cell" title="${esc(text)}">${esc(text)}</span>`;
      }
      default:
        return assertNever(column);
    }
  }

  const columnWorkflows = createColumnWorkflows({
    state,
    commands: commandService,
    dialog,
    icons,
    toast,
    escapeHtml: esc,
    canEdit,
    allColumns,
    optionList,
    columnTypeLabel,
    activeColumnFilter,
    persistBoardPrefs,
    removeColumnPreferenceReferences,
    populatedColumnValueCount,
    getCellValue,
    renderBoardData,
    loadBoard,
    overlayCoordinator,
    preferencePatches,
  });


  const reloadCurrentBoard = (): Promise<unknown> => {
    const boardId = state.board?.board?.id;
    return boardId ? loadBoard(boardId, { quiet: true }) : Promise.resolve(false);
  };
  const syncHistoryControls = (snapshot?: BoardHistorySnapshot): void => {
    const value = snapshot ?? history.snapshot();
    document.querySelectorAll<HTMLButtonElement>('[data-board-undo]').forEach((undo) => {
      undo.disabled = !value.canUndo;
      undo.title = value.undoLabel ? `Undo ${value.undoLabel}` : 'Nothing to undo';
      undo.setAttribute('aria-disabled', String(!value.canUndo));
    });
    document.querySelectorAll<HTMLButtonElement>('[data-board-redo]').forEach((redo) => {
      redo.disabled = !value.canRedo;
      redo.title = value.redoLabel ? `Redo ${value.redoLabel}` : 'Nothing to redo';
      redo.setAttribute('aria-disabled', String(!value.canRedo));
    });
  };
  const history = createBoardHistoryController({ toast, onChange: syncHistoryControls });
  const visibleItemsForSelection = (): readonly BoardItem[] => selectors.visibleTableItems();
  selection = createBoardSelectionController({ state, commands: commandService, toast, getVisibleItems: visibleItemsForSelection, reloadBoard: reloadCurrentBoard, escapeHtml: esc, canEdit, confirmAction: confirmBoardAction });

  const groupWorkflows = createGroupWorkflows({ commands: commandService, state, dialog, toast, escapeHtml: esc, reloadBoard: reloadCurrentBoard, confirmAction: confirmBoardAction });
  const itemWorkflows = createItemWorkflows({ commands: commandService, state, dialog, toast, escapeHtml: esc, reloadBoard: reloadCurrentBoard, getStatusLabels:boardStatusLabels, getDefaultStatus:()=>statusConfig(systemStatusColumn()).defaultLabelId, confirmAction: confirmBoardAction });
  const memberWorkflows = createMemberWorkflows({ commands: commandService, state, dialog, toast, escapeHtml: esc, reloadBoard: reloadCurrentBoard, confirmAction: confirmBoardAction });
  const activityWorkflows = createActivityWorkflows({ api, state, dialog, toast, escapeHtml: esc, formatDate: fmtDate });
  const inlineEdit = createBoardInlineEditController({ state, api, commands: commandService, toast, canEdit, allColumns, getCellValue, optionList, renderBoardData, history, escapeHtml:esc, overlayCoordinator, reloadBoard:reloadCurrentBoard, preferencePatches, statusLabelsFor, statusLabelForValue, confirmAction:confirmBoardAction, onClose:flushDeferredEditorVirtualization });
  const columnResize = createColumnResizeController({ state, preferencePatches, persistPreferences:persistBoardPrefs, history, renderBoardData });
  const structureDrag = createBoardStructureDragController({ state, commands: commandService, canEdit, toast, renderBoardData, history });

  function activeBoardEnvelope(): BoardEnvelope | null {
    return state.board?.board ? state.board : null;
  }

  function boardHeader(): string {
    const envelope = activeBoardEnvelope();
    return envelope?.board
      ? renderBoardHeader({ board: envelope.board, canEdit: canEdit(), canManage: canManage(), icons, escapeHtml: esc, realtime: realtimeSnapshot })
      : '';
  }

  function boardControls(): string {
    return renderBoardControls({ state, canEdit: canEdit(), icons, escapeHtml: esc, historyState: history.snapshot(), statusLabels: boardStatusLabels() });
  }

  const boardRowHeight = (): number => {
    const density = document.body.dataset.boardDensity;
    if (density === 'compact') return 40;
    if (density === 'comfortable') return 48;
    return 44;
  };

  const tableDynamicColumns = (): readonly BoardColumn[] => visibleColumns().filter((column) => column.system_key !== 'title');
  const tableDynamicColumnWidths = (): readonly number[] => tableDynamicColumns().map((column) => columnWidth(column.id));
  const hasVariableHeightRows = (): boolean => tableDynamicColumns().some((column) => isWrapped(column.id));
  const forceFullRowRendering = (): boolean => hasVariableHeightRows() || Boolean(dragDrop?.activeItemId);

  const canReorderTableItems = (): boolean => canEdit() && !state.showArchived && !sortConfig().id;

  function itemRow(item: BoardItem, group: BoardGroup, columns: readonly BoardColumn[], context: BoardTableItemRenderContext): string {
    return renderBoardItemRow({ state, item, group, columns, canEdit: canEdit(), canReorder: canReorderTableItems() && !item.archived_at, isWrapped, formatCell, escapeHtml: esc, isSelected: selection.isSelected(item.id), ...context });
  }

  function columnHeader(column: BoardColumn, logicalColumnIndex: number): string {
    return renderBoardColumnHeader({ column, canEdit: canEdit(), sort: sortConfig(), filter: activeColumnFilter(column.id), wrapped: isWrapped(column.id), currentWidth: columnWidth(column.id), columnTypeLabel, escapeHtml: esc, logicalColumnIndex });
  }

  function tableView(): string {
    const envelope = activeBoardEnvelope();
    if (!envelope) return '';
    const widths = tableDynamicColumnWidths();
    const forceFullRows = forceFullRowRendering();
    return renderBoardTableView({
      state,
      groups: [...envelope.groups].sort((left, right) => left.position - right.position),
      items: envelope.items,
      visibleColumns,
      allColumns,
      canEdit,
      itemMatches,
      compareItems,
      renderColumnHeader: columnHeader,
      renderItemRow: itemRow,
      escapeHtml: esc,
      isSelected: selection.isSelected,
      itemNameWidth: itemNameWidth(),
      columnWidth,
      rowWindowForGroup: (groupId, totalRows) => tableVirtualization.rowWindow(groupId, totalRows, boardRowHeight(), forceFullRows),
      columnWindow: tableVirtualization.columnWindow(widths),
    });
  }

  function kanbanView(): string {
    const envelope = activeBoardEnvelope();
    if (!envelope) return '';
    return renderBoardKanbanView({
      state,
      items: envelope.items,
      groups: envelope.groups,
      itemMatches,
      canEdit,
      memberMap,
      statusLabels: boardStatusLabels().filter((label) => label.active !== false),
      escapeHtml: esc,
      formatDay: day,
    });
  }

  function itemPanelMarkup(): string {
    return renderItemWorkspace({ state, canEdit, escapeHtml: esc, formatDate: fmtDate, formatDay: day });
  }

  function patchHost(host: HTMLElement | null, html: string): boolean {
    if (!host) return false;
    if (boardMarkup.get(host) === html) return false;
    host.innerHTML = html;
    boardMarkup.set(host, html);
    return true;
  }

  // v1.32.4: persistent Item Workspace shell with content-scoped tab transitions.
  const itemPanelRenderer = createItemPanelRenderer({
    getHost: () => document.querySelector<HTMLElement>('[data-item-panel-host]'),
    patchFull: patchHost,
  });

  function renderItemPanel(): void {
    itemPanelRenderer.render(itemPanelMarkup());
    document.body.classList.toggle('board-item-panel-open', Boolean(state.itemPanel.itemId));
  }

  const itemWorkspace = createItemWorkspaceController({ api, commands: commandService, state, toast, renderBoard: renderBoardData, renderPanel: renderItemPanel, reloadBoard: async () => { const boardId = state.board?.board?.id; return boardId ? loadBoard(boardId, { quiet:true, force:true }) : false; }, confirmAction: confirmBoardAction });
  if (realtime) {
    realtimeController = createBoardRealtimeController({
      service: realtime,
      boardService: api,
      reloadBoard: (boardId) => loadBoard(boardId, { quiet:true, force:true }),
      reloadItemWorkspace: (itemId) => state.itemPanel.itemId === itemId ? itemWorkspace.load(itemId, { quiet:true }) : Promise.resolve(false),
      shouldDeferSync: () => Boolean(inlineEdit.activeEditor || dragDrop?.activeItemId || structureDrag.activeDragType),
      onSnapshot: (snapshot) => { realtimeSnapshot = snapshot; renderBoardData(); },
      onWarning: (message) => toast(message, 'warning'),
    });
  }
  dragDrop = createBoardDragDropController({ commands: commandService, state, canEdit, getItems: () => state.board?.items ?? [], toast, renderBoard: renderBoardData, history });

  function ensureBoardWorkspaceShell(main: HTMLElement): void {
    if (main.querySelector('[data-board-workspace-shell]')) return;
    main.innerHTML = `<div class="board-state-host" data-board-state-host></div><div class="board-workspace-shell" data-board-workspace-shell hidden><div data-board-header-host></div><div data-board-controls-host></div><section id="boardViewRegion" class="board-view-region" data-board-view-host role="tabpanel" aria-live="polite"></section><div data-board-selection-host></div><div data-item-panel-host></div></div>`;
  }

  function clearBoardDetailCommitIdentity(main: HTMLElement): void {
    delete main.dataset.boardDetailId;
    delete main.dataset.boardDetailName;
    delete main.dataset.boardDetailCommitRevision;
  }

  function scheduleBoardDetailCommittedReady(main: HTMLElement, board: BoardRecord): void {
    cancelAnimationFrame(boardDetailCommitFrame);
    const expectedId = String(board.id);
    const expectedName = String(board.name ?? '').trim();
    const revision = ++boardDetailCommitRevision;
    const headerHost = main.querySelector<HTMLElement>('[data-board-header-host]');
    if (headerHost) {
      headerHost.dataset.boardDetailCommitId = expectedId;
      headerHost.dataset.boardDetailCommitName = expectedName;
      headerHost.dataset.boardDetailCommitRevision = String(revision);
    }
    boardDetailCommitFrame = requestAnimationFrame(() => {
      boardDetailCommitFrame = 0;
      const presentationHost = main.closest<HTMLElement>('[data-wm-board-presentation-host]');
      const currentMain = presentationHost?.querySelector<HTMLElement>('#boardMain') ?? null;
      const currentBoard = activeBoardEnvelope()?.board ?? null;
      const workspace = main.querySelector<HTMLElement>('[data-board-workspace-shell]');
      const committedHeaderHost = main.querySelector<HTMLElement>('[data-board-header-host]');
      const title = committedHeaderHost?.querySelector<HTMLElement>('#board-workspace-title') ?? null;
      const committed = main.isConnected
        && currentMain === main
        && presentationHost?.dataset.wmBoardPresentationRoute === 'workspace'
        && String(presentationHost?.dataset.wmBoardId ?? '') === expectedId
        && String(currentBoard?.id ?? '') === expectedId
        && String(currentBoard?.name ?? '').trim() === expectedName
        && Boolean(workspace && !workspace.hidden)
        && committedHeaderHost?.dataset.boardDetailCommitId === expectedId
        && committedHeaderHost?.dataset.boardDetailCommitName === expectedName
        && committedHeaderHost?.dataset.boardDetailCommitRevision === String(revision)
        && title?.textContent?.trim() === expectedName;
      if (committed) {
        main.dataset.boardDetailId = expectedId;
        main.dataset.boardDetailName = expectedName;
        main.dataset.boardDetailCommitRevision = String(revision);
        main.dataset.boardDetailState = 'ready';
        boardDetailCommitRetryBoardId = expectedId;
        boardDetailCommitRetryCount = 0;
        return;
      }
      if (currentMain === main && main.isConnected) {
        main.dataset.boardDetailState = 'committing';
        clearBoardDetailCommitIdentity(main);
      }
      if (!currentBoard || String(currentBoard.id) !== expectedId || state.loading || state.error) return;
      if (boardDetailCommitRetryBoardId !== expectedId) {
        boardDetailCommitRetryBoardId = expectedId;
        boardDetailCommitRetryCount = 0;
      }
      if (boardDetailCommitRetryCount >= BOARD_DETAIL_COMMIT_RETRY_LIMIT) return;
      boardDetailCommitRetryCount += 1;
      queueMicrotask(() => {
        const latest = activeBoardEnvelope()?.board ?? null;
        if (!latest || String(latest.id) !== expectedId || state.loading || state.error) return;
        renderBoardData();
      });
    });
  }

  function captureBoardViewGeometry(host: HTMLElement | null): BoardViewGeometry {
    const tables = new Map<string, number>();
    host?.querySelectorAll<HTMLElement>('.board-group[data-group-id] .board-table-scroll').forEach((scroll) => {
      const group = scroll.closest<HTMLElement>('.board-group[data-group-id]');
      if (group) tables.set(String(group.dataset.groupId ?? ''), scroll.scrollLeft);
    });
    return { tables, kanbanLeft: host?.querySelector<HTMLElement>('.kanban-board')?.scrollLeft ?? 0 };
  }

  function restoreBoardViewGeometry(host: HTMLElement | null, snapshot: BoardViewGeometry): void {
    if (!host) return;
    requestAnimationFrame(() => {
      host.querySelectorAll<HTMLElement>('.board-group[data-group-id] .board-table-scroll').forEach((scroll) => {
        const group = scroll.closest<HTMLElement>('.board-group[data-group-id]');
        const left = group ? snapshot.tables.get(String(group.dataset.groupId ?? '')) : 0;
        if (Number.isFinite(left)) scroll.scrollLeft = left ?? 0;
      });
      const kanban = host.querySelector<HTMLElement>('.kanban-board');
      if (kanban && Number.isFinite(snapshot.kanbanLeft)) kanban.scrollLeft = snapshot.kanbanLeft;
    });
  }

  function syncBoardViewAccessibility(main: HTMLElement): void {
    const viewHost = main.querySelector<HTMLElement>('[data-board-view-host]');
    const activeTab = main.querySelector<HTMLElement>('[data-board-view][aria-selected="true"]');
    if (!viewHost) return;
    if (activeTab?.id) viewHost.setAttribute('aria-labelledby', activeTab.id);
    else viewHost.removeAttribute('aria-labelledby');
  }

  function renderBoardViewOnly(options: BoardViewRenderOptions = {}): void {
    if (boardMenuController?.active) {
      virtualizationRenderDeferredForMenu = true;
      return;
    }
    const preservedGridFocus = pendingGridFocus ? null : captureActiveGridFocusTarget();
    const main = document.querySelector<HTMLElement>('#boardMain');
    const host = main?.querySelector<HTMLElement>('[data-board-view-host]') ?? null;
    const envelope = activeBoardEnvelope();
    if (!main || !host || !envelope?.board) return;
    const capturedGeometry = captureBoardViewGeometry(host);
    const requestedLeft = options.tableScrollLeft;
    const geometry = typeof requestedLeft === 'number' && Number.isFinite(requestedLeft)
      ? {
          tables: new Map([...capturedGeometry.tables].map(([groupId]) => [groupId, Number(requestedLeft)] as const)),
          kanbanLeft: capturedGeometry.kanbanLeft,
        } satisfies BoardViewGeometry
      : capturedGeometry;
    const nextMarkup = (envelope.board.view_mode ?? envelope.board.view) === 'kanban' ? kanbanView() : tableView();
    if (boardMarkup.get(host) !== nextMarkup) boardMenuController?.close();
    patchHost(host, nextMarkup);
    syncBoardViewAccessibility(main);
    restoreBoardViewGeometry(host, geometry);
    scheduleBoardVirtualizationSync();
    patchHost(main.querySelector<HTMLElement>('[data-board-selection-host]'), selection.renderToolbar());
    syncHistoryControls();
    if (preservedGridFocus && focusLogicalGridCell(preservedGridFocus.itemId, preservedGridFocus.columnIndex, preservedGridFocus.scrollLeft)) {
      armPendingGridFocus(preservedGridFocus);
    }
  }

  function renderBoardData(): void {
    if (boardMenuController?.active) {
      fullBoardRenderDeferredForMenu = true;
      return;
    }
    const preservedGridFocus = pendingGridFocus ? null : captureActiveGridFocusTarget();
    const main = document.querySelector<HTMLElement>('#boardMain');
    if (!main) return;
    ensureBoardWorkspaceShell(main);
    const stateHost = main.querySelector<HTMLElement>('[data-board-state-host]');
    const workspace = main.querySelector<HTMLElement>('[data-board-workspace-shell]');
    if (!stateHost || !workspace) return;
    if (state.loading) {
      cancelAnimationFrame(boardDetailCommitFrame);
      boardDetailCommitFrame = 0;
      main.dataset.boardDetailState = 'loading';
      clearBoardDetailCommitIdentity(main);
      workspace.hidden = true;
      stateHost.hidden = false;
      patchHost(stateHost, '<div class="boards-state"><span class="button-spinner"></span><h3>Loading board</h3><p>Fetching groups, items, columns, and your saved view…</p></div>');
      return;
    }
    if (state.error) {
      cancelAnimationFrame(boardDetailCommitFrame);
      boardDetailCommitFrame = 0;
      main.dataset.boardDetailState = 'error';
      clearBoardDetailCommitIdentity(main);
      workspace.hidden = true;
      stateHost.hidden = false;
      patchHost(stateHost, `<div class="boards-state error"><h3>This board couldn’t load</h3><p>${esc(state.error)}</p><button class="secondary-btn" data-board-detail-retry>Try again</button></div>`);
      return;
    }
    const envelope = activeBoardEnvelope();
    if (!envelope?.board) {
      cancelAnimationFrame(boardDetailCommitFrame);
      boardDetailCommitFrame = 0;
      main.dataset.boardDetailState = 'not-found';
      clearBoardDetailCommitIdentity(main);
      workspace.hidden = true;
      stateHost.hidden = false;
      patchHost(stateHost, '<div class="boards-state"><h3>Board not found</h3><p>This board may have been deleted, moved, or you may no longer have access.</p></div>');
      return;
    }
    cancelAnimationFrame(boardDetailCommitFrame);
    boardDetailCommitFrame = 0;
    main.dataset.boardDetailState = 'committing';
    clearBoardDetailCommitIdentity(main);
    stateHost.hidden = true;
    patchHost(stateHost, '');
    workspace.hidden = false;
    const headerHost = main.querySelector<HTMLElement>('[data-board-header-host]');
    patchHost(headerHost, boardHeader());
    patchHost(main.querySelector<HTMLElement>('[data-board-controls-host]'), boardControls());
    const viewHost = main.querySelector<HTMLElement>('[data-board-view-host]');
    const geometry = captureBoardViewGeometry(viewHost);
    const nextView = (envelope.board.view_mode ?? envelope.board.view) === 'kanban' ? kanbanView() : tableView();
    if (viewHost && boardMarkup.get(viewHost) !== nextView) boardMenuController?.close();
    patchHost(viewHost, nextView);
    syncBoardViewAccessibility(main);
    restoreBoardViewGeometry(viewHost, geometry);
    scheduleBoardVirtualizationSync();
    patchHost(main.querySelector<HTMLElement>('[data-board-selection-host]'), selection.renderToolbar());
    patchHost(main.querySelector<HTMLElement>('[data-item-panel-host]'), itemPanelMarkup());
    document.body.classList.toggle('board-item-panel-open', Boolean(state.itemPanel.itemId));
    syncHistoryControls();
    if (preservedGridFocus && focusLogicalGridCell(preservedGridFocus.itemId, preservedGridFocus.columnIndex, preservedGridFocus.scrollLeft)) {
      armPendingGridFocus(preservedGridFocus);
    }
    scheduleBoardDetailCommittedReady(main, envelope.board);
  }

  function renderBoard(boardId: string): void {
    cancelAnimationFrame(boardDetailCommitFrame);
    boardDetailCommitFrame = 0;
    boardDetailCommitRetryBoardId = String(boardId);
    boardDetailCommitRetryCount = 0;
    void preferencePersistence.flushPending();
    releaseListEventBinding();
    realtimeController?.disconnect();
    realtimeSnapshot = Object.freeze({ state:'idle', boardId:null, collaborators:[], lastEventAt:null, lastError:null, fallbackPolling:false });
    listMenuController?.dispose();
    listMenuController = null;
    itemWorkspace.reset();
    itemPanelRenderer.reset();
    resetBoardInteractionState(state);
    tableVirtualization.reset();
    history.reset();
    const content = `${topbar('Board', 'Shared work items, ownership and workflow state.')}
      <main id="main" class="page board-detail-page"><section id="boardMain" data-wm-motion-static="true" aria-live="polite"><div class="board-state-host" data-board-state-host><div class="boards-state"><span class="button-spinner"></span><h3>Loading board</h3><p>Fetching groups, items, columns, and your saved view…</p></div></div><div class="board-workspace-shell" data-board-workspace-shell hidden><div data-board-header-host></div><div data-board-controls-host></div><section id="boardViewRegion" class="board-view-region" data-board-view-host role="tabpanel" aria-live="polite"></section><div data-board-selection-host></div><div data-item-panel-host></div></div></section></main>`;
    renderWorkspace(content, 'boards', 'page');
    attachBoardEvents();
    void loadBoard(boardId);
  }

  function closeColumnMenus(root: ParentNode = document): void {
    root.querySelectorAll<HTMLDetailsElement>('.column-context-menu[open]').forEach((menu) => {
      menu.open = false;
      const pop = menu.querySelector<HTMLElement>('.column-context-pop');
      if (pop) {
        pop.style.left = '';
        pop.style.top = '';
        pop.style.maxHeight = '';
        pop.style.visibility = '';
      }
    });
  }

  function closeItemMenus(): void { boardMenuController?.close(); }

  function replaceActiveBoardItems(boardId: string, update: (items: readonly BoardItem[]) => readonly BoardItem[]): void {
    const envelope = state.board;
    if (!envelope?.board || String(envelope.board.id) !== String(boardId)) return;
    state.board = { ...envelope, items: update(envelope.items) };
  }

  function replaceActiveBoardRecord(boardId: string, update: (board: BoardRecord) => BoardRecord): void {
    const envelope = state.board;
    if (!envelope?.board || String(envelope.board.id) !== String(boardId)) return;
    state.board = { ...envelope, board: update(envelope.board) };
  }

  const focusInlineAdd = (groupId: string): void => {
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-inline-add-item="${CSS.escape(groupId)}"]`)?.focus());
  };

  async function createInlineItem(input: HTMLInputElement, keepAdding = false): Promise<void> {
    if (!canEdit()) return;
    const envelope = state.board;
    const board = envelope?.board;
    const groupId = input.dataset.inlineAddItem;
    if (!envelope || !board || !groupId) return;

    const title = input.value.trim();
    if (!title) return;
    if (title.length > 240) {
      toast('Item name is limited to 240 characters.', 'warning');
      return;
    }

    const peers = envelope.items.filter((item) => String(item.group_id) === groupId && !item.archived_at);
    const tempId = `temp:${crypto.randomUUID?.() || Date.now()}`;
    const tempItem: BoardItem = {
      id: tempId,
      board_id: board.id,
      group_id: groupId,
      title,
      status: statusConfig(systemStatusColumn()).defaultLabelId,
      assignee_id: null,
      due_date: null,
      notes: '',
      position: peers.length,
      archived_at: null,
    };

    state.board = { ...envelope, items: [...envelope.items, tempItem] };
    input.value = '';
    renderBoardData();
    if (keepAdding) focusInlineAdd(groupId);

    try {
      let currentId = await commandService.addItem(board.id, groupId, title);
      replaceActiveBoardItems(board.id, (items) => items.map((item) => item.id === tempId ? { ...item, id: currentId } : item));
      history.push({
        label: 'item creation',
        undo: async () => {
          await commandService.deleteItem(currentId);
          replaceActiveBoardItems(board.id, (items) => items.filter((item) => String(item.id) !== String(currentId)));
          renderBoardData();
        },
        redo: async () => {
          currentId = await commandService.addItem(board.id, groupId, title);
          replaceActiveBoardItems(board.id, (items) => [...items, { ...tempItem, id: currentId }]);
          renderBoardData();
        },
      });
      toast('Item added to the board.');
      renderBoardData();
      if (keepAdding) focusInlineAdd(groupId);
    } catch (error) {
      replaceActiveBoardItems(board.id, (items) => items.filter((item) => item.id !== tempId));
      renderBoardData();
      toast(errorMessage(error, 'The item could not be added.'), 'warning');
    }
  }

  type GridNavigationKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End';

  function isGridNavigationKey(key: string): key is GridNavigationKey {
    return key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown' || key === 'Home' || key === 'End';
  }

  function isBoardViewMode(value: string | undefined): value is BoardViewMode {
    return value === 'table' || value === 'kanban';
  }

  function isSortDirection(value: string | undefined): value is 'asc' | 'desc' | 'none' {
    return value === 'asc' || value === 'desc' || value === 'none';
  }

  interface GridNavigationRow {
    readonly item: BoardItem;
    readonly group: BoardGroup;
    readonly rowIndex: number;
    readonly totalRows: number;
  }

  function gridNavigationRows(): readonly GridNavigationRow[] {
    const envelope = activeBoardEnvelope();
    if (!envelope) return [];
    const rows: GridNavigationRow[] = [];
    const collapsedGroups = new Set((state.boardPrefs.collapsed_groups ?? []).map(String));
    const groups = [...envelope.groups].sort((left, right) => left.position - right.position);
    for (const group of groups) {
      if (collapsedGroups.has(String(group.id))) continue;
      const items = envelope.items
        .filter((item) => String(item.group_id) === String(group.id) && itemMatches(item))
        .sort(compareItems);
      items.forEach((item, rowIndex) => rows.push({ item, group, rowIndex, totalRows: items.length }));
    }
    return rows;
  }

  function focusLogicalGridCell(itemId: string, logicalColumnIndex: number, scrollLeft: number | null = null): boolean {
    const focusNow = (): boolean => {
      if (scrollLeft !== null) {
        document.querySelectorAll<HTMLElement>('.board-table-scroll').forEach((scroller) => {
          scroller.scrollLeft = scrollLeft;
        });
      }
      const row = document.querySelector<HTMLElement>(`.board-item-row[data-item-id="${CSS.escape(itemId)}"]`);
      const next = logicalColumnIndex === 0
        ? row?.querySelector<HTMLElement>('.item-inline-title[data-grid-column-index="0"]')
        : row?.querySelector<HTMLElement>(`.board-cell-button[data-grid-column-index="${logicalColumnIndex}"]`);
      if (!next) return false;
      next.focus({ preventScroll: true });
      next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      return true;
    };
    if (focusNow()) return true;
    requestAnimationFrame(() => { focusNow(); });
    return false;
  }

  function armPendingGridFocus(target: PendingGridFocus): void {
    pendingGridFocus = target;
    // Settle against an actual viewport measurement instead of a fixed frame count.
    // This keeps logical focus authoritative through delayed Resize/scroll-driven
    // virtualization work, while still releasing it as soon as the measured
    // row/column windows and DOM focus agree on the requested cell.
    scheduleBoardVirtualizationSync();
  }

  function settlePendingGridFocusIfStable(rowChanged: boolean, columnChanged: boolean): void {
    const target = pendingGridFocus;
    if (!target || rowChanged || columnChanged) return;
    const active = activeGridCoordinate();
    if (active && active.itemId === target.itemId && active.groupId === target.groupId && active.rowIndex === target.rowIndex && active.columnIndex === target.columnIndex) {
      pendingGridFocus = null;
      return;
    }
    // A DOM replacement can drop focus after the logical row/column windows have
    // already stabilized. Reassert the requested cell instead of leaving a stale
    // pending target with document/body focus and no future render to recover it.
    if (focusLogicalGridCell(target.itemId, target.columnIndex, target.scrollLeft)) {
      scheduleBoardVirtualizationSync();
      return;
    }
    // Stable viewport state without the target cell is inconsistent with the
    // logical navigation contract; force one governed materialization pass.
    requestVirtualizedBoardRender();
  }

  function focusAdjacentGridCoordinate(currentItemId: string, currentColumnIndex: number, key: GridNavigationKey): boolean {
    if (!Number.isInteger(currentColumnIndex) || currentColumnIndex < 0) return false;
    const logicalColumns = tableDynamicColumns();
    const rows = gridNavigationRows();
    const currentRowIndex = rows.findIndex((entry) => String(entry.item.id) === String(currentItemId));
    if (currentRowIndex < 0) return false;

    let targetRow = rows[currentRowIndex];
    let targetColumnIndex = currentColumnIndex;
    if (key === 'ArrowLeft') targetColumnIndex -= 1;
    if (key === 'ArrowRight') targetColumnIndex += 1;
    if (key === 'Home') targetColumnIndex = 0;
    if (key === 'End') targetColumnIndex = logicalColumns.length;
    if (key === 'ArrowUp') targetRow = rows[currentRowIndex - 1];
    if (key === 'ArrowDown') targetRow = rows[currentRowIndex + 1];
    if (!targetRow || targetColumnIndex < 0 || targetColumnIndex > logicalColumns.length) return false;

    const forceFullRows = forceFullRowRendering();
    const rowChanged = tableVirtualization.ensureRowVisible(String(targetRow.group.id), targetRow.rowIndex, targetRow.totalRows, boardRowHeight(), forceFullRows);
    const columnResult = targetColumnIndex > 0
      ? tableVirtualization.ensureColumnVisible(targetColumnIndex - 1, tableDynamicColumnWidths())
      : Object.freeze({ changed: false, scrollLeft: 0 });
    const focusTarget: PendingGridFocus = Object.freeze({
      itemId: String(targetRow.item.id),
      groupId: String(targetRow.group.id),
      rowIndex: targetRow.rowIndex,
      totalRows: targetRow.totalRows,
      columnIndex: targetColumnIndex,
      scrollLeft: columnResult.changed ? columnResult.scrollLeft : null,
    });
    if (rowChanged || columnResult.changed) {
      renderBoardViewOnly(columnResult.changed ? { tableScrollLeft: columnResult.scrollLeft } : undefined);
    }
    focusLogicalGridCell(focusTarget.itemId, focusTarget.columnIndex, focusTarget.scrollLeft);
    armPendingGridFocus(focusTarget);
    return true;
  }

  function focusAdjacentCell(target: HTMLElement, key: GridNavigationKey): boolean {
    const row = target.closest<HTMLElement>('.board-item-row[data-item-id][data-group-id]');
    const currentItemId = row?.dataset.itemId;
    if (!row || !currentItemId) return false;
    const currentColumnIndex = Number(target.dataset.gridColumnIndex ?? Number.NaN);
    return focusAdjacentGridCoordinate(currentItemId, currentColumnIndex, key);
  }

  function captureActiveGridFocusTarget(): PendingGridFocus | null {
    const active = activeGridCoordinate();
    if (!active) return null;
    const row = gridNavigationRows().find((entry) => String(entry.item.id) === active.itemId);
    if (!row) return null;
    const scroller = document.querySelector<HTMLElement>(`.board-table-scroll[data-group-table-scroll="${CSS.escape(active.groupId)}"]`);
    return Object.freeze({
      itemId: active.itemId,
      groupId: active.groupId,
      rowIndex: active.rowIndex,
      totalRows: row.totalRows,
      columnIndex: active.columnIndex,
      scrollLeft: scroller?.scrollLeft ?? null,
    });
  }

  function activeGridCoordinate(): { readonly itemId: string; readonly groupId: string; readonly rowIndex: number; readonly columnIndex: number } | null {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !active.matches('.item-inline-title,.board-cell-button')) return null;
    const row = active.closest<HTMLElement>('.board-item-row[data-item-id][data-group-id][data-virtual-row-index]');
    const itemId = row?.dataset.itemId;
    const groupId = row?.dataset.groupId;
    const rowIndex = Number(row?.dataset.virtualRowIndex ?? Number.NaN);
    const columnIndex = Number(active.dataset.gridColumnIndex ?? Number.NaN);
    return itemId && groupId && Number.isInteger(rowIndex) && Number.isInteger(columnIndex)
      ? Object.freeze({ itemId, groupId, rowIndex, columnIndex })
      : null;
  }

  function requestVirtualizedBoardRender(): void {
    if (virtualizationFrame || dragDrop?.activeItemId || inlineEdit.activeEditor) return;
    virtualizationFrame = requestAnimationFrame(() => {
      virtualizationFrame = 0;
      if (inlineEdit.activeEditor) return;
      if (boardMenuController?.active) {
        virtualizationRenderDeferredForMenu = true;
        return;
      }
      const navigationTarget = pendingGridFocus;
      const coordinate = navigationTarget ?? activeGridCoordinate();
      let tableScrollLeft: number | null = navigationTarget?.scrollLeft ?? null;
      if (navigationTarget) {
        tableVirtualization.ensureRowVisible(navigationTarget.groupId, navigationTarget.rowIndex, navigationTarget.totalRows, boardRowHeight(), forceFullRowRendering());
        if (navigationTarget.columnIndex > 0) {
          const columnResult = tableVirtualization.ensureColumnVisible(navigationTarget.columnIndex - 1, tableDynamicColumnWidths());
          if (columnResult.changed || tableScrollLeft === null) tableScrollLeft = columnResult.scrollLeft;
        }
      } else if (coordinate) {
        const envelope = activeBoardEnvelope();
        const totalRows = envelope?.items.filter((item) => String(item.group_id) === coordinate.groupId && itemMatches(item)).length ?? 0;
        const rowWindow = tableVirtualization.rowWindow(coordinate.groupId, totalRows, boardRowHeight(), forceFullRowRendering());
        const columnWindow = tableVirtualization.columnWindow(tableDynamicColumnWidths());
        const rowVisible = coordinate.rowIndex >= rowWindow.start && coordinate.rowIndex < rowWindow.end;
        const dynamicColumnIndex = coordinate.columnIndex - 1;
        const columnVisible = coordinate.columnIndex === 0 || !columnWindow.enabled || (dynamicColumnIndex >= columnWindow.start && dynamicColumnIndex < columnWindow.end);
        if (!rowVisible || !columnVisible) {
          document.querySelector<HTMLElement>(`.board-table-scroll[data-group-table-scroll="${CSS.escape(coordinate.groupId)}"]`)?.focus({ preventScroll: true });
        }
      }
      inlineEdit.dismissPopover({ restore: false });
      closeColumnMenus(document);
      renderBoardViewOnly(tableScrollLeft !== null ? { tableScrollLeft } : undefined);
      if (navigationTarget) {
        focusLogicalGridCell(navigationTarget.itemId, navigationTarget.columnIndex, tableScrollLeft);
        armPendingGridFocus({ ...navigationTarget, scrollLeft: tableScrollLeft });
      }
    });
  }

  function flushDeferredBoardRender(): void {
    if (fullBoardRenderDeferredForMenu) {
      fullBoardRenderDeferredForMenu = false;
      virtualizationRenderDeferredForMenu = false;
      renderBoardData();
      return;
    }
    if (!virtualizationRenderDeferredForMenu) return;
    virtualizationRenderDeferredForMenu = false;
    requestVirtualizedBoardRender();
  }

  let syncingBoardTableScroll = false;

  function flushDeferredEditorVirtualization(): void {
    if (!virtualizationRenderDeferredForEditor) return;
    virtualizationRenderDeferredForEditor = false;
    requestAnimationFrame(() => {
      const root = document.querySelector<HTMLElement>('.board-detail-page');
      if (root) syncBoardVirtualizationFromViewport(root);
    });
  }

  function syncBoardVirtualizationFromViewport(root: HTMLElement): void {
    if (!root.isConnected || dragDrop?.activeItemId) return;
    if (inlineEdit.activeEditor) {
      virtualizationRenderDeferredForEditor = true;
      return;
    }
    const rowChanged = tableVirtualization.updateRowsFromViewport(root, boardRowHeight(), forceFullRowRendering());
    const scroller = root.querySelector<HTMLElement>('.board-table-scroll');
    const columnChanged = Boolean(scroller && tableVirtualization.updateColumnsFromScroller(scroller, tableDynamicColumnWidths()));
    if (rowChanged || columnChanged) {
      requestVirtualizedBoardRender();
      return;
    }
    settlePendingGridFocusIfStable(rowChanged, columnChanged);
  }

  function scheduleBoardVirtualizationSync(): void {
    cancelAnimationFrame(virtualizationMeasureFrame);
    virtualizationMeasureFrame = requestAnimationFrame(() => {
      virtualizationMeasureFrame = 0;
      const root = document.querySelector<HTMLElement>('.board-detail-page');
      if (root) syncBoardVirtualizationFromViewport(root);
    });
  }

  function attachBoardEvents(): void {
    const root = document.querySelector<HTMLElement>('.board-detail-page');
    if (!root) return;
    releaseBoardEventBinding();
    boardEventBinding = new AbortController();
    const signal = boardEventBinding.signal;
    root.dataset.boardDetailEventsBound = 'true';

    boardMenuController?.dispose();
    boardMenuController = createBoardMenuController({ root, escapeHtml: esc, overlayCoordinator, onClose: flushDeferredBoardRender });

    // During a virtual-window replacement the focused cell can be detached between
    // sequential keyboard events. Capture only that transient interval so rapid
    // Arrow/Home/End sequences continue from the governed logical target instead
    // of dropping keystrokes on document.body.
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      const target = pendingGridFocus;
      if (!target || !isGridNavigationKey(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && root.contains(active) && active.matches('.item-inline-title,.board-cell-button')) return;
      if (focusAdjacentGridCoordinate(target.itemId, target.columnIndex, event.key)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, { capture: true, signal });

    root.addEventListener('pointerdown', (event: PointerEvent) => {
      pendingGridFocus = null;
      inlineEdit.handleDocumentPointer();
      const target = eventElement(event);
      if (!target) return;
      if (!target.closest('.column-context-menu')) closeColumnMenus(root);
      if (!target.closest('[data-board-menu-trigger],.board-floating-menu')) closeItemMenus();
    }, { signal });

    root.addEventListener('wheel', () => { pendingGridFocus = null; }, { passive: true, signal });
    root.addEventListener('touchstart', () => { pendingGridFocus = null; }, { passive: true, signal });

    root.addEventListener('keydown', (event: KeyboardEvent) => {
      const target = eventElement(event);
      if (!(target instanceof HTMLElement)) return;
      const editable = target.matches('input,textarea,[contenteditable="true"]');
      if ((event.metaKey || event.ctrlKey) && !editable && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        void (event.shiftKey ? history.redo() : history.undo());
        return;
      }
      if ((event.ctrlKey || event.metaKey) && !editable && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        void history.redo();
        return;
      }
      if (target instanceof HTMLInputElement && target.matches('[data-inline-add-item]') && event.key === 'Enter') {
        event.preventDefault();
        void createInlineItem(target, event.shiftKey);
        return;
      }
      const viewTab = target.closest<HTMLButtonElement>('[data-board-view]');
      if (viewTab && (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End')) {
        const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-board-view]')];
        const index = tabs.indexOf(viewTab);
        if (index >= 0 && tabs.length) {
          event.preventDefault();
          let nextIndex = index;
          if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
          if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
          if (event.key === 'Home') nextIndex = 0;
          if (event.key === 'End') nextIndex = tabs.length - 1;
          const next = tabs[nextIndex];
          next?.focus();
          if (next && next !== viewTab) next.click();
        }
        return;
      }
      if (target.matches('.item-inline-title,.board-cell-button') && isGridNavigationKey(event.key)) {
        if (focusAdjacentCell(target, event.key)) event.preventDefault();
        return;
      }
      if (target.matches('.item-inline-title,.board-cell-button') && event.key === 'Enter') {
        event.preventDefault();
        target.click();
        return;
      }
      if (event.key === 'Escape' && overlayCoordinator.active) return;
      itemWorkspace.handleKeydown(event);
    }, { signal });

    root.addEventListener('scroll', (event: Event) => {
      const target = eventElement(event);
      const scroller = target?.closest<HTMLElement>('.board-table-scroll');
      if (!scroller) return;
      if (syncingBoardTableScroll) return;
      const editorActive = inlineEdit.activeEditor;
      if (!editorActive) {
        closeColumnMenus(root);
        inlineEdit.dismissPopover({ restore: false });
      } else {
        virtualizationRenderDeferredForEditor = true;
      }
      syncingBoardTableScroll = true;
      const left = scroller.scrollLeft;
      root.querySelectorAll<HTMLElement>('.board-table-scroll').forEach((peer) => {
        if (peer !== scroller && Math.abs(peer.scrollLeft - left) > 1) peer.scrollLeft = left;
      });
      if (!editorActive) {
        const virtualColumnChanged = !dragDrop?.activeItemId && tableVirtualization.updateColumnsFromScroller(scroller, tableDynamicColumnWidths());
        if (virtualColumnChanged) requestVirtualizedBoardRender();
      }
      requestAnimationFrame(() => {
        syncingBoardTableScroll = false;
        if (editorActive) inlineEdit.repositionPopover();
      });
    }, { capture: true, signal });

    boardResizeCleanup?.();
    const onBoardViewportChange = (): void => {
      if (!root.isConnected) {
        boardResizeCleanup?.();
        return;
      }
      boardMenuController?.position();
      inlineEdit.repositionPopover();
      syncBoardVirtualizationFromViewport(root);
    };
    window.addEventListener('resize', onBoardViewportChange, { passive: true });
    window.addEventListener('scroll', onBoardViewportChange, { passive: true });
    boardResizeCleanup = () => {
      window.removeEventListener('resize', onBoardViewportChange);
      window.removeEventListener('scroll', onBoardViewportChange);
      boardResizeCleanup = null;
    };

    root.addEventListener('input', (event: Event) => {
      if (itemWorkspace.handleInput(event)) return;
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || !target.matches('[data-item-search]')) return;
      state.itemSearch = target.value;
      cancelAnimationFrame(itemSearchFrame);
      itemSearchFrame = requestAnimationFrame(() => {
        itemSearchFrame = 0;
        renderBoardViewOnly();
      });
    }, { signal });

    root.addEventListener('submit', (event: SubmitEvent) => { void (async () => { if (await itemWorkspace.submitUpdate(event)) return; await itemWorkspace.submitProperty(event); })(); }, { signal });
    root.addEventListener('change', (event: Event) => { void itemWorkspace.uploadFiles(event); }, { signal });
    for (const type of ['dragenter', 'dragover', 'dragleave', 'drop'] as const) {
      root.addEventListener(type, (event: DragEvent) => { itemWorkspace.handleFileDrag(event); }, { signal });
    }
    root.addEventListener('change', (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement) || !target.matches('[data-item-status]')) return;
      state.itemStatus = target.value;
      renderBoardData();
    }, { signal });

    root.addEventListener('click', async (event: MouseEvent) => {
      const target = eventElement(event);
      if (!(target instanceof HTMLElement)) return;
      if (itemWorkspace.handleScrim(target)) return;
      if (boardMenuController?.handleTrigger(target)) {
        event.preventDefault();
        return;
      }

      const envelope = state.board;
      const board = envelope?.board;
      const boardId = board?.id;

      const rowSelect = target.closest<HTMLElement>('[data-select-item]');
      if (rowSelect) {
        const itemId = rowSelect.dataset.selectItem;
        if (itemId) selection.toggle(itemId, { range: event.shiftKey });
        renderBoardData();
        return;
      }

      const selectVisible = target.closest<HTMLInputElement>('[data-select-visible]');
      if (selectVisible) {
        selection.selectVisible(selectVisible.checked, selectVisible.dataset.selectVisible || null);
        renderBoardData();
        return;
      }

      const btn = target.closest<HTMLButtonElement>('button');
      if (!btn) return;
      if (btn.closest('.board-floating-menu')) boardMenuController?.close();

      if (btn.matches('[data-board-back]')) { navigate('boards'); return; }
      if (btn.matches('[data-board-detail-retry]')) { if (boardId) void loadBoard(boardId); return; }
      if (btn.matches('[data-board-undo]')) { await history.undo(); return; }
      if (btn.matches('[data-board-redo]')) { await history.redo(); return; }
      if (btn.matches('[data-clear-item-search]')) {
        state.itemSearch = '';
        renderBoardData();
        requestAnimationFrame(() => root.querySelector<HTMLInputElement>('[data-item-search]')?.focus());
        return;
      }
      if (btn.matches('[data-toolbar-status-value]')) {
        const value = btn.dataset.toolbarStatusValue;
        if (!value) return;
        state.itemStatus = value;
        selection.clear();
        renderBoardData();
        return;
      }
      if (btn.matches('[data-selection-clear]')) { selection.clear(); renderBoardData(); return; }
      if (btn.matches('[data-selection-duplicate]')) { await selection.duplicateSelected(); return; }
      if (btn.matches('[data-selection-archive]')) { await selection.archiveSelected(); return; }
      if (btn.matches('[data-selection-delete]')) { await selection.deleteSelected(); return; }
      if (btn.matches('[data-selection-export]')) { selection.exportSelected(); return; }
      if (btn.matches('[data-selection-move]')) { selection.openMoveDialog(dialog); return; }

      if (btn.matches('[data-inline-add-focus]')) {
        const groupId = btn.dataset.inlineAddFocus;
        if (!groupId) return;
        const group = btn.closest<HTMLElement>('.board-group');
        if (group?.classList.contains('is-collapsed')) {
          state.boardPrefs = preferencePatches.withGroupCollapsed(state.boardPrefs, groupId, false);
          persistBoardPrefs();
          renderBoardData();
        }
        focusInlineAdd(groupId);
        return;
      }

      if (btn.matches('[data-toggle-group]')) {
        const groupId = btn.dataset.toggleGroup;
        if (!groupId) return;
        state.boardPrefs = preferencePatches.withGroupCollapsed(state.boardPrefs, groupId, !isGroupCollapsed(groupId));
        persistBoardPrefs();
        renderBoardData();
        return;
      }

      if (btn.matches('[data-toggle-archived-items]')) {
        state.showArchived = !state.showArchived;
        selection.clear();
        renderBoardData();
        return;
      }

      if (btn.matches('[data-board-view]')) {
        const view = btn.dataset.boardView;
        if (!boardId || !board || !isBoardViewMode(view) || board.view_mode === view) return;
        const region = root.querySelector<HTMLElement>('[data-board-view-host]');
        region?.classList.add('is-view-switching');
        replaceActiveBoardRecord(boardId, (record) => ({ ...record, view_mode: view }));
        renderBoardData();
        requestAnimationFrame(() => region?.classList.remove('is-view-switching'));
        void commandService.setView(boardId, view).catch((error) => toast(errorMessage(error, 'The Board view could not be changed.'), 'warning'));
        return;
      }

      if (btn.matches('[data-board-edit]')) { openEditBoard(); return; }
      if (btn.matches('[data-board-members]')) { memberWorkflows.open(); return; }
      if (btn.matches('[data-board-columns]')) { columnWorkflows.openManager(); return; }
      if (btn.matches('[data-add-column-menu]')) { columnWorkflows.openPicker(); return; }
      if (btn.matches('[data-add-column]')) { columnWorkflows.openPicker({ anchor: btn, quick: true }); return; }
      if (btn.matches('[data-edit-column]')) { columnWorkflows.openEditor(allColumns().find((column) => column.id === btn.dataset.editColumn)); return; }

      if (btn.matches('[data-edit-cell]')) {
        const itemId = btn.dataset.editCell;
        const columnId = btn.dataset.columnId;
        if (!itemId || !columnId) return;
        closeColumnMenus(root);
        closeItemMenus();
        inlineEdit.open(itemId, columnId, btn);
        return;
      }
      if (btn.matches('[data-edit-item-title]')) {
        const itemId = btn.dataset.editItemTitle;
        if (itemId) inlineEdit.openTitle(itemId, btn);
        return;
      }
      if (btn.matches('[data-rename-column-inline]')) {
        const columnId = btn.dataset.renameColumnInline;
        if (columnId) inlineEdit.openColumnTitle(columnId, btn);
        return;
      }
      if (btn.matches('[data-rename-group-inline]')) {
        const groupId = btn.dataset.renameGroupInline;
        if (groupId) inlineEdit.openGroupTitle(groupId, btn);
        return;
      }
      if (btn.matches('[data-reset-board-view]')) {
        state.boardPrefs = preferencePatches.resetView(state.boardPrefs);
        persistBoardPrefs();
        renderBoardData();
        toast('Board view settings reset.');
        return;
      }
      if (btn.matches('[data-column-filter]')) {
        columnWorkflows.openFilter(allColumns().find((column) => column.id === btn.dataset.columnFilter));
        return;
      }
      if (btn.matches('[data-column-sort],[data-column-quick-sort]')) {
        const columnId = btn.dataset.columnSort || btn.dataset.columnQuickSort;
        const direction = btn.dataset.direction;
        if (!columnId || !isSortDirection(direction)) return;
        state.boardPrefs = direction === 'none'
          ? preferencePatches.withSort(state.boardPrefs, null, null)
          : preferencePatches.withSort(state.boardPrefs, columnId, direction);
        persistBoardPrefs();
        renderBoardData();
        return;
      }
      if (btn.matches('[data-column-wrap]')) {
        const columnId = btn.dataset.columnWrap;
        if (!columnId) return;
        state.boardPrefs = preferencePatches.withColumnWrap(state.boardPrefs, columnId, !isWrapped(columnId));
        persistBoardPrefs();
        renderBoardData();
        return;
      }
      if (btn.matches('[data-column-hide]')) {
        const column = allColumns().find((candidate) => candidate.id === btn.dataset.columnHide);
        if (!column || !canEdit() || !boardId) return;
        try {
          await commandService.updateColumn({ columnId: column.id, name: column.name, config: { ...column.config }, visible: false });
          toast(`Column “${column.name}” hidden from Table view.`);
          await loadBoard(boardId, { quiet: true });
        } catch (error) {
          toast(errorMessage(error, 'The column could not be hidden.'), 'warning');
        }
        return;
      }
      if (btn.matches('[data-column-duplicate]')) { columnWorkflows.openDuplicate(allColumns().find((column) => column.id === btn.dataset.columnDuplicate)); return; }
      if (btn.matches('[data-column-add-right]')) {
        const column = allColumns().find((candidate) => candidate.id === btn.dataset.columnAddRight);
        if (column) columnWorkflows.openPicker({ position: column.position + 1, anchor: btn, quick: true });
        return;
      }
      if (btn.matches('[data-column-change-type]')) {
        const column = allColumns().find((candidate) => candidate.id === btn.dataset.columnChangeType);
        if (column && !column.system_key) columnWorkflows.openPicker({ mode: 'change', column });
        return;
      }
      if (btn.matches('[data-column-delete]')) {
        const column = allColumns().find((candidate) => candidate.id === btn.dataset.columnDelete);
        if (column) columnWorkflows.openDelete(column);
        return;
      }
      if (btn.matches('[data-board-activity]')) { activityWorkflows.open(); return; }

      if (btn.matches('[data-board-duplicate-current]')) {
        if (!boardId) return;
        try {
          const duplicateId = await commandService.duplicateBoard(boardId);
          state.status = 'active';
          await loadBoards('active');
          toast('Board duplicated.');
          navigate(`boards/${duplicateId}`);
        } catch (error) {
          toast(errorMessage(error, 'The board could not be duplicated.'), 'warning');
        }
        return;
      }

      if (btn.matches('[data-board-archive-current],[data-board-trash-current]')) {
        if (!boardId) return;
        const status: BoardLifecycleStatus = btn.matches('[data-board-trash-current]') ? 'trashed' : 'archived';
        const message = status === 'archived'
          ? 'Archive this board? You can restore it later from Archived.'
          : 'Move this board to trash? You can restore it until it is permanently deleted.';
        if (!await confirmBoardAction(message)) return;
        try {
          await commandService.setBoardLifecycle({ boardId, status });
          state.status = status;
          await loadBoards(status);
          toast(status === 'archived' ? 'Board archived.' : 'Board moved to trash.');
          navigate('boards');
        } catch (error) {
          toast(errorMessage(error, 'The board state could not be changed.'), 'warning');
        }
        return;
      }

      if (btn.matches('[data-kanban-add-status]')) {
        const status = btn.dataset.kanbanAddStatus;
        itemWorkflows.open(null, btn.dataset.kanbanAddGroup || null, { status: status === '' ? null : (status ?? null) });
        return;
      }
      if (btn.matches('[data-add-group]')) { groupWorkflows.open(); return; }
      if (btn.matches('[data-rename-group]')) {
        const group = envelope?.groups.find((candidate) => candidate.id === btn.dataset.renameGroup);
        const anchor = group ? root.querySelector<HTMLElement>(`[data-rename-group-inline="${CSS.escape(group.id)}"]`) : null;
        if (group && anchor) inlineEdit.openGroupTitle(group.id, anchor);
        else groupWorkflows.open(group);
        return;
      }
      if (btn.matches('[data-group-accent]')) {
        groupWorkflows.openAccent(envelope?.groups.find((group) => String(group.id) === String(btn.dataset.groupAccent)));
        return;
      }
      if (btn.matches('[data-delete-group]')) {
        const groupId = btn.dataset.deleteGroup;
        if (groupId) await groupWorkflows.remove(groupId);
        return;
      }
      if (btn.matches('[data-open-item]')) {
        const itemId = btn.dataset.openItem;
        if (itemId) itemWorkspace.open(itemId);
        return;
      }
      if (await itemWorkspace.handleButton(btn)) return;
      if (btn.matches('[data-add-item]')) {
        const groupId = btn.dataset.addItem;
        if (groupId) focusInlineAdd(groupId);
        return;
      }
      if (btn.matches('[data-edit-item]')) {
        itemWorkflows.open(envelope?.items.find((item) => item.id === btn.dataset.editItem));
        return;
      }
      if (btn.matches('[data-duplicate-item]')) {
        const source = envelope?.items.find((item) => String(item.id) === String(btn.dataset.duplicateItem));
        if (!source) return;
        try {
          let duplicateId = await commandService.duplicateItem(source.id);
          toast(`“${source.title}” duplicated.`);
          await reloadCurrentBoard();
          history.push({
            label: 'item duplication',
            undo: async () => { await commandService.deleteItem(duplicateId); await reloadCurrentBoard(); },
            redo: async () => { duplicateId = await commandService.duplicateItem(source.id); await reloadCurrentBoard(); },
          });
        } catch (error) {
          toast(errorMessage(error, 'The item could not be duplicated.'), 'warning');
        }
        return;
      }
      if (btn.matches('[data-delete-item]')) {
        const item = envelope?.items.find((candidate) => String(candidate.id) === String(btn.dataset.deleteItem));
        if (!item) return;
        if (!await confirmBoardAction(`Delete “${item.title}” permanently? Its values, updates, and attachments will be removed. This cannot be undone.`)) return;
        try {
          await commandService.deleteItem(item.id);
          selection.clear();
          toast('Item deleted permanently.');
          await reloadCurrentBoard();
        } catch (error) {
          toast(errorMessage(error, 'The item could not be deleted.'), 'warning');
        }
        return;
      }
      if (btn.matches('[data-archive-item]')) {
        const item = envelope?.items.find((candidate) => String(candidate.id) === String(btn.dataset.archiveItem));
        if (!item) return;
        const archive = btn.dataset.archive !== 'false';
        const previous = Boolean(item.archived_at);
        if (await itemWorkflows.archive(item.id, archive)) {
          history.push({
            label: archive ? 'item archive' : 'item restore',
            undo: async () => { await commandService.archiveItem(item.id, previous); await reloadCurrentBoard(); },
            redo: async () => { await commandService.archiveItem(item.id, archive); await reloadCurrentBoard(); },
          });
        }
        return;
      }
    }, { signal });

    dragDrop?.bind(root);
    structureDrag.bind(root);
    columnResize.bind(root);
  }

  function openEditBoard(): void {
    const envelope = state.board;
    const board = envelope?.board;
    if (!board) return;
    dialog({
      title: `Edit “${board.name}”`,
      body: `<label class="field-label">Board name<input name="name" required maxlength="120" value="${esc(board.name)}"></label><label class="field-label">Description<textarea name="description" maxlength="1200" rows="4" placeholder="Describe this board’s purpose or scope">${esc(board.description || '')}</textarea></label>`,
      submitLabel: 'Save board details',
      onSubmit: async (formData) => {
        const name = String(formData.get('name') ?? '').trim();
        const description = String(formData.get('description') ?? '');
        await commandService.updateBoard({ boardId: board.id, name, description });
        toast(`“${name}” updated.`);
        await loadBoard(board.id, { quiet: true });
      },
    });
  }

  function activate() {
    // Invalidate any stale async load left behind by a prior route ownership cycle.
    dataController.cancelPending();
  }

  function deactivate() {
    // Invalidate in-flight loads and flush any deferred preference write before leaving the feature.
    dataController.cancelPending();
    realtimeController?.disconnect();
    realtimeSnapshot = Object.freeze({ state:'idle', boardId:null, collaborators:[], lastEventAt:null, lastError:null, fallbackPolling:false });
    boardResizeCleanup?.();
    void preferencePersistence.flushPending();
    cancelAnimationFrame(itemSearchFrame);
    itemSearchFrame = 0;
    dragDrop?.dispose();
    tableVirtualization.reset();
    cancelAnimationFrame(virtualizationFrame);
    virtualizationFrame = 0;
    cancelAnimationFrame(virtualizationMeasureFrame);
    virtualizationMeasureFrame = 0;
    cancelAnimationFrame(boardDetailCommitFrame);
    boardDetailCommitFrame = 0;
    boardDetailCommitRetryBoardId = null;
    boardDetailCommitRetryCount = 0;
    pendingGridFocus = null;
    virtualizationRenderDeferredForMenu = false;
    fullBoardRenderDeferredForMenu = false;
    structureDrag.dispose();
    columnResize.dispose();
    virtualizationRenderDeferredForEditor = false;
    inlineEdit.reset();
    selection.clear();
    history.reset();
    closeColumnMenus();
    closeItemMenus();
    releaseListEventBinding();
    releaseBoardEventBinding();
    boardMenuController?.dispose(); boardMenuController=null;
    overlayCoordinator.closeAll({restoreFocus:false});
    listMenuController?.dispose(); listMenuController=null;
    itemWorkspace.reset();
    itemPanelRenderer.reset();
    columnWorkflows.reset();
    groupWorkflows.reset();
    itemWorkflows.reset();
    memberWorkflows.reset();
    activityWorkflows.reset();
    dialogs.closeAll();
  }

  return Object.freeze({ renderBoards, renderBoard, activate, deactivate });
}
