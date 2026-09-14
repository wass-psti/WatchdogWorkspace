import type { ModuleId } from '../../../src/types/identifiers.ts';
import { embeddedModuleIdentityContextSchema } from '../../../src/runtime-schemas/index.ts';
import type {
  EmbeddedModuleAccess,
  EmbeddedModuleIdentityContext,
} from '../../../src/platform/contracts/embedded-module.ts';

interface IdentityBridgeHandle {
  readonly ready: Promise<EmbeddedModuleIdentityContext | null>;
  readonly current: EmbeddedModuleIdentityContext | null;
  dispose(): void;
}

function parseIdentityContext(value: unknown, expectedModuleId: ModuleId): EmbeddedModuleIdentityContext | null {
  const parsed = embeddedModuleIdentityContextSchema.safeParse(value);
  if (!parsed.success || parsed.data.moduleId !== expectedModuleId) return null;
  const role = parsed.data.module.role?.trim() || null;
  const displayName = parsed.data.user.displayName.trim() || parsed.data.user.email;
  return Object.freeze({
    ...parsed.data,
    moduleId: expectedModuleId,
    user: Object.freeze({ ...parsed.data.user, displayName }),
    module: Object.freeze({ ...parsed.data.module, role }),
    allowed: Boolean(
      parsed.data.user.id
      && parsed.data.accountStatus === 'active'
      && parsed.data.module.enabled
      && role
    ),
  }) as EmbeddedModuleIdentityContext;
}

function publishGlobals(moduleId: ModuleId, context: EmbeddedModuleIdentityContext | null): void {
  const allowed = context?.allowed === true;
  const access: EmbeddedModuleAccess = Object.freeze({ allowed, moduleId, role: context?.module.role ?? null });
  globalThis.WM_IDENTITY_CONTEXT = context;
  globalThis.WM_MODULE_ACCESS = access;
  if (context) window.dispatchEvent(new CustomEvent('wm:identity-context', { detail: context }));
}

export function installModuleIdentityBridge(moduleId: ModuleId, timeoutMs = 3000): IdentityBridgeHandle {
  const abort = new AbortController();
  let current: EmbeddedModuleIdentityContext | null = null;
  let settled = false;
  let resolveReady!: (value: EmbeddedModuleIdentityContext | null) => void;
  const ready = new Promise<EmbeddedModuleIdentityContext | null>((resolve) => { resolveReady = resolve; });
  globalThis.WMIdentityReady = ready;
  publishGlobals(moduleId, null);

  const settle = (context: EmbeddedModuleIdentityContext | null): void => {
    current = context;
    publishGlobals(moduleId, context);
    if (!settled) {
      settled = true;
      resolveReady(context);
    }
  };

  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    const parsed = parseIdentityContext(event.data, moduleId);
    if (parsed) settle(parsed);
  }, { signal: abort.signal });

  try { window.parent?.postMessage({ type: 'wm:identity:request', moduleId }, location.origin); } catch { /* Same-origin host may not be available yet. */ }
  const timer = window.setTimeout(() => { if (!settled) settle(null); }, Math.max(500, timeoutMs));

  return Object.freeze({
    ready,
    get current() { return current; },
    dispose() {
      window.clearTimeout(timer);
      abort.abort();
      if (!settled) settle(null);
    },
  });
}

declare global {
  var WMIdentityReady: Promise<EmbeddedModuleIdentityContext | null> | undefined;
  var WM_IDENTITY_CONTEXT: EmbeddedModuleIdentityContext | null | undefined;
  var WM_MODULE_ACCESS: EmbeddedModuleAccess | undefined;
}
