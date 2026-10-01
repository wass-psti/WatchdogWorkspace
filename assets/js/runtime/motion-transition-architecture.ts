/* Stage I M94 — controlled motion/transition orchestration successor. */
import type { MotionExitOptions, MotionPulseTone, WorkManagementMotionApi } from '../../../src/platform/contracts/motion.ts';
declare global { var __WM_M94_MOTION_ARCHITECTURE__: boolean | undefined; }
if (!globalThis.__WM_M94_MOTION_ARCHITECTURE__) {
  globalThis.__WM_M94_MOTION_ARCHITECTURE__ = true;
  const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  const isReduced = () => Boolean(reduced?.matches);
  const sync = () => { document.documentElement.dataset.wmMotionArchitecture = isReduced() ? 'reduced' : 'controlled'; };
  const shellSelectors = '[data-wm-application-shell-frame],[data-wm-global-navigation],[data-wm-shell-header],[data-wm-shell-status-footer],body[data-wm-surface="shell"] .topbar';
  const contentSelectors = '#main,[data-wm-global-page-frame],[data-wm-page-layout],[data-motion-view]';
  const mark = (scope: Document | Element = document) => {
    const visit = (el: Element) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.matches(shellSelectors)) el.dataset.wmMotionZone = 'persistent-shell';
      if (el.matches(contentSelectors)) el.dataset.wmMotionZone = 'replaceable-content';
    };
    if (scope instanceof Element) visit(scope);
    scope.querySelectorAll(`${shellSelectors},${contentSelectors}`).forEach(visit);
  };
  sync(); reduced?.addEventListener('change', sync);
  let transitionEpoch = 0;
  const legacy = globalThis.WorkManagementMotion;
  if (legacy) {
    const legacyCancel = legacy.cancelTransitions.bind(legacy);
    globalThis.WorkManagementMotion = Object.freeze({
      ...legacy,
      async exitThen(update: () => void, options: MotionExitOptions = {}): Promise<boolean> {
        const { selector = '#main, .auth-panel, [data-motion-view]', kind = 'route', duration = 110 } = options;
        const epoch = ++transitionEpoch;
        const target = document.querySelector<HTMLElement>(selector);
        if (isReduced() || !target || typeof target.animate !== 'function' || kind === 'state') { update(); return true; }
        target.dataset.wmMotionExit = kind;
        const animation = target.animate([{ opacity: 1 }, { opacity: .72 }], { duration, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
        try { await animation.finished; } catch {}
        animation.cancel(); delete target.dataset.wmMotionExit;
        if (epoch !== transitionEpoch) return false;
        update(); return true;
      },
      cancelTransitions() { transitionEpoch += 1; legacyCancel(); },
      pulse(element: HTMLElement, tone: MotionPulseTone = 'neutral'): void {
        if (isReduced() || typeof element.animate !== 'function') return;
        element.dataset.wmMotionFeedback = 'active';
        const peak = tone === 'success' ? .84 : .9;
        const animation = element.animate([{ opacity: 1 }, { opacity: peak, offset: .45 }, { opacity: 1 }], { duration: 220, easing: 'cubic-bezier(.2,.9,.2,1)' });
        void animation.finished.finally(() => { delete element.dataset.wmMotionFeedback; });
      },
    } satisfies WorkManagementMotionApi);
  }
  const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => { if (node instanceof Element) mark(node); })));
  const start = () => { mark(); observer.observe(document.body,{childList:true,subtree:true}); document.body.dataset.wmM94MotionReady='true'; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
}
export {};
