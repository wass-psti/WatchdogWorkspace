const RUNTIME_HOST_ATTRIBUTE = 'data-wm-runtime-host';
const RUNTIME_HOST_GLOBAL = '__WM_RUNTIME_CONTENT_HOST__' as const;

type CompositionGlobal = typeof globalThis & {
  [RUNTIME_HOST_GLOBAL]?: HTMLElement;
};

function runtimeGlobal(): CompositionGlobal {
  return globalThis as CompositionGlobal;
}

export function bindRuntimeApplicationHost(host: HTMLElement): void {
  const current = runtimeGlobal()[RUNTIME_HOST_GLOBAL];
  if (current && current !== host && current.isConnected) {
    throw new Error('Work Management runtime content is already bound to another composition host.');
  }
  host.setAttribute(RUNTIME_HOST_ATTRIBUTE, '');
  runtimeGlobal()[RUNTIME_HOST_GLOBAL] = host;
}

export function resolveRuntimeApplicationHost(): HTMLElement {
  const bound = runtimeGlobal()[RUNTIME_HOST_GLOBAL];
  if (bound?.isConnected) return bound;
  const discovered = document.querySelector<HTMLElement>(`[${RUNTIME_HOST_ATTRIBUTE}]`);
  if (discovered) {
    runtimeGlobal()[RUNTIME_HOST_GLOBAL] = discovered;
    return discovered;
  }
  throw new Error('Work Management legacy composition host is missing.');
}

export function isRuntimeApplicationHost(host: HTMLElement): boolean {
  return host.hasAttribute(RUNTIME_HOST_ATTRIBUTE);
}
