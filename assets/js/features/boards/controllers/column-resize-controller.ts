import type { ColumnResizeDependencies } from '../../../../../src/features/boards/contracts/presentation.ts';

const ITEM_COLUMN_KEY = '__item';
const KEYBOARD_STEP = 8;
const KEYBOARD_STEP_LARGE = 24;
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

/** Pointer-driven column resizing persisted in per-member board preferences. */
export function createColumnResizeController({ state, preferencePatches, persistPreferences, history, renderBoardData }: ColumnResizeDependencies) {
  let cleanup: (() => void) | null = null;

  const widthFor = (key: string): number => key === ITEM_COLUMN_KEY
    ? Number(state.boardPrefs?.item_name_width || 280)
    : Number(state.boardPrefs?.column_widths?.[key] || 160);

  const widthBounds = (key: string): Readonly<{ min: number; max: number }> => ({ min: key === ITEM_COLUMN_KEY ? 180 : 96, max: 720 });

  function syncHandleAccessibility(root: HTMLElement, key?: string): void {
    root.querySelectorAll<HTMLElement>('[data-column-resize]').forEach((handle) => {
      const handleKey = handle.dataset.columnResize;
      if (!handleKey || (key && handleKey !== key)) return;
      const { min, max } = widthBounds(handleKey);
      const width = clamp(Math.round(widthFor(handleKey)), min, max);
      handle.setAttribute('aria-valuemin', String(min));
      handle.setAttribute('aria-valuemax', String(max));
      handle.setAttribute('aria-valuenow', String(width));
      handle.setAttribute('aria-valuetext', `${width} pixels`);
    });
  }

  function applyWidth(root: HTMLElement, key: string, width: number): void {
    root.querySelectorAll<HTMLElement>(`[data-column-width-key="${CSS.escape(key)}"]`).forEach((node) => {
      node.style.width = `${width}px`;
      node.style.minWidth = `${width}px`;
      node.style.maxWidth = `${width}px`;
    });
    root.querySelectorAll<HTMLElement>(`[data-column-resize="${CSS.escape(key)}"]`).forEach((handle) => {
      handle.setAttribute('aria-valuenow', String(width));
      handle.setAttribute('aria-valuetext', `${width} pixels`);
    });
  }

  function saveWidth(key: string, width: number): void {
    state.boardPrefs = key === ITEM_COLUMN_KEY
      ? preferencePatches.withItemNameWidth(state.boardPrefs, width)
      : preferencePatches.withColumnWidth(state.boardPrefs, key, width);
    void persistPreferences();
  }

  function begin(event: PointerEvent, root: HTMLElement): boolean {
    const target = event.target instanceof Element ? event.target : null;
    const handle = target?.closest<HTMLElement>('[data-column-resize]') ?? null;
    if (!handle || event.button !== 0) return false;
    const key = handle.dataset.columnResize;
    if (!key) return false;
    const startWidth = widthFor(key);
    const { min, max } = widthBounds(key);
    const startX = event.clientX;
    handle.setPointerCapture?.(event.pointerId);
    root.classList.add('is-resizing-column');
    let latest = startWidth;
    const move = (moveEvent: PointerEvent): void => {
      latest = clamp(Math.round(startWidth + moveEvent.clientX - startX), min, max);
      applyWidth(root, key, latest);
    };
    const end = (): void => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      root.classList.remove('is-resizing-column');
      if (latest !== startWidth) {
        saveWidth(key, latest);
        history?.push({
          label: 'column width',
          undo: async () => { saveWidth(key, startWidth); renderBoardData(); },
          redo: async () => { saveWidth(key, latest); renderBoardData(); },
        });
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end, { once: true });
    window.addEventListener('pointercancel', end, { once: true });
    event.preventDefault();
    return true;
  }

  function resizeWithKeyboard(event: KeyboardEvent, root: HTMLElement): boolean {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-column-resize]') : null;
    if (!target) return false;
    const key = target.dataset.columnResize;
    if (!key) return false;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return false;
    const { min, max } = widthBounds(key);
    const current = clamp(Math.round(widthFor(key)), min, max);
    const step = event.shiftKey ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP;
    let next = current;
    if (event.key === 'ArrowLeft') next = current - step;
    if (event.key === 'ArrowRight') next = current + step;
    if (event.key === 'Home') next = min;
    if (event.key === 'End') next = max;
    next = clamp(next, min, max);
    event.preventDefault();
    if (next === current) return true;
    applyWidth(root, key, next);
    saveWidth(key, next);
    history?.push({
      label: 'column width',
      undo: async () => { saveWidth(key, current); renderBoardData(); },
      redo: async () => { saveWidth(key, next); renderBoardData(); },
    });
    requestAnimationFrame(() => root.querySelector<HTMLElement>(`[data-column-resize="${CSS.escape(key)}"]`)?.focus());
    return true;
  }

  function bind(root: HTMLElement): void {
    cleanup?.();
    syncHandleAccessibility(root);
    const onPointerDown = (event: PointerEvent): void => { begin(event, root); };
    const onKeyDown = (event: KeyboardEvent): void => { resizeWithKeyboard(event, root); };
    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('keydown', onKeyDown);
    cleanup = () => {
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('keydown', onKeyDown);
      cleanup = null;
    };
  }

  function dispose(): void { cleanup?.(); }
  return Object.freeze({ bind, dispose, widthFor });
}
