import type { ObservabilityService } from '../../../../src/platform/contracts/observability.ts';

export interface BrowserObservabilityHandle { dispose(): void; }

function errorSource(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, globalThis.location?.href);
    return `${url.origin}${url.pathname}`.replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, ':id');
  } catch { return String(value).slice(0, 240); }
}

export function installBrowserObservability(observability: ObservabilityService): BrowserObservabilityHandle {
  if (typeof window === 'undefined') return Object.freeze({ dispose() {} });
  const cleanup: Array<() => void> = [];
  const onError = (event: ErrorEvent): void => {
    observability.exception(event.error ?? event.message, {
      source: errorSource(event.filename),
      line: event.lineno || null,
      column: event.colno || null,
    });
  };
  const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
    observability.exception(event.reason, { source: 'unhandledrejection' });
  };
  const onPageHide = (): void => { void observability.flush('pagehide'); };
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);
  window.addEventListener('pagehide', onPageHide);
  cleanup.push(() => window.removeEventListener('error', onError));
  cleanup.push(() => window.removeEventListener('unhandledrejection', onUnhandledRejection));
  cleanup.push(() => window.removeEventListener('pagehide', onPageHide));

  const performanceApi = globalThis.performance;
  if (performanceApi?.getEntriesByType) {
    for (const entry of performanceApi.getEntriesByType('measure')) {
      if (entry.name.startsWith('wm:startup:')) observability.performance(entry.name, entry.duration, 'ms');
    }
    const navigation = performanceApi.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navigation) {
      observability.performance('browser.navigation.dom_content_loaded', Math.max(0, navigation.domContentLoadedEventEnd - navigation.startTime), 'ms');
      observability.performance('browser.navigation.load', Math.max(0, navigation.loadEventEnd - navigation.startTime), 'ms');
      observability.performance('browser.navigation.ttfb', Math.max(0, navigation.responseStart - navigation.requestStart), 'ms');
    }
  }

  if (typeof PerformanceObserver === 'function') {
    const supported = new Set(PerformanceObserver.supportedEntryTypes ?? []);
    const observe = (type: string, callback: (entry: PerformanceEntry) => void): void => {
      if (!supported.has(type)) return;
      const observer = new PerformanceObserver((list) => { for (const entry of list.getEntries()) callback(entry); });
      try {
        observer.observe({ type, buffered: true });
        cleanup.push(() => observer.disconnect());
      } catch { observer.disconnect(); }
    };
    observe('longtask', (entry) => observability.performance('browser.long_task.duration', entry.duration, 'ms'));
    observe('paint', (entry) => observability.performance(`browser.paint.${entry.name}`, entry.startTime, 'ms'));
    observe('largest-contentful-paint', (entry) => observability.performance('browser.lcp.start_time', entry.startTime, 'ms'));
    observe('layout-shift', (entry) => {
      const shift = entry as PerformanceEntry & { readonly value?: number; readonly hadRecentInput?: boolean };
      if (!shift.hadRecentInput && typeof shift.value === 'number') observability.histogram('browser.layout_shift.delta', shift.value, '1');
    });
  }

  observability.log('info', 'session.start', 'Browser observability session started.', {
    'service.instance.id': observability.sessionId,
    language: navigator.language || null,
  });

  return Object.freeze({ dispose() { for (const fn of cleanup.splice(0)) fn(); } });
}
