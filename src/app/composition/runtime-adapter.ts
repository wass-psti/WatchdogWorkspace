import { bindRuntimeApplicationHost } from './runtime-host.ts';

let startupHost: HTMLElement | null = null;
let startupPromise: Promise<void> | null = null;

export function mountRuntimeApplication(host: HTMLElement): Promise<void> {
  if (startupHost && startupHost !== host) {
    return Promise.reject(new Error('The legacy Work Management runtime cannot be mounted into multiple React composition hosts.'));
  }

  startupHost = host;
  bindRuntimeApplicationHost(host);
  startupPromise ??= import('../../../assets/js/app.ts').then(() => {
    try { sessionStorage.removeItem('wm:vite-preload-recovery:1.43.2'); } catch {}
  });
  return startupPromise;
}

export function runtimeApplicationStarted(): boolean {
  return startupPromise !== null;
}
