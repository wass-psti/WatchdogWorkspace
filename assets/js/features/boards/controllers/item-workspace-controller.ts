import type { BoardDomainService } from '../../../../../src/features/boards/contracts/service.ts';
import type { BoardCommandService } from '../../../../../src/features/boards/contracts/commands.ts';
import type { MutableBoardViewState } from '../../../../../src/features/boards/contracts/view-state.ts';
import type { ConfirmAction } from '../../../../../src/features/boards/contracts/presentation.ts';
import type { ToastRenderer } from '../../../../../src/platform/contracts/ui.ts';
import type { BoardItemId, ISODate, StatusLabelId, UserId } from '../../../../../src/types/identifiers.ts';
import { createItemWorkspaceRuntime } from '../services/item-workspace-runtime.ts';
import { normalizeBoardCellValue } from '../grid/column-type-registry.ts';

interface ItemWorkspaceControllerDependencies {
  readonly api: BoardDomainService;
  readonly commands: BoardCommandService;
  readonly state: MutableBoardViewState;
  readonly toast: ToastRenderer;
  readonly renderBoard: () => void;
  readonly renderPanel: () => void;
  readonly reloadBoard?: (() => Promise<unknown>) | null;
  readonly confirmAction?: ConfirmAction;
}

const UPDATE_TEMPLATES = Object.freeze({
  progress: 'Progress update: ',
  decision: 'Decision: ',
  blocker: 'Blocker: ',
  handoff: 'Handoff: ',
} as const);
type UpdateTemplate = keyof typeof UPDATE_TEMPLATES;

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : 'The item action could not be completed.';
const eventElement = (target: EventTarget | null): Element | null => target instanceof Element ? target : null;

/** DOM presentation adapter over the typed Item Workspace runtime. */
export function createItemWorkspaceController({
  api,
  commands,
  state,
  toast,
  renderBoard,
  renderPanel,
  reloadBoard = null,
  confirmAction = (message) => globalThis.confirm?.(message) ?? true,
}: ItemWorkspaceControllerDependencies) {
  let returnFocus: HTMLElement | null = null;
  let suppressRuntimeRender = false;

  const runtime = createItemWorkspaceRuntime({
    state,
    service: api,
    onChange: () => { if (!suppressRuntimeRender) renderPanel(); },
  });

  const panel = (): HTMLElement | null => document.querySelector<HTMLElement>('[data-item-panel]');
  const focusables = (): HTMLElement[] => [...(panel()?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])') || [])];

  function focusPanel({ preferTab = false }: Readonly<{ preferTab?: boolean }> = {}): void {
    requestAnimationFrame(() => {
      const root = panel();
      if (!root) return;
      const target = preferTab
        ? root.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
        : root.querySelector<HTMLElement>('[data-close-item-panel]');
      if (!root.contains(document.activeElement)) target?.focus();
    });
  }

  async function load(itemId: BoardItemId | string | null = state.itemPanel.itemId, { quiet = false }: Readonly<{ quiet?: boolean }> = {}): Promise<boolean> {
    const loaded = await runtime.load(itemId, { quiet });
    if (loaded && !quiet) focusPanel();
    return loaded;
  }

  function open(itemId: BoardItemId | string): void {
    if (!itemId) return;
    if (!state.itemPanel.itemId) returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    suppressRuntimeRender = true;
    try { runtime.open(itemId); }
    finally { suppressRuntimeRender = false; }
    renderBoard();
    focusPanel();
    void load(itemId);
  }

  function close({ render = true }: Readonly<{ render?: boolean }> = {}): void {
    suppressRuntimeRender = true;
    try { runtime.close(); }
    finally { suppressRuntimeRender = false; }
    document.body.classList.remove('board-item-panel-open');
    if (render) renderBoard();
    const target = returnFocus;
    returnFocus = null;
    requestAnimationFrame(() => { if (target?.isConnected) target.focus(); });
  }

  function setTab(tab: unknown): boolean {
    if (!runtime.setTab(tab)) return false;
    focusPanel({ preferTab: true });
    return true;
  }

  function handleKeydown(event: KeyboardEvent): boolean {
    if (!state.itemPanel.itemId) return false;
    const target = eventElement(event.target);
    if (target?.matches('[role="tab"][data-item-panel-tab]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      const tabs = [...(panel()?.querySelectorAll<HTMLElement>('[role="tab"][data-item-panel-tab]') || [])];
      if (!tabs.length) return false;
      const current = Math.max(0, tabs.indexOf(target as HTMLElement));
      let index = current;
      if (event.key === 'ArrowRight') index = (current + 1) % tabs.length;
      if (event.key === 'ArrowLeft') index = (current - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') index = 0;
      if (event.key === 'End') index = tabs.length - 1;
      event.preventDefault();
      const next = tabs[index];
      if (!next) return false;
      setTab(next.dataset.itemPanelTab);
      requestAnimationFrame(() => panel()?.querySelector<HTMLElement>(`[data-item-panel-tab="${CSS.escape(next.dataset.itemPanelTab || '')}"]`)?.focus());
      return true;
    }
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && target?.matches('[data-item-update-input]')) {
      event.preventDefault();
      if (target instanceof HTMLTextAreaElement) target.form?.requestSubmit();
      return true;
    }
    if (event.key === 'Escape') {
      const propertyForm = target?.closest<HTMLFormElement>('[data-item-property-form]');
      if (propertyForm) {
        event.preventDefault();
        propertyForm.reset();
        propertyForm.querySelector<HTMLElement>('input,select,textarea')?.focus();
        return true;
      }
      event.preventDefault();
      close();
      return true;
    }
    if (event.key !== 'Tab') return false;
    const items = focusables();
    if (!items.length) return false;
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
      return true;
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
      return true;
    }
    return false;
  }

  async function submitUpdate(event: SubmitEvent): Promise<boolean> {
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form?.matches('[data-item-update-form]')) return false;
    event.preventDefault();
    const textarea = form.elements.namedItem('body');
    if (!(textarea instanceof HTMLTextAreaElement)) return true;
    const body = textarea.value.trim();
    if (!body || !state.itemPanel.itemId) return true;
    const submit = event.submitter instanceof HTMLButtonElement ? event.submitter : null;
    try {
      if (submit) {
        submit.disabled = true;
        submit.setAttribute('aria-busy', 'true');
        submit.dataset.label = submit.textContent || '';
        const label = submit.querySelector<HTMLElement>('span');
        if (label) label.textContent = 'Posting…';
      }
      const applied = await runtime.postUpdate(body);
      if (applied) {
        textarea.value = '';
        runtime.setUpdateDraft('');
        toast('Update posted to this item.');
      }
    } catch (error) {
      toast(errorMessage(error), 'warning');
    } finally {
      if (submit?.isConnected) {
        submit.removeAttribute('aria-busy');
        const bodyField = form.elements.namedItem('body');
        const value = bodyField instanceof HTMLTextAreaElement ? bodyField.value.trim() : '';
        submit.disabled = !value;
        const label = submit.querySelector<HTMLElement>('span');
        if (label) label.textContent = 'Post update';
      }
    }
    return true;
  }

  async function submitProperty(event: SubmitEvent): Promise<boolean> {
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form?.matches('[data-item-property-form]')) return false;
    event.preventDefault();
    const itemId = state.itemPanel.itemId;
    const item = state.board?.items.find((entry) => String(entry.id) === String(itemId));
    if (!itemId || !item) return true;
    const submit = event.submitter instanceof HTMLButtonElement ? event.submitter : form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const controls = [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement>('input,textarea,select,button')];
    controls.forEach((control) => { control.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    try {
      const data = new FormData(form);
      if (form.dataset.itemPropertyKind === 'core') {
        const field = form.dataset.itemPropertyField;
        const raw = String(data.get('value') ?? '');
        const next = {
          itemId: item.id,
          title: item.title,
          status: item.status,
          assigneeId: item.assignee_id ?? null,
          dueDate: item.due_date ?? null,
          notes: item.notes ?? '',
        };
        if (field === 'title') next.title = raw.trim();
        else if (field === 'status') next.status = (raw || null) as StatusLabelId | null;
        else if (field === 'assignee') next.assigneeId = (raw || null) as UserId | null;
        else if (field === 'due_date') next.dueDate = (raw || null) as ISODate | null;
        else if (field === 'notes') next.notes = raw;
        else throw new Error('Unsupported Item Workspace field.');
        await commands.updateItem(next);
      } else if (form.dataset.itemPropertyKind === 'cell') {
        const columnId = form.dataset.columnId;
        const column = state.board?.columns.find((entry) => String(entry.id) === String(columnId));
        if (!column) throw new Error('This Board property is no longer available.');
        const raw = column.data_type === 'timeline'
          ? { start: String(data.get('start') ?? ''), end: String(data.get('end') ?? '') }
          : data.get('value');
        const value = normalizeBoardCellValue(column.data_type, raw);
        await commands.setCell({ itemId: item.id, columnId: column.id, value });
      } else {
        throw new Error('Unsupported Item Workspace property operation.');
      }
      await reloadBoard?.();
      if (state.itemPanel.itemId === itemId) await runtime.load(itemId, { quiet: true });
      toast('Item property saved.');
    } catch (error) {
      toast(errorMessage(error), 'warning');
    } finally {
      if (form.isConnected) {
        form.removeAttribute('aria-busy');
        controls.forEach((control) => { control.disabled = false; });
        submit?.focus({ preventScroll: true });
      }
    }
    return true;
  }

  function syncUpdateComposer(textarea: HTMLTextAreaElement): void {
    const value = textarea.value;
    runtime.setUpdateDraft(value);
    const form = textarea.form;
    const counter = form?.querySelector<HTMLElement>('[data-item-update-count]');
    const submit = form?.querySelector<HTMLButtonElement>('[data-item-update-submit]');
    const clear = form?.querySelector<HTMLButtonElement>('[data-clear-update-draft]');
    const normalized = value.trimStart().toLowerCase();
    const activeType: UpdateTemplate | '' = normalized.startsWith('decision:') ? 'decision'
      : normalized.startsWith('blocker:') ? 'blocker'
      : normalized.startsWith('handoff:') ? 'handoff'
      : (normalized.startsWith('progress update:') || normalized.startsWith('progress:')) ? 'progress'
      : '';
    if (counter) {
      counter.textContent = `${value.length} / 5000`;
      counter.classList.toggle('is-near-limit', value.length >= 4500);
    }
    if (submit && !submit.hasAttribute('aria-busy')) submit.disabled = !value.trim();
    if (clear) clear.hidden = !value.length;
    panel()?.querySelectorAll<HTMLButtonElement>('[data-update-template]').forEach((button) => {
      const pressed = button.dataset.updateTemplate === activeType;
      button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      button.classList.toggle('is-active', pressed);
    });
  }

  function handleInput(event: Event): boolean {
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement) || !target.matches('[data-item-update-input]')) return false;
    syncUpdateComposer(target);
    return true;
  }

  async function uploadFileList(files: readonly File[]): Promise<void> {
    if (!files.length) return;
    try {
      const uploaded = await runtime.uploadFiles(files);
      if (uploaded !== null) toast(`${uploaded} attachment${uploaded === 1 ? '' : 's'} added.`);
    } catch (error) {
      toast(errorMessage(error), 'warning');
    }
  }

  function handleFileDrag(event: DragEvent): boolean {
    const target = eventElement(event.target);
    const drop = target?.closest<HTMLElement>('[data-item-file-drop]');
    if (!drop) return false;
    if (event.type === 'dragenter' || event.type === 'dragover') {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      drop.classList.add('is-dragging');
      return true;
    }
    if (event.type === 'dragleave') {
      const related = eventElement(event.relatedTarget);
      if (!related || !drop.contains(related)) drop.classList.remove('is-dragging');
      return true;
    }
    if (event.type === 'drop') {
      event.preventDefault();
      drop.classList.remove('is-dragging');
      const files = [...(event.dataTransfer?.files || [])];
      void uploadFileList(files);
      return true;
    }
    return false;
  }

  async function uploadFiles(event: Event): Promise<boolean> {
    const input = event.target instanceof HTMLInputElement ? event.target : null;
    if (!input?.matches('[data-item-file-input]')) return false;
    const files = [...(input.files || [])];
    if (!files.length) return true;
    try {
      await uploadFileList(files);
    } finally {
      if (input.isConnected) input.value = '';
    }
    return true;
  }

  async function handleButton(button: HTMLElement): Promise<boolean> {
    if (button.matches('[data-close-item-panel]')) { close(); return true; }
    if (button.matches('[data-item-panel-retry]')) { void load(state.itemPanel.itemId); return true; }
    if (button.matches('[data-item-panel-tab]')) { setTab(button.dataset.itemPanelTab); return true; }

    if (button.matches('[data-focus-update-composer]')) {
      panel()?.querySelector<HTMLTextAreaElement>('[data-item-update-input]')?.focus();
      return true;
    }

    if (button.matches('[data-clear-update-draft]')) {
      const textarea = panel()?.querySelector<HTMLTextAreaElement>('[data-item-update-input]');
      if (!textarea) return true;
      textarea.value = '';
      syncUpdateComposer(textarea);
      textarea.focus();
      return true;
    }

    if (button.matches('[data-update-template]')) {
      const textarea = panel()?.querySelector<HTMLTextAreaElement>('[data-item-update-input]');
      if (!textarea) return true;
      const templateKey = button.dataset.updateTemplate;
      const prefix = templateKey && templateKey in UPDATE_TEMPLATES ? UPDATE_TEMPLATES[templateKey as UpdateTemplate] : '';
      if (!textarea.value.trim()) textarea.value = prefix;
      else if (prefix) textarea.value = `${textarea.value.trimEnd()}\n\n${prefix}`;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      syncUpdateComposer(textarea);
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      return true;
    }

    if (button.matches('[data-delete-item-update]')) {
      if (!await confirmAction('Delete this update permanently? This cannot be undone.')) return true;
      const updateId = button.dataset.deleteItemUpdate;
      if (!updateId) return true;
      try {
        if (await runtime.deleteUpdate(updateId)) toast('Update deleted.');
      } catch (error) { toast(errorMessage(error), 'warning'); }
      return true;
    }

    if (button.matches('[data-open-item-file]')) {
      const fileId = button.dataset.openItemFile;
      if (!fileId) return true;
      try { await runtime.openFile(fileId); }
      catch (error) { toast(errorMessage(error), 'warning'); }
      return true;
    }

    if (button.matches('[data-delete-item-file]')) {
      const fileId = button.dataset.deleteItemFile;
      const file = state.itemPanel.data.files.find((entry) => entry.id === fileId);
      const fileName = String(file?.file_name || 'this attachment');
      if (!file || !await confirmAction(`Remove “${fileName}” from this item? This cannot be undone.`)) return true;
      try {
        if (await runtime.deleteFile(file.id)) toast('Attachment removed.');
      } catch (error) { toast(errorMessage(error), 'warning'); }
      return true;
    }

    return false;
  }

  function handleScrim(target: EventTarget | null): boolean {
    const element = target instanceof Element ? target : null;
    if (!element?.matches('.item-panel-scrim[data-close-item-panel]')) return false;
    close();
    return true;
  }

  function reset(): void {
    suppressRuntimeRender = true;
    try { runtime.reset(); }
    finally { suppressRuntimeRender = false; }
    document.body.classList.remove('board-item-panel-open');
    returnFocus = null;
  }

  return Object.freeze({ open, close, load, setTab, handleKeydown, handleInput, submitUpdate, submitProperty, uploadFiles, handleFileDrag, handleButton, handleScrim, reset });
}
