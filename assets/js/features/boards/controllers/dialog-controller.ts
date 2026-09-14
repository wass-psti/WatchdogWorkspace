import type { BoardDialog, BoardDialogHandle, BoardDialogOptions } from '../../../../../src/features/boards/contracts/presentation.ts';
import type { OverlayManager } from '../../../../../src/platform/contracts/overlay.ts';
import type { EscapeHtml, ToastRenderer } from '../../../../../src/platform/contracts/ui.ts';
import { buttonClass, iconButtonClass } from '../../../platform/ui/primitives.ts';
import { resolveGlobalOverlayRoot } from '../../../platform/ui/global-overlay-runtime.ts';

export interface BoardDialogControllerDependencies {
  readonly toast: ToastRenderer;
  readonly escapeHtml: EscapeHtml;
  readonly overlaySelector?: string;
  readonly overlayCoordinator?: OverlayManager | null;
}

export interface BoardDialogController {
  open: BoardDialog;
  confirm(message: string): Promise<boolean>;
  closeAll(): void;
  count(): number;
}

const errorMessage = (error: unknown): string => error instanceof Error
  ? error.message
  : 'This action couldn’t be completed. Review the details and try again.';

/**
 * Shared Work Boards modal controller.
 * Owns focus restoration, keyboard trapping, submit busy state and persistent
 * inline errors so individual board workflows only provide content and actions.
 */
export function createBoardDialogController({ toast, escapeHtml, overlaySelector = '#overlayRoot', overlayCoordinator = null }: BoardDialogControllerDependencies): BoardDialogController {
  const esc = escapeHtml;
  const openDialogs = new Set<HTMLElement>();
  let sequence = 0;

  function open({ title, body, submitLabel = 'Save', danger = false, onSubmit }: BoardDialogOptions): BoardDialogHandle {
    const overlay = overlaySelector === '#overlayRoot'
      ? resolveGlobalOverlayRoot()
      : document.querySelector<HTMLElement>(overlaySelector) || resolveGlobalOverlayRoot();
    const previous = document.activeElement;
    const dialogId = `wmBoardDialog${++sequence}`;
    const titleId = `${dialogId}Title`;
    const overlayId = `board-dialog-${sequence}`;
    const wrap = document.createElement('div');
    wrap.className = 'wm-modal-backdrop board-dialog-backdrop';
    wrap.dataset.boardDialog = dialogId;
    wrap.dataset.dialogState = 'opening';
    wrap.innerHTML = `<section class="wm-dialog wm-modal board-dialog" role="dialog" aria-modal="true" aria-labelledby="${titleId}" data-dialog-tone="${danger ? 'danger' : 'default'}">
      <header class="wm-dialog-header"><div class="board-dialog-heading"><span class="top-eyebrow">WORK MANAGEMENT</span><h2 id="${titleId}">${esc(title)}</h2></div><button class="${iconButtonClass({ tone: 'ghost' }, 'wm-modal-close board-dialog-close')}" type="button" aria-label="Close dialog">×</button></header>
      <form><div class="wm-dialog-body wm-modal-body">${body}<div class="wm-modal-error" data-modal-error role="alert" tabindex="-1" hidden></div></div><footer class="wm-dialog-footer"><button type="button" class="${buttonClass({ tone: 'secondary' }, 'secondary-btn wm-modal-cancel')}">Cancel</button><button type="submit" class="${buttonClass({ tone: danger ? 'danger' : 'primary' }, danger ? 'danger-btn board-dialog-submit' : 'primary-btn board-dialog-submit')}">${esc(submitLabel)}</button></footer></form>
    </section>`;
    overlay.appendChild(wrap);
    openDialogs.add(wrap);

    const dialog = wrap.querySelector<HTMLElement>('.board-dialog');
    const focusables = (): HTMLElement[] => [...wrap.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[href],[tabindex]:not([tabindex="-1"])')]
      .filter((element) => element.getClientRects().length > 0 && !element.closest('[hidden]'));
    const initialFocus = (): HTMLElement | null => wrap.querySelector<HTMLElement>('[autofocus],input:not([disabled]),select:not([disabled]),textarea:not([disabled])')
      ?? wrap.querySelector<HTMLElement>('.wm-modal-cancel')
      ?? wrap.querySelector<HTMLElement>('button[type="submit"]')
      ?? wrap.querySelector<HTMLElement>('.wm-modal-close');

    requestAnimationFrame(() => {
      if (!wrap.isConnected) return;
      wrap.dataset.dialogState = 'open';
      initialFocus()?.focus({ preventScroll: true });
    });

    let closing = false;
    let busy = false;
    const finalizeClose = (restoreFocus: boolean): void => {
      if (!wrap.isConnected) return;
      openDialogs.delete(wrap);
      wrap.remove();
      if (restoreFocus && previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
    const closeInternal = ({ fromCoordinator = false, restoreFocus = true }: Readonly<{ fromCoordinator?: boolean; restoreFocus?: boolean }> = {}): void => {
      if (!wrap.isConnected || closing) return;
      closing = true;
      wrap.dataset.dialogState = 'closing';
      if (!fromCoordinator) overlayCoordinator?.release(overlayId);
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      if (fromCoordinator || reduced) {
        finalizeClose(restoreFocus && !fromCoordinator);
        return;
      }
      wrap.classList.add('is-closing');
      window.setTimeout(() => finalizeClose(restoreFocus), 150);
    };
    const close = (): void => closeInternal();

    overlayCoordinator?.open({
      id: overlayId,
      element: wrap,
      trigger: previous instanceof HTMLElement ? previous : null,
      close: ({ restoreFocus = false, fromCoordinator = false } = {}) => closeInternal({ restoreFocus, fromCoordinator }),
    });

    wrap.addEventListener('click', (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (event.target === wrap || target?.closest('.wm-modal-close,.wm-modal-cancel')) close();
    });
    wrap.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!busy) close();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    const form = wrap.querySelector<HTMLFormElement>('form');
    form?.addEventListener('submit', async (event: SubmitEvent) => {
      event.preventDefault();
      const submit = event.submitter instanceof HTMLButtonElement ? event.submitter : null;
      if (!submit || !(event.currentTarget instanceof HTMLFormElement) || busy) return;
      busy = true;
      wrap.dataset.dialogState = 'busy';
      dialog?.setAttribute('aria-busy', 'true');
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      const errorBox = wrap.querySelector<HTMLElement>('[data-modal-error]');
      if (errorBox) {
        errorBox.hidden = true;
        errorBox.textContent = '';
      }
      try {
        await onSubmit(new FormData(event.currentTarget));
        close();
      } catch (error) {
        const message = errorMessage(error);
        busy = false;
        wrap.dataset.dialogState = 'open';
        dialog?.removeAttribute('aria-busy');
        if (errorBox) {
          errorBox.textContent = message;
          errorBox.hidden = false;
          errorBox.focus({ preventScroll: true });
        }
        toast(message, 'warning');
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
      }
    });

    return Object.freeze({ wrap, close });
  }

  function confirm(message: string): Promise<boolean> {
    const destructive = /delete|permanent|remove|trash|cannot be undone/i.test(message);
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (value: boolean): void => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const handle = open({
        title: destructive ? 'Confirm destructive action' : 'Confirm action',
        body: `<div class="board-confirm-copy"><span class="board-confirm-symbol" aria-hidden="true">${destructive ? '!' : '?'}</span><p>${esc(message)}</p></div>`,
        submitLabel: destructive ? 'Confirm action' : 'Continue',
        danger: destructive,
        onSubmit: () => { finish(true); },
      });
      const observer = new MutationObserver(() => {
        if (!handle.wrap.isConnected) { observer.disconnect(); finish(false); }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    });
  }

  function closeAll(): void {
    for (const wrap of [...openDialogs]) wrap.querySelector<HTMLButtonElement>('.wm-modal-close')?.click();
  }

  return Object.freeze({ open, confirm, closeAll, count: () => openDialogs.size });
}
