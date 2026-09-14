import { cssPixelValue, positionAnchoredSurface } from './floating-surface.ts';
import { resolveGlobalOverlayRoot } from './global-overlay-runtime.ts';

interface ShellTooltipControllerOptions {
  readonly documentRef?: Document;
  readonly selector?: string;
}

type TooltipTarget = HTMLElement & { dataset: DOMStringMap & { shellTooltip?: string; shellTooltipMode?: string; shellTooltipPlacement?: string; shellTooltipVariant?: string } };

const TOOLTIP_ID = 'wmShellTooltip';

export function createShellTooltipController({
  documentRef = document,
  selector = '[data-shell-tooltip]',
}: ShellTooltipControllerOptions = {}) {
  const abort = new AbortController();
  let tooltip: HTMLDivElement | null = null;
  let target: TooltipTarget | null = null;
  let originalDescribedBy: string | null = null;
  let timer = 0;

  const clearTimer = (): void => {
    if (!timer) return;
    window.clearTimeout(timer);
    timer = 0;
  };

  const eligible = (candidate: TooltipTarget): boolean => {
    if (!candidate.isConnected || candidate.matches(':disabled,[aria-disabled="true"]')) return false;
    if (candidate.dataset.shellTooltipMode !== 'compact') return true;
    const shell = candidate.closest<HTMLElement>('[data-workspace-shell]');
    return Boolean(shell && shell.dataset.shellNavigationState === 'compact' && shell.dataset.shellNavigationPeek !== 'true');
  };

  const close = (): void => {
    clearTimer();
    if (target) {
      if (originalDescribedBy) target.setAttribute('aria-describedby', originalDescribedBy);
      else target.removeAttribute('aria-describedby');
    }
    tooltip?.remove();
    tooltip = null;
    target = null;
    originalDescribedBy = null;
  };

  const reposition = (): void => {
    if (!tooltip || !target?.isConnected) return close();
    const root = documentRef.documentElement;
    const gutter = cssPixelValue(root, '--wm-shell-overlay-gutter', 12);
    const gap = cssPixelValue(root, '--wm-shell-tooltip-gap', 8);
    const maxWidth = cssPixelValue(root, target.dataset.shellTooltipVariant === 'action' ? '--wm-shell-tooltip-action-max-width' : '--wm-shell-tooltip-max-width', target.dataset.shellTooltipVariant === 'action' ? 180 : 240);
    const placement = target.dataset.shellTooltipPlacement === 'bottom' ? 'bottom-start' : 'right-center';
    positionAnchoredSurface({ surface: tooltip, anchor: target, placement, gutter, gap, maxWidth, maxHeight: 160 });
  };

  const show = (candidate: TooltipTarget): void => {
    if (!eligible(candidate)) return close();
    const label = candidate.dataset.shellTooltip?.trim();
    if (!label) return close();
    if (target === candidate && tooltip?.isConnected) return reposition();
    close();
    target = candidate;
    originalDescribedBy = candidate.getAttribute('aria-describedby');
    tooltip = documentRef.createElement('div');
    tooltip.id = TOOLTIP_ID;
    tooltip.className = `wm-shell-floating-surface wm-shell-tooltip${candidate.dataset.shellTooltipVariant === 'action' ? ' wm-shell-tooltip--action' : ''}`;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.textContent = label;
    resolveGlobalOverlayRoot(documentRef).appendChild(tooltip);
    const describedBy = [originalDescribedBy, TOOLTIP_ID].filter(Boolean).join(' ');
    candidate.setAttribute('aria-describedby', describedBy);
    reposition();
  };

  const targetFrom = (eventTarget: EventTarget | null): TooltipTarget | null =>
    eventTarget instanceof Element ? eventTarget.closest<TooltipTarget>(selector) : null;

  documentRef.addEventListener('pointerover', (event) => {
    const candidate = targetFrom(event.target);
    if (!candidate || candidate === target) return;
    clearTimer();
    timer = window.setTimeout(() => show(candidate), 360);
  }, { passive: true, signal: abort.signal });

  documentRef.addEventListener('pointerout', (event) => {
    if (!target) return;
    const from = targetFrom(event.target);
    const to = targetFrom(event.relatedTarget);
    if (from === target && to !== target) close();
  }, { passive: true, signal: abort.signal });

  documentRef.addEventListener('focusin', (event) => {
    const candidate = targetFrom(event.target);
    if (candidate) show(candidate);
  }, { signal: abort.signal });

  documentRef.addEventListener('focusout', (event) => {
    if (!target) return;
    const from = targetFrom(event.target);
    const to = targetFrom(event.relatedTarget);
    if (from === target && to !== target) close();
  }, { signal: abort.signal });

  documentRef.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && tooltip) close();
  }, { capture: true, signal: abort.signal });

  documentRef.addEventListener('pointerdown', close, { capture: true, signal: abort.signal });
  documentRef.addEventListener('click', (event) => {
    if (target && targetFrom(event.target) === target) close();
  }, { capture: true, signal: abort.signal });
  documentRef.addEventListener('wm:overlay-open', close as EventListener, { signal: abort.signal });
  documentRef.addEventListener('scroll', reposition, { capture: true, passive: true, signal: abort.signal });
  window.addEventListener('resize', reposition, { passive: true, signal: abort.signal });

  return Object.freeze({
    close,
    reposition,
    get active() { return Boolean(tooltip?.isConnected); },
    get target() { return target; },
    dispose() { abort.abort(); close(); },
  });
}
