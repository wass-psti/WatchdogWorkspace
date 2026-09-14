import type {
  ServiceWorkerUpdateCoordinatorOptions,
  ServiceWorkerUpdateLifecycleEvent,
} from '../../../../src/platform/contracts/service-worker-update.ts';

export const SERVICE_WORKER_SCRIPT = './service-worker.js';
export const SERVICE_WORKER_UPDATE_VIA_CACHE = 'none' as const;
export const SERVICE_WORKER_MINIMUM_UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;
export const SERVICE_WORKER_ACTIVATE_MESSAGE = 'WM_ACTIVATE_UPDATE';

const emit = (
  listener: ServiceWorkerUpdateCoordinatorOptions['onLifecycle'],
  event: Omit<ServiceWorkerUpdateLifecycleEvent, 'at'>,
): void => {
  try { listener?.(Object.freeze({ ...event, at: new Date().toISOString() })); } catch { /* telemetry must never break updates */ }
};

export function shouldCheckForServiceWorkerUpdate(
  lastCheckedAt: number,
  now: number,
  minimumIntervalMs = SERVICE_WORKER_MINIMUM_UPDATE_CHECK_INTERVAL_MS,
): boolean {
  if (!Number.isFinite(lastCheckedAt) || lastCheckedAt <= 0) return true;
  return Math.max(0, now - lastCheckedAt) >= Math.max(1_000, minimumIntervalMs);
}

export function activateWaitingServiceWorker(
  registration: ServiceWorkerRegistration,
  onLifecycle?: ServiceWorkerUpdateCoordinatorOptions['onLifecycle'],
): void {
  const waiting = registration.waiting;
  if (!waiting) throw new Error('The application update is no longer waiting to activate.');
  emit(onLifecycle, { type: 'activation-requested', detail: waiting.scriptURL });
  waiting.postMessage({ type: SERVICE_WORKER_ACTIVATE_MESSAGE });
}

export function registerManagedServiceWorker(options: ServiceWorkerUpdateCoordinatorOptions = {}): void {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;

  addEventListener('load', async () => {
    let lastController: ServiceWorker | null = navigator.serviceWorker.controller;
    let lastCheckedAt = Date.now();
    const minimumInterval = Math.max(1_000, options.minimumUpdateCheckIntervalMs ?? SERVICE_WORKER_MINIMUM_UPDATE_CHECK_INTERVAL_MS);

    try {
      const registration = await navigator.serviceWorker.register(SERVICE_WORKER_SCRIPT, {
        updateViaCache: SERVICE_WORKER_UPDATE_VIA_CACHE,
      });
      emit(options.onLifecycle, { type: 'registered', detail: `updateViaCache=${registration.updateViaCache}` });

      const publishWaitingUpdate = (): void => {
        if (!registration.waiting || !navigator.serviceWorker.controller) return;
        emit(options.onLifecycle, { type: 'update-ready', detail: registration.waiting.scriptURL });
        options.onUpdate?.(registration);
      };

      publishWaitingUpdate();

      registration.addEventListener('updatefound', () => {
        emit(options.onLifecycle, { type: 'update-found', detail: registration.installing?.scriptURL ?? SERVICE_WORKER_SCRIPT });
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) publishWaitingUpdate();
        });
      });

      const checkForUpdate = async (reason: 'visibility' | 'online' | 'manual'): Promise<void> => {
        const now = Date.now();
        if (!shouldCheckForServiceWorkerUpdate(lastCheckedAt, now, minimumInterval)) return;
        lastCheckedAt = now;
        emit(options.onLifecycle, { type: 'update-check-started', reason });
        try {
          await registration.update();
          emit(options.onLifecycle, { type: 'update-check-completed', reason });
          publishWaitingUpdate();
        } catch (error) {
          emit(options.onLifecycle, { type: 'update-check-failed', reason, detail: error instanceof Error ? error.message : String(error) });
        }
      };

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) void checkForUpdate('visibility');
      });
      addEventListener('online', () => { void checkForUpdate('online'); });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        const previousController = lastController;
        lastController = navigator.serviceWorker.controller;
        emit(options.onLifecycle, { type: 'controller-changed', detail: lastController?.scriptURL ?? SERVICE_WORKER_SCRIPT });
        // First install should not reload the current page. Any replacement of an
        // existing controller is an explicit update activation and all open tabs
        // reload so old and new application bundles cannot coexist indefinitely.
        if (previousController) location.reload();
      });
    } catch (error) {
      emit(options.onLifecycle, { type: 'registration-failed', detail: error instanceof Error ? error.message : String(error) });
      console.warn('[Work Management] Service worker registration failed', error);
    }
  }, { once: true });
}
