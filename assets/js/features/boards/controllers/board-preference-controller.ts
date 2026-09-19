import type { BoardPreferences } from '../../../../../src/features/boards/contracts/domain.ts';
import type {
  BoardPreferencePersistenceController,
  BoardPreferencePersistenceDependencies,
} from '../../../../../src/features/boards/contracts/preferences.ts';
import type { BoardColumnId, BoardId } from '../../../../../src/types/identifiers.ts';
import { normalizeAppError } from '../../../platform/errors/app-error.ts';

interface PreferenceWriteSnapshot {
  readonly boardId: BoardId;
  readonly preferences: BoardPreferences;
  readonly version: number;
}

const clonePreferences = (preferences: BoardPreferences): BoardPreferences => Object.freeze({
  sort_column_id: preferences.sort_column_id ?? null,
  sort_direction: preferences.sort_direction ?? null,
  column_filters: Object.freeze({ ...(preferences.column_filters ?? {}) }),
  wrap_columns: Object.freeze([...(preferences.wrap_columns ?? [])]),
  column_widths: Object.freeze({ ...(preferences.column_widths ?? {}) }),
  item_name_width: preferences.item_name_width ?? 280,
  collapsed_groups: Object.freeze([...(preferences.collapsed_groups ?? [])]),
});

/** Owns debounced and immediate persistence of per-member Board view preferences. */
export function createBoardPreferencePersistenceController({
  state,
  commands,
  patches,
  onWarning = null,
  delayMs = 180,
}: BoardPreferencePersistenceDependencies): BoardPreferencePersistenceController {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;
  let version = 0;
  let pending: PreferenceWriteSnapshot | null = null;
  let writeChain: Promise<boolean> = Promise.resolve(true);

  const warn = (message: string): void => { onWarning?.(message); };

  const capture = (): PreferenceWriteSnapshot | null => {
    const boardId = state.board?.board?.id;
    if (!boardId) return null;
    return Object.freeze({ boardId, preferences: clonePreferences(state.boardPrefs), version: ++version });
  };

  const persistSnapshot = async (snapshot: PreferenceWriteSnapshot, operation: string, warningPrefix: string): Promise<boolean> => {
    if (disposed) return false;
    try {
      const saved = await commands.savePreferences(snapshot.boardId, snapshot.preferences);
      if (!disposed
        && snapshot.version === version
        && !pending
        && String(state.board?.board?.id ?? '') === String(snapshot.boardId)) {
        state.boardPrefs = saved;
      }
      return true;
    } catch (error) {
      if (!disposed && snapshot.version === version) {
        const normalized = normalizeAppError(error, {
          operation,
          fallbackMessage: 'Your board view settings could not be saved.',
        });
        warn(`${warningPrefix}: ${normalized.message}`);
      }
      return false;
    }
  };

  const enqueue = (snapshot: PreferenceWriteSnapshot, operation = 'boards.preferences.save', warningPrefix = 'Your board view settings could not be saved'): Promise<boolean> => {
    const execute = (): Promise<boolean> => persistSnapshot(snapshot, operation, warningPrefix);
    const result = writeChain.then(execute, execute);
    writeChain = result.then(() => true, () => true);
    return result;
  };

  const flushPending = (): Promise<boolean> => {
    if (disposed) return Promise.resolve(false);
    if (timer) clearTimeout(timer);
    timer = null;
    const snapshot = pending;
    pending = null;
    return snapshot ? enqueue(snapshot) : Promise.resolve(false);
  };

  const cancel = (): void => {
    version += 1;
    if (timer) clearTimeout(timer);
    timer = null;
    pending = null;
  };

  const saveNow = (): Promise<boolean> => {
    if (disposed) return Promise.resolve(false);
    if (pending) return flushPending();
    const snapshot = capture();
    return snapshot ? enqueue(snapshot) : Promise.resolve(false);
  };

  const schedule = (): void => {
    if (disposed) return;
    const snapshot = capture();
    if (!snapshot) return;
    pending = snapshot;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { void flushPending(); }, Math.max(0, Math.trunc(delayMs)));
  };

  const removeColumnReferences = (columnId: BoardColumnId | string): Promise<boolean> => {
    if (disposed || !state.board?.board?.id) return Promise.resolve(false);
    state.boardPrefs = patches.withoutColumnReferences(state.boardPrefs, columnId);
    if (timer) clearTimeout(timer);
    timer = null;
    pending = null;
    const snapshot = capture();
    return snapshot
      ? enqueue(snapshot, 'boards.preferences.remove-column-references', 'The column was deleted, but related view settings could not be cleared')
      : Promise.resolve(false);
  };

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    cancel();
  };

  return Object.freeze({ schedule, saveNow, flushPending, removeColumnReferences, cancel, dispose });
}
