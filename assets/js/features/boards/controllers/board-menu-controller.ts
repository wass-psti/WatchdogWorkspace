import type { OverlayCloseOptions, OverlayManager } from '../../../../../src/platform/contracts/overlay.ts';
import type { EscapeHtml } from '../../../../../src/platform/contracts/ui.ts';

interface BoardMenuControllerOptions {
  readonly root: HTMLElement;
  readonly escapeHtml?: EscapeHtml;
  readonly overlayCoordinator?: OverlayManager | null;
  readonly onClose?: (() => void) | null;
}

interface BoardMenuCloseOptions extends OverlayCloseOptions {}

type InputModality = 'keyboard' | 'pointer';

const cssPixels = (element: Element, name: string, fallback: number): number => {
  const raw = getComputedStyle(element).getPropertyValue(name).trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const menuItems = (menu: HTMLElement): HTMLElement[] => [...menu.querySelectorAll<HTMLElement>(
  'button:not(:disabled),[role="menuitem"]:not([aria-disabled="true"])',
)].filter((element) => !element.hidden && element.getClientRects().length > 0);

/** Unified Work Boards floating-menu controller. */
export function createBoardMenuController({ root, escapeHtml: _escapeHtml = (value) => String(value ?? ''), overlayCoordinator = null, onClose = null }: BoardMenuControllerOptions) {
  if (!(root instanceof HTMLElement)) throw new Error('Board menu controller requires a root element.');
  const abort = new AbortController();
  let activeTrigger: HTMLElement | null = null;
  let overlayLayer: HTMLDivElement | null = null;
  let menu: HTMLDivElement | null = null;
  let modality: InputModality = 'pointer';
  let typeahead = '';
  let typeaheadTimer = 0;
  let activationScrollHost: HTMLElement | null = null;
  let activationScrollLeft = 0;
  let activationScrollTop = 0;

  const ensureMenu = (): HTMLDivElement => {
    if (menu?.isConnected) return menu;
    if (!overlayLayer?.isConnected) {
      overlayLayer = document.createElement('div');
      overlayLayer.className = 'board-overlay-layer';
      overlayLayer.dataset.boardOverlayLayer = 'true';
      root.appendChild(overlayLayer);
    }
    menu = document.createElement('div');
    menu.className = 'board-floating-menu board-menu-surface';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('tabindex', '-1');
    menu.hidden = true;
    menu.removeAttribute('aria-hidden');
    overlayLayer.appendChild(menu);
    return menu;
  };

  const normalizeMenuMarkup = (target: HTMLDivElement): void => {
    target.querySelectorAll<HTMLHRElement>('hr').forEach((separator) => {
      separator.classList.add('board-menu-separator');
      separator.setAttribute('role', 'separator');
      separator.setAttribute('aria-orientation', 'horizontal');
    });
    target.querySelectorAll<HTMLElement>('.board-menu-section-label,.board-sort-menu-label').forEach((label) => {
      label.setAttribute('role', 'presentation');
    });
    target.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      button.classList.add('board-menu-item');
      if (!button.hasAttribute('role')) button.setAttribute('role', 'menuitem');
      button.tabIndex = -1;
      if (button.disabled) button.setAttribute('aria-disabled', 'true');
      else button.removeAttribute('aria-disabled');
      if (button.classList.contains('danger-text')) {
        button.classList.add('board-menu-item--danger');
        button.dataset.menuTone = 'danger';
      }
    });
  };

  const position = (): void => {
    if (!activeTrigger || !menu || menu.hidden || !activeTrigger.isConnected) return;
    const anchor = activeTrigger.getBoundingClientRect();
    const stylesFrom = root;
    const gap = cssPixels(stylesFrom, '--wm-board-overlay-gap', 8);
    const pad = cssPixels(stylesFrom, '--wm-board-overlay-gutter', 12);
    const minWidth = cssPixels(stylesFrom, '--wm-board-menu-min-width', 216);
    const maxWidth = cssPixels(stylesFrom, '--wm-board-menu-max-width', 320);
    const maxMenuHeight = cssPixels(stylesFrom, '--wm-board-menu-max-height', 420);
    const rect = menu.getBoundingClientRect();
    const viewportWidth = Math.max(0, window.innerWidth - pad * 2);
    const width = Math.min(Math.max(rect.width || minWidth, minWidth), Math.min(maxWidth, viewportWidth));
    const below = window.innerHeight - anchor.bottom - gap - pad;
    const above = anchor.top - gap - pad;
    const desiredHeight = Math.min(rect.height || 260, maxMenuHeight);
    const openAbove = below < Math.min(desiredHeight, 190) && above > below;
    const available = Math.max(120, openAbove ? above : below);
    const maxHeight = Math.max(120, Math.min(maxMenuHeight, available));
    const left = Math.max(pad, Math.min(anchor.right - width, window.innerWidth - width - pad));
    const renderedHeight = Math.min(desiredHeight, maxHeight);
    let top = openAbove ? anchor.top - renderedHeight - gap : anchor.bottom + gap;
    top = Math.max(pad, Math.min(top, window.innerHeight - renderedHeight - pad));
    const originX = Math.round(Math.min(width - 16, Math.max(16, anchor.left + anchor.width / 2 - left)));
    menu.dataset.placement = openAbove ? 'top' : 'bottom';
    menu.style.setProperty('--board-menu-origin-x', `${originX}px`);
    menu.style.setProperty('--board-menu-origin-y', openAbove ? '100%' : '0%');
    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
    menu.style.width = `${Math.round(width)}px`;
    menu.style.maxHeight = `${Math.round(maxHeight)}px`;
  };

  const close = ({ restoreFocus = false, fromCoordinator = false }: BoardMenuCloseOptions = {}): void => {
    const wasActive = Boolean(activeTrigger && menu && !menu.hidden);
    if (activeTrigger) {
      activeTrigger.setAttribute('aria-expanded', 'false');
      const details = activeTrigger.closest<HTMLDetailsElement>('details');
      if (details) details.open = false;
    }
    const previous = activeTrigger;
    activeTrigger = null;
    activationScrollHost = null;
    activationScrollLeft = 0;
    activationScrollTop = 0;
    typeahead = '';
    if (typeaheadTimer) window.clearTimeout(typeaheadTimer);
    typeaheadTimer = 0;
    if (menu) {
      menu.hidden = true;
      menu.innerHTML = '';
      menu.removeAttribute('data-menu-kind');
      menu.removeAttribute('data-placement');
      menu.removeAttribute('aria-label');
      menu.removeAttribute('aria-activedescendant');
    }
    if (!fromCoordinator) overlayCoordinator?.release('board-menu');
    if (restoreFocus && previous?.isConnected) previous.focus({ preventScroll: true });
    if (wasActive) onClose?.();
  };

  const open = (trigger: HTMLElement): boolean => {
    const host = trigger.closest<HTMLElement>('[data-board-menu-host]');
    const template = host?.querySelector(':scope > template[data-board-menu-template]');
    if (!(template instanceof HTMLTemplateElement)) return false;
    if (activeTrigger === trigger && menu && !menu.hidden) {
      close({ restoreFocus: true });
      return true;
    }
    close();
    const target = ensureMenu();
    target.innerHTML = template.innerHTML;
    normalizeMenuMarkup(target);
    target.hidden = false;
    target.dataset.menuKind = trigger.dataset.boardMenuTrigger || 'board';
    const menuLabel = trigger.getAttribute('aria-label');
    if (menuLabel) target.setAttribute('aria-label', menuLabel);
    else target.removeAttribute('aria-label');
    activeTrigger = trigger;
    activationScrollHost = trigger.closest<HTMLElement>('.board-table-scroll,.kanban-board,.board-view-region');
    activationScrollLeft = activationScrollHost?.scrollLeft ?? 0;
    activationScrollTop = activationScrollHost?.scrollTop ?? 0;
    const nativeDetails = trigger.closest<HTMLDetailsElement>('details');
    if (nativeDetails) nativeDetails.open = false;
    trigger.setAttribute('aria-expanded', 'true');
    overlayCoordinator?.open({ id: 'board-menu', element: target, trigger, close });
    requestAnimationFrame(() => {
      position();
      const items = menuItems(target);
      const preferred = items.find((item) => item.matches('.is-selected,[aria-checked="true"]')) ?? items[0];
      if (modality === 'keyboard') preferred?.focus({ preventScroll: true });
    });
    return true;
  };

  const handleTrigger = (target: EventTarget | null): boolean => {
    const trigger = target instanceof Element ? target.closest<HTMLElement>('[data-board-menu-trigger]') : null;
    if (!trigger || !root.contains(trigger)) return false;
    return open(trigger);
  };

  const focusByTypeahead = (character: string): boolean => {
    if (!menu || menu.hidden) return false;
    typeahead += character.toLocaleLowerCase();
    if (typeaheadTimer) window.clearTimeout(typeaheadTimer);
    typeaheadTimer = window.setTimeout(() => { typeahead = ''; typeaheadTimer = 0; }, 600);
    const items = menuItems(menu);
    if (!items.length) return false;
    const currentIndex = Math.max(-1, items.indexOf(document.activeElement as HTMLElement));
    const ordered = [...items.slice(currentIndex + 1), ...items.slice(0, currentIndex + 1)];
    const match = ordered.find((item) => (item.textContent || '').trim().toLocaleLowerCase().startsWith(typeahead));
    if (!match) return false;
    match.focus({ preventScroll: true });
    return true;
  };

  const handleKeydown = (event: KeyboardEvent): boolean => {
    modality = 'keyboard';
    if (!menu || menu.hidden) return false;
    if (event.key === 'Escape') {
      event.preventDefault();
      close({ restoreFocus: true });
      return true;
    }
    const items = menuItems(menu);
    if (!items.length) return false;
    const current = document.activeElement;
    const index = items.indexOf(current as HTMLElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = index < 0 ? (delta > 0 ? 0 : items.length - 1) : (index + delta + items.length) % items.length;
      items[nextIndex]?.focus({ preventScroll: true });
      return true;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      (event.key === 'Home' ? items[0] : items.at(-1))?.focus({ preventScroll: true });
      return true;
    }
    if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey && /\S/.test(event.key)) {
      if (focusByTypeahead(event.key)) {
        event.preventDefault();
        return true;
      }
    }
    return false;
  };

  document.addEventListener('pointerdown', () => { modality = 'pointer'; }, { capture: true, passive: true, signal: abort.signal });
  document.addEventListener('keydown', (event: KeyboardEvent) => { handleKeydown(event); }, { signal: abort.signal });
  window.addEventListener('resize', () => { if (activeTrigger) position(); }, { passive: true, signal: abort.signal });
  root.addEventListener('scroll', (event: Event) => {
    if (!activeTrigger || menu?.hidden) return;
    const scrollHost = event.target instanceof Element
      ? event.target.closest<HTMLElement>('.board-table-scroll,.kanban-board,.board-view-region')
      : null;
    if (!scrollHost) return;
    const isActivationPosition = Math.abs(scrollHost.scrollLeft - activationScrollLeft) <= 1
      && Math.abs(scrollHost.scrollTop - activationScrollTop) <= 1;
    const isDeferredActivationScroll = scrollHost === activationScrollHost && isActivationPosition;
    const isSynchronizedPeerTableScroll = Boolean(
      activationScrollHost?.matches('.board-table-scroll')
      && scrollHost !== activationScrollHost
      && scrollHost.matches('.board-table-scroll')
      && isActivationPosition,
    );
    if (isDeferredActivationScroll || isSynchronizedPeerTableScroll) {
      requestAnimationFrame(position);
      return;
    }
    activationScrollHost = null;
    close();
  }, { capture: true, passive: true, signal: abort.signal });

  return Object.freeze({
    open,
    close,
    handleTrigger,
    position,
    get active() { return Boolean(activeTrigger && menu && !menu.hidden); },
    dispose(): void {
      abort.abort();
      close();
      menu?.remove();
      menu = null;
      overlayLayer?.remove();
      overlayLayer = null;
    },
  });
}
