import type { CommandSnapshot } from '../../platform/contracts/commands.ts';
import type { ToastTone } from '../../platform/contracts/ui.ts';

export type SharedApplicationUiCommandPhase = 'closed' | 'open' | 'closing';
export type SharedApplicationToastTone = 'success' | 'warning' | 'error' | 'info';

export interface SharedApplicationUiCommandState {
  readonly phase: SharedApplicationUiCommandPhase;
  readonly query: string;
  readonly selection: number;
  readonly items: readonly CommandSnapshot[];
}

export interface SharedApplicationToast {
  readonly id: string;
  readonly message: string;
  readonly tone: SharedApplicationToastTone;
}

export interface SharedApplicationUiUpdateState {
  readonly available: boolean;
  readonly applying: boolean;
}

export interface SharedApplicationUiSnapshot {
  readonly command: SharedApplicationUiCommandState;
  readonly toasts: readonly SharedApplicationToast[];
  readonly update: SharedApplicationUiUpdateState;
}

export interface SharedApplicationUiCommandAdapter {
  list(query: string): readonly CommandSnapshot[];
  execute(id: string): unknown | Promise<unknown>;
  motionEnabled(): boolean;
}

export interface SharedApplicationUiUpdateAdapter {
  apply(): unknown | Promise<unknown>;
  dismiss(): unknown;
}

export interface SharedApplicationUiCloseOptions {
  readonly immediate?: boolean;
  readonly restoreFocus?: boolean;
}

const EMPTY_COMMAND: SharedApplicationUiCommandState = Object.freeze({ phase: 'closed', query: '', selection: 0, items: Object.freeze([]) });
const EMPTY_UPDATE: SharedApplicationUiUpdateState = Object.freeze({ available: false, applying: false });
const DEFAULT_SNAPSHOT: SharedApplicationUiSnapshot = Object.freeze({ command: EMPTY_COMMAND, toasts: Object.freeze([]), update: EMPTY_UPDATE });

let snapshot = DEFAULT_SNAPSHOT;
let commandAdapter: SharedApplicationUiCommandAdapter | null = null;
let updateAdapter: SharedApplicationUiUpdateAdapter | null = null;
let returnFocus: HTMLElement | null = null;
let toastSequence = 0;
let closeTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
const toastTimers = new Map<string, ReturnType<typeof globalThis.setTimeout>>();
const listeners = new Set<() => void>();

const freezeCommand = (value: SharedApplicationUiCommandState): SharedApplicationUiCommandState => Object.freeze({ ...value, items: Object.freeze([...value.items]) });
const freezeToasts = (value: readonly SharedApplicationToast[]): readonly SharedApplicationToast[] => Object.freeze(value.map((toast) => Object.freeze({ ...toast })));
const freezeUpdate = (value: SharedApplicationUiUpdateState): SharedApplicationUiUpdateState => Object.freeze({ ...value });
const freezeSnapshot = (value: SharedApplicationUiSnapshot): SharedApplicationUiSnapshot => Object.freeze({
  command: freezeCommand(value.command),
  toasts: freezeToasts(value.toasts),
  update: freezeUpdate(value.update),
});

function publish(patch: Partial<SharedApplicationUiSnapshot>): SharedApplicationUiSnapshot {
  snapshot = freezeSnapshot({ ...snapshot, ...patch });
  for (const listener of listeners) listener();
  return snapshot;
}

function normalizeTone(tone: ToastTone): SharedApplicationToastTone {
  if (tone === 'warning' || tone === 'error' || tone === 'info') return tone;
  return 'success';
}

function visibleCommands(query: string): readonly CommandSnapshot[] {
  try { return Object.freeze([...(commandAdapter?.list(query) ?? [])]); }
  catch { return Object.freeze([]); }
}

function finalizeClose(restoreFocus: boolean): void {
  if (closeTimer) {
    globalThis.clearTimeout(closeTimer);
    closeTimer = null;
  }
  publish({ command: EMPTY_COMMAND });
  const target = returnFocus;
  returnFocus = null;
  if (restoreFocus && target?.isConnected) target.focus();
}

export const sharedApplicationUiRuntime = Object.freeze({
  getSnapshot(): SharedApplicationUiSnapshot { return snapshot; },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  configureCommandPalette(adapter: SharedApplicationUiCommandAdapter): void { commandAdapter = adapter; },
  configureUpdate(adapter: SharedApplicationUiUpdateAdapter): void { updateAdapter = adapter; },
  openCommandPalette(trigger: HTMLElement | null = null): SharedApplicationUiSnapshot {
    if (snapshot.command.phase !== 'closed') return snapshot;
    if (closeTimer) { globalThis.clearTimeout(closeTimer); closeTimer = null; }
    returnFocus = trigger;
    return publish({ command: freezeCommand({ phase: 'open', query: '', selection: 0, items: visibleCommands('') }) });
  },
  closeCommandPalette({ immediate = false, restoreFocus = true }: SharedApplicationUiCloseOptions = {}): SharedApplicationUiSnapshot {
    if (snapshot.command.phase === 'closed') return snapshot;
    const shouldAnimate = !immediate && (commandAdapter?.motionEnabled() ?? false);
    if (!shouldAnimate) {
      finalizeClose(restoreFocus);
      return snapshot;
    }
    publish({ command: freezeCommand({ ...snapshot.command, phase: 'closing' }) });
    if (closeTimer) globalThis.clearTimeout(closeTimer);
    closeTimer = globalThis.setTimeout(() => finalizeClose(restoreFocus), 170);
    return snapshot;
  },
  toggleCommandPalette(trigger: HTMLElement | null = null): SharedApplicationUiSnapshot {
    return snapshot.command.phase === 'closed' ? this.openCommandPalette(trigger) : this.closeCommandPalette();
  },
  updateCommandQuery(query: string): SharedApplicationUiSnapshot {
    const normalized = String(query ?? '');
    const items = visibleCommands(normalized);
    const selection = Math.min(snapshot.command.selection, Math.max(0, items.length - 1));
    return publish({ command: freezeCommand({ ...snapshot.command, query: normalized, selection, items }) });
  },
  selectCommand(index: number): SharedApplicationUiSnapshot {
    const max = snapshot.command.items.length - 1;
    const selection = max < 0 ? 0 : Math.min(max, Math.max(0, Math.trunc(index)));
    return publish({ command: freezeCommand({ ...snapshot.command, selection }) });
  },
  moveCommandSelection(delta: number): SharedApplicationUiSnapshot {
    const count = snapshot.command.items.length;
    if (!count) return snapshot;
    const selection = (snapshot.command.selection + Math.trunc(delta) + count) % count;
    return publish({ command: freezeCommand({ ...snapshot.command, selection }) });
  },
  async executeCommand(id: string): Promise<boolean> {
    const commandId = String(id ?? '').trim();
    if (!commandId || !commandAdapter) return false;
    const command = snapshot.command.items.find((item) => item.id === commandId);
    if (!command) return false;
    this.closeCommandPalette({ restoreFocus: true });
    await commandAdapter.execute(commandId);
    return true;
  },
  executeSelectedCommand(): Promise<boolean> {
    const item = snapshot.command.items[snapshot.command.selection];
    return item ? this.executeCommand(item.id) : Promise.resolve(false);
  },
  pushToast(message: string, tone: ToastTone = 'success', durationMs = 3600): string {
    const text = String(message ?? '').trim();
    if (!text) return '';
    const id = `wm-toast-${++toastSequence}`;
    const toast: SharedApplicationToast = Object.freeze({ id, message: text, tone: normalizeTone(tone) });
    publish({ toasts: freezeToasts([...snapshot.toasts, toast].slice(-5)) });
    const timer = globalThis.setTimeout(() => this.dismissToast(id), Math.max(400, durationMs));
    toastTimers.set(id, timer);
    return id;
  },
  dismissToast(id: string): SharedApplicationUiSnapshot {
    const key = String(id ?? '');
    const timer = toastTimers.get(key);
    if (timer) globalThis.clearTimeout(timer);
    toastTimers.delete(key);
    return publish({ toasts: freezeToasts(snapshot.toasts.filter((toast) => toast.id !== key)) });
  },
  showUpdate(): SharedApplicationUiSnapshot {
    return publish({ update: freezeUpdate({ available: true, applying: false }) });
  },
  hideUpdate(): SharedApplicationUiSnapshot {
    return publish({ update: EMPTY_UPDATE });
  },
  dismissUpdate(): SharedApplicationUiSnapshot {
    try { updateAdapter?.dismiss(); } finally { return this.hideUpdate(); }
  },
  async applyUpdate(): Promise<void> {
    if (!snapshot.update.available || snapshot.update.applying) return;
    publish({ update: freezeUpdate({ available: true, applying: true }) });
    try { await updateAdapter?.apply(); }
    catch (error) {
      publish({ update: freezeUpdate({ available: true, applying: false }) });
      this.pushToast(error instanceof Error ? error.message : 'The application update could not be applied.', 'warning');
    }
  },
  resetForTest(): SharedApplicationUiSnapshot {
    if (closeTimer) globalThis.clearTimeout(closeTimer);
    closeTimer = null;
    for (const timer of toastTimers.values()) globalThis.clearTimeout(timer);
    toastTimers.clear();
    snapshot = DEFAULT_SNAPSHOT;
    commandAdapter = null;
    updateAdapter = null;
    returnFocus = null;
    toastSequence = 0;
    for (const listener of listeners) listener();
    return snapshot;
  },
});
