import {
  modules, moduleRegistry, parseRoute, navigate,
  PLATFORM_VERSION, applyTheme, applyDensity, getPreferences, registerServiceWorker, activateServiceWorkerUpdate,
  auth, AUTH_EVENT, installCloudModuleDataBridge, createBoardsFeature,
  createWorkManagementClient, createModuleHost, createModulePresentationHost, nativeModuleRegistry, createFeatureRegistry, createRouteController, createRouteLifecycleCoordinator, installApplicationLifecycle, createHomeFeature, createCommandPaletteFeature, createRuntimeErrorBoundary, createPlatformServices, workManagementClientState, applicationManifest, validateApplicationManifest, sharedApplicationUiRuntime, globalOverlayRuntime, icons, escapeHtml,
} from './runtime/index.ts';
import { authorizationFingerprint, reconcileAuthorizationContext } from './runtime/authorization-context.ts';
import type { ModuleId } from '../../src/types/identifiers.ts';
import type { WorkManagementModuleDefinition } from '../../src/types/modules.ts';
import type { BoardRecord } from '../../src/features/boards/contracts/domain.ts';
import { boardListQueryKey } from '../../src/features/boards/contracts/query-keys.ts';
import type { InstallPrompt, ToastTone, TransitionUpdate } from '../../src/platform/contracts/ui.ts';
import type { WorkManagementMotionApi } from '../../src/platform/contracts/motion.ts';
import type { RuntimeBoundaryContext } from './runtime/error-boundary.ts';
import type { WorkManagementError } from './platform/errors/app-error.ts';
import type { ShellNavigationMode, ShellSectionClientState, ShellSectionId } from '../../src/platform/contracts/client-state.ts';
import { buttonClass, iconButtonClass, navigationItemClass, toolbarClass } from './platform/ui/primitives.ts';
import { createAccountProfileMenu } from './features/account/profile-menu.ts';
import { createShellTooltipController } from './platform/ui/tooltip-controller.ts';
import { resolveRuntimeApplicationHost } from '../../src/app/composition/runtime-host.ts';
import { presentationReadinessRuntime } from '../../src/app/composition/presentation-readiness-runtime.ts';
import { createPresentationFrameToken, isPresentationFrameCurrent, type PresentationFrameToken } from './runtime/presentation-frame-guard.ts';
import { reactShellRuntime, resolveReactShellRoot } from '../../src/app/shell/shell-runtime-bridge.ts';
import { authenticationUiRuntime, type AuthenticationUIView } from '../../src/app/auth/authentication-ui-runtime.ts';
import { authenticatedManagementUiRuntime, type AuthenticatedManagementUIView } from '../../src/app/management/authenticated-management-ui-runtime.ts';
import { boardPresentationFacadeRuntime } from '../../src/app/boards/board-presentation-facade-runtime.ts';
import { resolveBoardPresentationHost } from '../../src/app/boards/board-presentation-host.ts';
import { installBrowserObservability } from './platform/observability/browser-observer.ts';
import { backendCapabilityPreflight } from './platform/data/backend-capability-preflight.ts';
import { M38_MODULE_REQUIREMENTS, type M38CapabilityModule } from '../../config/backend-capability-manifest.ts';

type MotionMode = 'page' | 'module' | 'home' | string;
type RuntimeRecord = Readonly<Record<string, unknown>>;
type ModuleInvalidateReason = 'backup-restore' | 'host-refresh';
interface WorkManagementRuntimeGlobal {
  readonly version: string;
  readonly architectureVersion: number;
  readonly listen: ReturnType<typeof createWorkManagementClient>['listen'];
  readonly get: ReturnType<typeof createWorkManagementClient>['get'];
  readonly set: ReturnType<typeof createWorkManagementClient>['set'];
  readonly execute: ReturnType<typeof createWorkManagementClient>['execute'];
  readonly getContext: ReturnType<typeof createWorkManagementClient>['getContext'];
  readonly features: () => unknown;
  readonly diagnostics: () => unknown;
  readonly observability: () => unknown;
  readonly observabilityStatus: () => unknown;
  readonly serverState: () => unknown;
  readonly clientState: () => unknown;
}

const globalRuntime = globalThis as typeof globalThis & { WorkManagementRuntime?: WorkManagementRuntimeGlobal };
const motionRuntime = (): WorkManagementMotionApi | undefined => globalThis.WorkManagementMotion;
const recordOf = (value: unknown): RuntimeRecord => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuntimeRecord : Object.freeze({});
const stringField = (value: unknown, key: string): string => { const field = recordOf(value)[key]; return typeof field === 'string' ? field : ''; };
const app = resolveRuntimeApplicationHost();
const reactShellRoot = resolveReactShellRoot();
const shellQuery = <T extends Element>(selector: string): T | null => reactShellRoot.querySelector<T>(selector);
const ROUTE_FOCUS_SELECTORS: Readonly<Record<string, string>> = Object.freeze({
  auth: '[data-wm-authentication-ui-host]#main, [data-wm-authentication-ui-host] #main',
  management: '[data-wm-authenticated-management-ui-host] #main',
  boards: '[data-wm-board-presentation-host] #main',
  home: '[data-wm-runtime-host] #main',
  'module-host': '[data-wm-runtime-host] #main',
  shell: '[data-wm-runtime-host] #main, [data-wm-runtime-host] .auth-panel',
});
const DEFAULT_ROUTE_FOCUS_SELECTOR = '[data-wm-board-presentation-host] #main, [data-wm-authenticated-management-ui-host] #main, [data-wm-authentication-ui-host]#main, [data-wm-authentication-ui-host] #main, [data-wm-runtime-host] #main, [data-wm-runtime-host] .auth-panel';
const isVisibleRouteFocusTarget = (element: HTMLElement): boolean => {
  if (!element.isConnected || element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(element);
  return element.getClientRects().length > 0 && style.display !== 'none' && style.visibility !== 'hidden';
};
const resolveShellRouteContentTarget = (owner: string | null = null): HTMLElement | null => {
  const selector = owner ? ROUTE_FOCUS_SELECTORS[owner] ?? DEFAULT_ROUTE_FOCUS_SELECTOR : DEFAULT_ROUTE_FOCUS_SELECTOR;
  return [...reactShellRoot.querySelectorAll<HTMLElement>(selector)].find(isVisibleRouteFocusTarget) ?? null;
};

const esc = escapeHtml;
const primaryButtonClass = buttonClass({ tone: 'primary' }, 'primary-btn');
const secondaryButtonClass = buttonClass({ tone: 'secondary' }, 'secondary-btn');
const topActionToolbarClass = toolbarClass('top-actions');
let prefs = getPreferences();
let moduleFrame: HTMLIFrameElement | null = null;
let activeModuleId: ModuleId | null = null;
let deferredInstall: InstallPrompt | null = null;
let swUpdate: ServiceWorkerRegistration | null = null;
let moduleLoadTimer: number | null = null;
const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const finePointerQuery = window.matchMedia?.('(pointer: fine)');
const shellMobileQuery = window.matchMedia?.('(max-width: 620px)');
const shellTabletQuery = window.matchMedia?.('(max-width: 900px) and (min-width: 621px)');
type ShellNavigationPreference = Readonly<{ state: ShellNavigationMode; width: number; pinned: boolean }>;
const SHELL_NAVIGATION_STORAGE_KEY = 'wm.platform.shell-navigation.v1';
const shellNavigationTokenPx = (name: string, fallback: number): number => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const shellNavigationWidthBounds = (): Readonly<{ min: number; defaultWidth: number; max: number }> => Object.freeze({
  min: shellNavigationTokenPx('--wm-shell-sidebar-width-min', 224),
  defaultWidth: shellNavigationTokenPx('--wm-shell-sidebar-width-default', 256),
  max: shellNavigationTokenPx('--wm-shell-sidebar-width-max', 360),
});
const clampShellNavigationWidth = (width: number): number => {
  const bounds = shellNavigationWidthBounds();
  return Math.min(bounds.max, Math.max(bounds.min, Math.round(Number.isFinite(width) ? width : bounds.defaultWidth)));
};
const readShellNavigationPreference = (): ShellNavigationPreference => {
  const bounds = shellNavigationWidthBounds();
  try {
    const raw = localStorage.getItem(SHELL_NAVIGATION_STORAGE_KEY);
    if (raw === 'compact' || raw === 'expanded') return Object.freeze({ state: raw, width: bounds.defaultWidth, pinned: true });
    const parsed = raw ? JSON.parse(raw) as Partial<Record<'state' | 'width' | 'pinned', unknown>> : {};
    const pinned = parsed.pinned !== false;
    const state: ShellNavigationMode = parsed.state === 'compact' || !pinned ? 'compact' : 'expanded';
    const width = clampShellNavigationWidth(typeof parsed.width === 'number' ? parsed.width : bounds.defaultWidth);
    return Object.freeze({ state, width, pinned });
  } catch { return Object.freeze({ state:'expanded', width:bounds.defaultWidth, pinned:true }); }
};
const initialShellNavigationPreference = readShellNavigationPreference();
let shellMobileRestoreFocus: HTMLElement | null = null;

type ShellSectionState = ShellSectionClientState;
const SHELL_SECTION_STORAGE_KEY = 'wm.platform.shell-sections.v1';
const DEFAULT_SHELL_SECTION_STATE: ShellSectionState = Object.freeze({ favorites: true, applications: true, boards: true });
const readShellSectionState = (): ShellSectionState => {
  try {
    const raw = localStorage.getItem(SHELL_SECTION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as Partial<Record<ShellSectionId, unknown>> : {};
    return Object.freeze({
      favorites: parsed.favorites !== false,
      applications: parsed.applications !== false,
      boards: parsed.boards !== false,
    });
  } catch { return DEFAULT_SHELL_SECTION_STATE; }
};
const writeShellSectionState = (state: ShellSectionState): void => {
  try { localStorage.setItem(SHELL_SECTION_STORAGE_KEY, JSON.stringify(state)); } catch {}
};
workManagementClientState.hydratePersistentShell({
  navigation: {
    mode: initialShellNavigationPreference.state,
    width: initialShellNavigationPreference.width,
    pinned: initialShellNavigationPreference.pinned,
  },
  sections: readShellSectionState(),
});
const shellClientState = () => workManagementClientState.getSnapshot().shell;
const shellNavigation = () => shellClientState().navigation;
const writeShellNavigationPreference = (): void => {
  const navigation = shellNavigation();
  const value: ShellNavigationPreference = Object.freeze({ state:navigation.mode, width:clampShellNavigationWidth(navigation.width), pinned:navigation.pinned });
  try { localStorage.setItem(SHELL_NAVIGATION_STORAGE_KEY, JSON.stringify(value)); } catch {}
};
let accountProfileMenu: ReturnType<typeof createAccountProfileMenu> | null = null;
const shellTooltipController = createShellTooltipController();
let motionFrame = 0;
let motionCleanupTimer: number | null = null;
let pointerActivationTarget: HTMLElement | null = null;
let pressedFeedbackTarget: HTMLElement | null = null;
const entryAnimations = new WeakMap<HTMLElement, Animation>();

// v1.22 architecture gateway: shell features interact through a small SDK-style
// runtime contract inspired by the supplied monday-sdk-js listener/get/set/execute model.
// Existing feature implementations stay intact behind explicit boundaries while they
// are migrated incrementally, avoiding a risky all-at-once rewrite.
const runtimeClient = createWorkManagementClient({
  context: { applicationId: applicationManifest.id, version: PLATFORM_VERSION, architectureVersion: applicationManifest.architectureVersion },
});
const routeLifecycle = createRouteLifecycleCoordinator();
const platformServices = createPlatformServices({ auth });
const { diagnostics, observability, serverState, clientState } = platformServices;
const browserObservability = installBrowserObservability(observability);
void browserObservability;
window.addEventListener('wm:backup-dr', (event: Event) => {
  const detail: RuntimeRecord = event instanceof CustomEvent ? recordOf(event.detail) : Object.freeze({});
  const type = stringField(detail, 'type') || 'unknown';
  const level = type === 'restore-failed' ? 'error' : type === 'import-preflight' && stringField(detail, 'status') === 'warning' ? 'warning' : 'info';
  observability.log(level, `backup_dr.${type.replaceAll('-', '_')}`, `Backup/DR event: ${type}`, {
    entryCount: typeof detail.entryCount === 'number' ? detail.entryCount : undefined,
    boardCount: typeof detail.boardCount === 'number' ? detail.boardCount : undefined,
    restored: typeof detail.restored === 'number' ? detail.restored : undefined,
    warningCount: typeof detail.warningCount === 'number' ? detail.warningCount : undefined,
    integrity: typeof detail.integrity === 'string' ? detail.integrity : undefined,
    status: typeof detail.status === 'string' ? detail.status : undefined,
    phase: typeof detail.phase === 'string' ? detail.phase : undefined,
    code: typeof detail.code === 'string' ? detail.code : undefined,
  });
});
diagnostics.info('RUNTIME_BOOT', 'Work Management runtime initialized.', {
  version: PLATFORM_VERSION,
  architectureVersion: applicationManifest.architectureVersion,
  runtime: applicationManifest.runtime,
});
runtimeClient.register('diagnostics', { snapshot: () => diagnostics.snapshot(), clear: () => diagnostics.clear() });
runtimeClient.register('observability', { snapshot: () => observability.snapshot(), status: () => observability.status(), flush: (params: unknown) => observability.flush(stringField(params, 'reason') || 'runtime-client') });
runtimeClient.register('server-state', {
  snapshot: () => serverState.snapshot(),
  invalidate: (params: unknown) => serverState.invalidateQueries(Array.isArray(recordOf(params).key) ? recordOf(params).key as readonly string[] : []),
  clear: () => serverState.clear(),
});
runtimeClient.register('client-state', {
  snapshot: () => clientState.getSnapshot(),
  resetTransient: () => clientState.resetTransientShellState(),
});
runtimeClient.register('router', {
  current: () => parseRoute(),
  navigate: (params: unknown) => navigate(stringField(params, 'path')),
});
runtimeClient.register('manifest', {
  get: () => applicationManifest,
  validate: () => validateApplicationManifest(applicationManifest),
});
runtimeClient.register('identity', {
  current: (params: unknown) => {
    const moduleId = stringField(params, 'moduleId');
    return moduleId ? auth.moduleIdentityContext(moduleId) : auth.snapshot?.() || null;
  },
  revalidate: () => auth.revalidateAccessContext({ force: true, maxAgeMs: 5_000 }),
});
runtimeClient.register('backend-preflight', {
  current: () => backendCapabilityPreflight.getSnapshot(),
});
runtimeClient.register('route-lifecycle', {
  current: () => routeLifecycle.getSnapshot(),
});
runtimeClient.register('presentation-readiness', {
  current: () => presentationReadinessRuntime.getSnapshot(),
});
const moduleHost = createModuleHost({ auth, origin: location.origin, onEvent: (event) => runtimeClient.emit(event.type, event) });
const modulePresentationHost = createModulePresentationHost({
  auth,
  iframeHost: moduleHost,
  nativeRegistry: nativeModuleRegistry,
  normalizedData: platformServices.modules.normalizedData,
  onEvent: (event) => runtimeClient.emit(event.type, event),
});
window.addEventListener('wm:module-store-invalidate', (event: Event) => {
  const detail: RuntimeRecord = event instanceof CustomEvent ? recordOf(event.detail) : Object.freeze({});
  const reason: ModuleInvalidateReason = detail.reason === 'backup-restore' ? 'backup-restore' : 'host-refresh';
  void modulePresentationHost.invalidate(reason);
});
const featureRegistry = createFeatureRegistry(applicationManifest);
runtimeClient.register('features', {
  list: () => featureRegistry.snapshot(),
  get: (params: unknown) => featureRegistry.get(stringField(params, 'id'))?.metadata || null,
  ownerForRoute: (params: unknown) => featureRegistry.ownerForRoute(stringField(params, 'route')),
  validate: () => featureRegistry.validate(),
});
const manifestValidation = validateApplicationManifest(applicationManifest);
if (!manifestValidation.valid) console.error('[Work Management] Application manifest is invalid', manifestValidation.errors);
globalRuntime.WorkManagementRuntime = Object.freeze({
  version: PLATFORM_VERSION,
  architectureVersion: applicationManifest.architectureVersion,
  listen: runtimeClient.listen,
  get: runtimeClient.get,
  set: runtimeClient.set,
  execute: runtimeClient.execute,
  getContext: runtimeClient.getContext,
  features: () => featureRegistry.snapshot(),
  diagnostics: () => diagnostics.snapshot(),
  observability: () => observability.snapshot(),
  observabilityStatus: () => observability.status(),
  serverState: () => serverState.snapshot(),
  clientState: () => clientState.getSnapshot(),
});

installCloudModuleDataBridge({ auth, getFrame: () => moduleFrame, getModuleId: () => activeModuleId });

const SHELL_ACTION_SELECTOR = [
  'button[data-nav]',
  'button[data-command]',
  'button[data-favorite]',
  'article[data-open-module]',
  '.recent-list button[data-open-module]',
  'button[data-toggle-favorites]',
  'button[data-clear-filter]',
  'button[data-install]',
  'button[data-theme]',
  'button[data-setting-action]',
  'button[data-reload-frame]',
  'a.module-action[href]',
  'button.back-btn',
  'button[data-account]',
  'button[data-account-menu-trigger]',
  'button[data-auth-action]',
  'button[data-resend-confirmation]',
  'button[data-confirm-verification]',
  'button[data-account-action]',
  'button[data-shell-navigation-toggle]',
  'button[data-shell-navigation-pin]',
  'button[data-shell-navigation-mobile-toggle]',
  'button[data-shell-navigation-dismiss]',
  'button[data-shell-section-toggle]',
  'button[data-shell-resource-search-clear]',
  'button[data-user-directory-refresh]',
  'button[data-retry-route]',
  'a[data-shell-skip]'
].join(',');

const RIPPLE_ACTION_SELECTOR = [
  'button[data-nav]',
  'button[data-command]',
  'button[data-favorite]',
  'article[data-open-module]',
  '.recent-list button[data-open-module]',
  'button[data-toggle-favorites]',
  'button[data-clear-filter]',
  'button[data-install]',
  'button[data-theme]',
  'button[data-setting-action]',
  'button[data-reload-frame]',
  'a.module-action[href]',
  'button.back-btn',
  'button[data-account]',
  'button[data-account-menu-trigger]',
  'button[data-auth-action]',
  'button[data-resend-confirmation]',
  'button[data-confirm-verification]',
  'button[data-account-action]',
  'button[data-shell-navigation-toggle]',
  'button[data-shell-navigation-pin]',
  'button[data-shell-navigation-mobile-toggle]',
  'button[data-shell-navigation-dismiss]',
  'button[data-shell-section-toggle]',
  'button[data-shell-resource-search-clear]',
  'button[data-user-directory-refresh]',
  'button[data-retry-route]'
].join(',');
const readUpdateDismissed = () => { try { return sessionStorage.getItem('wm.platform.update-dismissed.v1') === '1'; } catch { return false; } };
const writeUpdateDismissed = (value: boolean): void => { try { value ? sessionStorage.setItem('wm.platform.update-dismissed.v1', '1') : sessionStorage.removeItem('wm.platform.update-dismissed.v1'); } catch {} };
let updateDismissed = readUpdateDismissed();

applyTheme(prefs.theme);
applyDensity(prefs.compact);
const recordServiceWorkerLifecycle = (event: import('../../src/platform/contracts/service-worker-update.ts').ServiceWorkerUpdateLifecycleEvent): void => {
  const severity = event.type.endsWith('failed') ? 'warning' : 'info';
  observability.log(severity, `service_worker.${event.type.replaceAll('-', '_')}`, event.detail || event.type, {
    reason: event.reason ?? null,
  });
};
sharedApplicationUiRuntime.configureUpdate({
  dismiss: () => {
    updateDismissed = true;
    writeUpdateDismissed(true);
    observability.log('info', 'service_worker.update_dismissed', 'A waiting application update was dismissed for this session.');
  },
  apply: () => {
    if (!swUpdate?.waiting) throw new Error('The application update is no longer waiting to activate.');
    activateServiceWorkerUpdate(swUpdate, recordServiceWorkerLifecycle);
  },
});
registerServiceWorker((registration) => {
  swUpdate = registration;
  if (updateDismissed) return;
  sharedApplicationUiRuntime.showUpdate();
}, recordServiceWorkerLifecycle);



const moduleById = (id: string | null | undefined): WorkManagementModuleDefinition | null => id ? moduleRegistry.get(id) ?? null : null;
const motionEnabled = () => !reducedMotionQuery?.matches;

function queueEntranceMotion(mode: MotionMode = 'page'): void {
  window.cancelAnimationFrame(motionFrame);
  if (motionCleanupTimer !== null) window.clearTimeout(motionCleanupTimer);
  if (!motionEnabled()) return;

  // Persistent chrome never moves. Only the route-owned content region receives
  // a short opacity/blur settle; leaf components are staged by the shared motion
  // runtime. No scale or layout-affecting property is used here.
  const target = mode === 'module'
    ? app.querySelector<HTMLElement>('.frame-loading, .frame-error:not([hidden])')
    : resolveShellRouteContentTarget();
  if (!target) return;

  target.dataset.motion = mode;
  target.classList.remove('content-motion-enter');
  entryAnimations.get(target)?.cancel();
  if (typeof target.animate === 'function') {
    const animation = target.animate([
      { opacity: .72, filter: 'blur(1.5px)' },
      { opacity: 1, filter: 'blur(0)' },
    ], { duration: mode === 'module' ? 220 : 260, easing: 'cubic-bezier(.16,1,.3,1)' });
    entryAnimations.set(target, animation);
  }
  motionFrame = window.requestAnimationFrame(() => {
    target.classList.add('content-motion-enter');
    motionCleanupTimer = window.setTimeout(() => {
      target.classList.remove('content-motion-enter');
      delete target.dataset.motion;
      entryAnimations.delete(target);
    }, mode === 'module' ? 280 : 320);
  });
}

const transitionUpdate: TransitionUpdate = (update, kind = 'route') => {
  // v1.30 keeps the shell, sidebar and topbar completely stable. Route changes
  // may briefly soften the replaceable content region before the next renderer
  // runs; state refreshes remain synchronous and never replay route choreography.
  const motion = motionRuntime();
  if (kind === 'route' && motionEnabled() && motion) {
    return motion.exitThen(update, { selector: '#main, .auth-panel', kind: 'route', duration: 105 });
  }
  update();
  return null;
};

function closestShellAction(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const action = target.closest<HTMLElement>(SHELL_ACTION_SELECTOR);
  if (!action || action.matches(':disabled') || action.getAttribute('aria-disabled') === 'true') return null;
  return action;
}

function isNestedControlInsideModuleCard(target: EventTarget | null, card: HTMLElement | null): boolean {
  if (!(target instanceof Element) || !card) return false;
  const nested = target.closest('button,a,input,select,textarea,[role="button"],[role="link"]');
  return Boolean(nested && nested !== card && card.contains(nested));
}

function resolveAppAction(target: EventTarget | null): HTMLElement | null {
  const action = closestShellAction(target);
  if (!action || !reactShellRoot.contains(action)) return null;
  if (action.matches('article[data-open-module]') && isNestedControlInsideModuleCard(target, action)) return null;
  return action;
}

function rememberPointerActivation(event: PointerEvent): void {
  if (event.button !== 0) return;
  pointerActivationTarget = resolveAppAction(event.target) || closestShellAction(event.target);
  pressedFeedbackTarget?.classList.remove('is-pressing');
  pressedFeedbackTarget = pointerActivationTarget?.matches(RIPPLE_ACTION_SELECTOR) ? pointerActivationTarget : null;
  pressedFeedbackTarget?.classList.add('is-pressing');
}

function clearPointerActivation(): void {
  pressedFeedbackTarget?.classList.remove('is-pressing');
  pressedFeedbackTarget = null;
  // Keep pointerActivationTarget through the subsequent click; the next pointerdown replaces it.
}

function isValidActivation(event: MouseEvent, action: HTMLElement | null): boolean {
  if (!action) return false;
  // Keyboard and programmatic clicks have detail === 0 and do not require a pointerdown pair.
  if (event.detail === 0) return true;
  const valid = pointerActivationTarget === action;
  pointerActivationTarget = null;
  return valid;
}

function addInteractionRipple(event: PointerEvent): void {
  if (!motionEnabled() || event.button !== 0) return;
  const host = resolveAppAction(event.target) || closestShellAction(event.target);
  if (!host || !host.matches(RIPPLE_ACTION_SELECTOR)) return;
  const rect = host.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  const size = Math.max(rect.width, rect.height) * 1.7;
  const ripple = document.createElement('span');
  ripple.className = 'interaction-ripple';
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
  host.classList.add('ripple-host');
  host.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

function updatePointerMotion(event: PointerEvent): void {
  if (!motionEnabled() || !finePointerQuery?.matches) return;
  const eventTarget = event.target instanceof Element ? event.target : null;
  const card = eventTarget?.closest<HTMLElement>('.module-card') ?? null;
  const hero = eventTarget?.closest<HTMLElement>('.hero-panel') ?? null;
  const target = card ?? hero;
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  target.style.setProperty('--pointer-x', `${(x * 100).toFixed(1)}%`);
  target.style.setProperty('--pointer-y', `${(y * 100).toFixed(1)}%`);
  if (card) {
    card.style.setProperty('--tilt-x', `${((x - .5) * 3.2).toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${((.5 - y) * 3.2).toFixed(2)}deg`);
  }
}

function resetPointerMotion(event: PointerEvent): void {
  const card = event.target instanceof Element ? event.target.closest<HTMLElement>('.module-card') : null;
  if (!card) return;
  card.style.removeProperty('--tilt-x');
  card.style.removeProperty('--tilt-y');
}

function userDisplayName(): string {
  const metadata = recordOf(auth.user?.user_metadata);
  const metadataName = typeof metadata.display_name === 'string' ? metadata.display_name : '';
  return auth.profile?.display_name || metadataName || auth.user?.email?.split('@')[0] || 'Account';
}


function userInitials(): string {
  const label = userDisplayName().trim();
  const parts = label.split(/\s+/).filter(Boolean);
  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  return (parts.length > 1 ? `${first.charAt(0)}${last.charAt(0)}` : label.slice(0, 2)).toUpperCase();
}

function cloudModeLabel(): string {
  if (!auth.isCloudEnabled) return 'Local workspace';
  if (!auth.isConfigured) return 'Cloud setup required';
  return auth.isAuthenticated ? 'Cloud connected' : 'Sign-in required';
}

function accountControl(): string {
  if (!auth.isCloudEnabled) return '<div class="avatar" title="Local workspace">WM</div>';
  if (!auth.isAuthenticated) return `<button class="${buttonClass({ tone: 'secondary', size: 'lg' }, 'account-pill')}" data-account aria-label="Sign in">${icons.user}<span>Sign in</span></button>`;
  return `<button class="${buttonClass({ tone: 'secondary', size: 'lg' }, 'account-pill')}" data-account-menu-trigger type="button" aria-label="Open account menu for ${esc(userDisplayName())}" aria-haspopup="menu" aria-expanded="false" aria-controls="wmShellAccountMenu"><span class="avatar mini">${esc(userInitials())}</span><span><b>${esc(userDisplayName())}</b><small>${esc(auth.platformRoleLabel)}</small></span></button>`;
}

const shellNavigationGlyphs = Object.freeze({
  collapse: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12.7 4.8-5.2 5.2 5.2 5.2"/></svg>',
  menu: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5.25h14M3 10h14M3 14.75h14"/></svg>',
  chevron: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6.4 7.6 3.6 3.7 3.6-3.7"/></svg>',
  clear: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 6 8 8m0-8-8 8"/></svg>',
  star: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m10 2.8 2.15 4.36 4.81.7-3.48 3.39.82 4.79L10 13.78l-4.3 2.26.82-4.79-3.48-3.39 4.81-.7L10 2.8Z"/></svg>',
  pin: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 3.5h6M8 3.5v4l-2 2.25v1h8v-1L12 7.5v-4M10 10.75V17"/></svg>',
});

function shellActiveResourceKey(active: string): string {
  const route = parseRoute();
  if (route.name === 'app' && route.moduleId) return `app/${route.moduleId}`;
  if (route.name === 'board' && route.boardId) return `boards/${route.boardId}`;
  return active;
}

function navigationButtonMarkup({ id, label, icon, route = id, active, command = false, shortcut = '' }: {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly route?: string;
  readonly active: string;
  readonly command?: boolean;
  readonly shortcut?: string;
}): string {
  const selected = !command && active === id;
  const classes = navigationItemClass({ active: selected }, `nav-item shell-primary-nav-item ${selected ? 'active' : ''}`);
  const activation = command ? 'data-command' : `data-nav="${esc(route)}"`;
  return `<button class="${classes}" ${activation} data-navigation-label="${esc(label)}" aria-label="${esc(label)}" data-shell-tooltip="${esc(label)}" data-shell-tooltip-mode="compact" ${selected ? 'aria-current="page"' : ''}><span class="shell-nav-icon">${icon}</span><b>${esc(label)}</b>${shortcut ? `<kbd>${esc(shortcut)}</kbd>` : ''}</button>`;
}

function shellResourceItemMarkup({ key, label, meta = '', icon, route, active, disabled = false, favorite = false, className = '' }: {
  readonly key: string;
  readonly label: string;
  readonly meta?: string;
  readonly icon: string;
  readonly route: string;
  readonly active: string;
  readonly disabled?: boolean;
  readonly favorite?: boolean;
  readonly className?: string;
}): string {
  const selected = active === key;
  const title = disabled ? `${label} — access restricted` : label;
  return `<button type="button" class="shell-resource-item ${className} ${selected ? 'active' : ''}" ${disabled ? 'disabled aria-disabled="true"' : `data-nav="${esc(route)}"`} data-shell-resource-label="${esc(`${label} ${meta}`.trim().toLowerCase())}" aria-label="${esc(title)}" data-shell-tooltip="${esc(title)}" data-shell-tooltip-mode="compact" ${selected ? 'aria-current="page"' : ''}><span class="shell-resource-icon">${icon}</span><span class="shell-resource-copy"><b>${esc(label)}</b>${meta ? `<small>${esc(meta)}</small>` : ''}</span>${favorite ? `<span class="shell-resource-favorite" aria-hidden="true">${shellNavigationGlyphs.star}</span>` : ''}</button>`;
}

function shellModuleResourceMarkup(mod: WorkManagementModuleDefinition, active: string, { favorite = false }: { readonly favorite?: boolean } = {}): string {
  const allowed = auth.canAccessModule(mod.id);
  const role = auth.moduleRole(mod.id);
  const meta = allowed ? `${mod.eyebrow} · ${role}` : `${mod.eyebrow} · Restricted`;
  return shellResourceItemMarkup({
    key: `app/${mod.id}`,
    label: mod.name,
    meta,
    icon: `<span class="module-mini-icon shell-application-icon ${esc(mod.accent)}">${moduleIcon(mod)}</span>`,
    route: `app/${mod.id}`,
    active,
    disabled: !allowed,
    favorite,
    className: 'shell-application-resource',
  });
}

function shellBoardResourceSnapshot(): Readonly<{ rows: readonly BoardRecord[]; status: 'idle' | 'loading' | 'loaded' | 'error' }> {
  if (!auth.isCloudEnabled || !auth.isAuthenticated) return Object.freeze({ rows: Object.freeze([]), status: 'loaded' });
  const key = boardListQueryKey(auth.user?.id, 'active');
  const rows = platformServices.boards.service.queryClient.getQueryData<readonly BoardRecord[]>(key) ?? Object.freeze([]);
  const query = platformServices.boards.service.queryClient.getQueryState(key);
  const status = query?.status === 'error'
    ? 'error'
    : query?.fetchStatus === 'fetching'
      ? 'loading'
      : query?.status === 'success'
        ? 'loaded'
        : 'idle';
  return Object.freeze({ rows, status });
}

function shellBoardResourceRows(active: string): string {
  if (!auth.isCloudEnabled || !auth.isAuthenticated) return '<div class="shell-resource-empty"><span>Boards</span><small>Sign in to load board resources.</small></div>';
  const resource = shellBoardResourceSnapshot();
  if ((resource.status === 'loading' || resource.status === 'idle') && !resource.rows.length) return '<div class="shell-resource-empty is-loading"><span>Loading boards…</span><small>Fetching your accessible boards.</small></div>';
  if (resource.status === 'error' && !resource.rows.length) return '<div class="shell-resource-empty"><span>Boards unavailable</span><small>Open Boards to retry.</small></div>';
  if (!resource.rows.length) return '<div class="shell-resource-empty"><span>No boards yet</span><small>Create a board from the Boards workspace.</small></div>';
  const route = parseRoute();
  const activeBoardId = route.name === 'board' ? String(route.boardId || '') : '';
  const sorted = [...resource.rows].sort((a, b) => String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || '')));
  const visible = sorted.slice(0, 10);
  if (activeBoardId && !visible.some((board) => String(board.id) === activeBoardId)) {
    const activeBoard = sorted.find((board) => String(board.id) === activeBoardId);
    if (activeBoard) visible.splice(Math.max(0, visible.length - 1), 1, activeBoard);
  }
  return visible.map((board) => shellResourceItemMarkup({
    key: `boards/${board.id}`,
    label: board.name,
    meta: typeof board.item_count === 'number' ? `${board.item_count} item${board.item_count === 1 ? '' : 's'}` : (board.member_role ? `${board.member_role}` : 'Board'),
    icon: icons.boards,
    route: `boards/${board.id}`,
    active,
    className: 'shell-board-resource',
  })).join('');
}

function shellSectionMarkup(id: ShellSectionId, label: string, content: string, count: number | null = null): string {
  const expanded = shellClientState().sections[id];
  const contentId = `shellSection-${id}`;
  return `<section class="shell-nav-section ${expanded ? 'is-expanded' : 'is-collapsed'}" data-shell-section="${id}"><div class="shell-nav-section-header"><button type="button" class="shell-nav-section-toggle" data-shell-section-toggle="${id}" aria-expanded="${expanded}" aria-controls="${contentId}"><span>${esc(label)}</span>${count === null ? '' : `<small>${count}</small>`}<span class="shell-nav-section-chevron">${shellNavigationGlyphs.chevron}</span></button></div><div id="${contentId}" class="shell-nav-section-body" ${expanded ? '' : 'hidden'}>${content}</div></section>`;
}

function sidebarNavMarkup(active: string = 'home'): string {
  const activeKey = shellActiveResourceKey(active);
  const preferences = getPreferences();
  const favorites = modules.filter((mod) => preferences.favorites.includes(mod.id));
  const favoriteMarkup = favorites.length
    ? favorites.map((mod) => shellModuleResourceMarkup(mod, activeKey, { favorite:true })).join('')
    : '<div class="shell-resource-empty"><span>No favorites yet</span><small>Star applications from the Applications workspace.</small></div>';
  const applicationsMarkup = modules.map((mod) => shellModuleResourceMarkup(mod, activeKey, { favorite:preferences.favorites.includes(mod.id) })).join('');
  return `<div class="shell-nav-primary" data-shell-primary-navigation>
    ${navigationButtonMarkup({ id:'home', label:'Applications', icon:icons.grid, route:'', active:activeKey })}
    ${navigationButtonMarkup({ id:'boards', label:'Boards', icon:icons.boards, active:activeKey })}
    ${navigationButtonMarkup({ id:'search', label:'Search', icon:icons.search, active:activeKey, command:true, shortcut:'⌘K' })}
    ${auth.canManageUsers ? navigationButtonMarkup({ id:'users', label:'Users', icon:icons.users, active:activeKey }) : ''}
    ${navigationButtonMarkup({ id:'settings', label:'Settings', icon:icons.settings, active:activeKey })}
    ${auth.isCloudEnabled ? navigationButtonMarkup({ id:'account', label:'Account', icon:icons.user, active:activeKey }) : ''}
  </div>
  <div class="shell-resource-navigation" data-shell-resource-navigation>
    <label class="shell-resource-search" aria-label="Search navigation">${icons.search}<input type="search" data-shell-resource-search value="${esc(shellClientState().resourceSearchQuery)}" placeholder="Search apps and boards" aria-label="Search applications and boards" autocomplete="off"><button type="button" class="shell-resource-search-clear" data-shell-resource-search-clear aria-label="Clear navigation search" ${shellClientState().resourceSearchQuery ? '' : 'hidden'}>${shellNavigationGlyphs.clear}</button></label>
    ${shellSectionMarkup('favorites', 'Favorites', favoriteMarkup, favorites.length)}
    ${shellSectionMarkup('applications', 'Applications', applicationsMarkup, modules.length)}
    ${shellSectionMarkup('boards', 'Boards', `<div class="shell-board-resource-list" data-shell-board-resource-list>${shellBoardResourceRows(activeKey)}</div>`, shellBoardResourceSnapshot().status === 'loaded' ? shellBoardResourceSnapshot().rows.length : null)}
    <div class="shell-resource-filter-empty" data-shell-resource-filter-empty hidden><strong>No navigation matches</strong><small>Try another app or board name.</small></div>
  </div>`;
}

function setShellSectionExpanded(id: ShellSectionId, expanded: boolean): void {
  const sections = workManagementClientState.setShellSection(id, expanded).shell.sections;
  writeShellSectionState(sections);
  const section = shellQuery<HTMLElement>(`[data-shell-section="${id}"]`);
  const toggle = section?.querySelector<HTMLButtonElement>('[data-shell-section-toggle]');
  const body = section?.querySelector<HTMLElement>('.shell-nav-section-body');
  section?.classList.toggle('is-expanded', expanded);
  section?.classList.toggle('is-collapsed', !expanded);
  toggle?.setAttribute('aria-expanded', String(expanded));
  if (body) body.hidden = !expanded;
}

function applyShellResourceFilter(): void {
  const root = shellQuery<HTMLElement>('[data-shell-resource-navigation]');
  if (!root) return;
  const query = shellClientState().resourceSearchQuery.trim().toLowerCase();
  let totalMatches = 0;
  root.querySelectorAll<HTMLElement>('[data-shell-resource-label]').forEach((item) => {
    const match = !query || (item.dataset.shellResourceLabel || '').includes(query);
    item.hidden = !match;
    if (match) totalMatches += 1;
  });
  root.querySelectorAll<HTMLElement>('[data-shell-section]').forEach((section) => {
    const matches = [...section.querySelectorAll<HTMLElement>('[data-shell-resource-label]')].some((item) => !item.hidden);
    const hasResourceRows = section.querySelector('[data-shell-resource-label]') !== null;
    const id = section.dataset.shellSection as ShellSectionId | undefined;
    const body = section.querySelector<HTMLElement>('.shell-nav-section-body');
    const toggle = section.querySelector<HTMLButtonElement>('[data-shell-section-toggle]');
    section.hidden = Boolean(query && hasResourceRows && !matches);
    if (!id) return;
    if (!query) {
      const expanded = shellClientState().sections[id];
      if (body) body.hidden = !expanded;
      toggle?.setAttribute('aria-expanded', String(expanded));
      section.classList.toggle('is-expanded', expanded);
      section.classList.toggle('is-collapsed', !expanded);
      return;
    }
    if (matches) {
      if (body) body.hidden = false;
      toggle?.setAttribute('aria-expanded', 'true');
      section.classList.add('is-expanded');
      section.classList.remove('is-collapsed');
    }
  });
  const empty = root.querySelector<HTMLElement>('[data-shell-resource-filter-empty]');
  if (empty) empty.hidden = !query || totalMatches > 0;
  const clear = root.querySelector<HTMLButtonElement>('[data-shell-resource-search-clear]');
  if (clear) clear.hidden = !query;
}

async function refreshShellBoardResources(): Promise<void> {
  if (!auth.isCloudEnabled || !auth.isAuthenticated) return;
  const frameToken = captureShellFrameOwnership();
  try {
    await platformServices.boards.service.list('active');
  } catch (error: unknown) {
    diagnostics.warn('SHELL_BOARD_RESOURCES_UNAVAILABLE', 'Sidebar board resources could not be loaded.', { message:error instanceof Error ? error.message : String(error ?? '') });
  } finally {
    // Sidebar resource hydration is asynchronous and must never become a second
    // presentation writer. A same-URL route/auth transition can commit a newer
    // lifecycle generation while the board list request is in flight.
    if (!shellFrameStillCurrent(frameToken)) return;
    const list = shellQuery<HTMLElement>('[data-shell-board-resource-list]');
    if (list) {
      list.innerHTML = shellBoardResourceRows(shellActiveResourceKey(parseRoute().name));
      const section = list.closest<HTMLElement>('[data-shell-section="boards"]');
      const count = section?.querySelector<HTMLElement>('.shell-nav-section-toggle small');
      const resource = shellBoardResourceSnapshot();
      if (count && resource.status === 'loaded') count.textContent = String(resource.rows.length);
      applyShellResourceFilter();
      motionRuntime()?.refreshIndicators(list);
    }
  }
}

// Stage F M35: the obsolete imperative shell serializer and its private markup helpers were deleted.

function announceShellNavigationStatus(message: string): void {
  const status = shellQuery<HTMLElement>('[data-shell-navigation-status]');
  if (!status) return;
  status.textContent = '';
  window.requestAnimationFrame(() => { if (status.isConnected) status.textContent = message; });
}

function shellNavigationDesktopInteractive(): boolean {
  return !shellMobileQuery?.matches && !shellTabletQuery?.matches;
}

function syncShellNavigationPresentation(): void {
  const host = shellQuery<HTMLElement>('[data-workspace-shell]');
  const sidebar = shellQuery<HTMLElement>('#primarySidebar');
  const workspace = app.hasAttribute('data-workspace-root') ? app : null;
  const collapse = shellQuery<HTMLButtonElement>('[data-shell-navigation-toggle]');
  const pin = shellQuery<HTMLButtonElement>('[data-shell-navigation-pin]');
  const resizer = shellQuery<HTMLButtonElement>('[data-shell-resizer]');
  const mobileTrigger = shellQuery<HTMLButtonElement>('[data-shell-navigation-mobile-toggle]');
  if (!host || !sidebar || !workspace) return;

  const normalizedWidth = clampShellNavigationWidth(shellNavigation().width);
  if (normalizedWidth !== shellNavigation().width) workManagementClientState.updateShellNavigation({ width: normalizedWidth });
  let navigation = shellNavigation();
  host.dataset.shellNavigationState = navigation.mode;
  host.dataset.shellNavigationPinned = String(shellNavigation().pinned);
  host.dataset.shellNavigationPeek = String(shellNavigation().peek && !shellNavigation().pinned);
  host.toggleAttribute('data-shell-navigation-resizing', shellNavigation().resizing);
  host.style.setProperty('--wm-shell-navigation-user-width', `${shellNavigation().width}px`);

  const mobile = Boolean(shellMobileQuery?.matches);
  const tablet = Boolean(shellTabletQuery?.matches);
  const desktopInteractive = !mobile && !tablet;
  const visuallyExpanded = shellNavigation().mode === 'expanded' || (desktopInteractive && !shellNavigation().pinned && shellNavigation().peek);
  if (collapse) {
    const label = mobile ? 'Close navigation' : (visuallyExpanded ? 'Collapse navigation' : 'Expand navigation');
    collapse.setAttribute('aria-expanded', String(mobile ? shellNavigation().mobileOpen : visuallyExpanded));
    collapse.setAttribute('aria-label', label);
    collapse.dataset.shellTooltip = label;
  }
  if (pin) {
    const label = shellNavigation().pinned ? 'Unpin navigation' : 'Pin navigation';
    pin.setAttribute('aria-pressed', String(shellNavigation().pinned));
    pin.setAttribute('aria-label', label);
    pin.dataset.shellTooltip = label;
    pin.disabled = !desktopInteractive || !visuallyExpanded;
    pin.tabIndex = pin.disabled ? -1 : 0;
  }
  if (resizer) {
    const bounds = shellNavigationWidthBounds();
    const available = desktopInteractive && visuallyExpanded;
    resizer.setAttribute('aria-valuemin', String(bounds.min));
    resizer.setAttribute('aria-valuemax', String(bounds.max));
    resizer.setAttribute('aria-valuenow', String(shellNavigation().width));
    resizer.setAttribute('aria-valuetext', `${shellNavigation().width} pixels`);
    resizer.setAttribute('aria-disabled', String(!available));
    resizer.disabled = !available;
    resizer.tabIndex = available ? 0 : -1;
  }

  const presentationPatch: { mobileOpen?: boolean; peek?: boolean } = {};
  if ((!mobile && navigation.mobileOpen) || (tablet && navigation.peek)) presentationPatch.mobileOpen = false;
  if (!desktopInteractive && navigation.peek) presentationPatch.peek = false;
  if (Object.keys(presentationPatch).length) { workManagementClientState.updateShellNavigation(presentationPatch); navigation = shellNavigation(); }
  host.toggleAttribute('data-shell-mobile-open', mobile && shellNavigation().mobileOpen);
  if (mobileTrigger) {
    const label = mobile && shellNavigation().mobileOpen ? 'Close navigation' : 'Open navigation';
    mobileTrigger.setAttribute('aria-expanded', String(mobile && shellNavigation().mobileOpen));
    mobileTrigger.setAttribute('aria-label', label);
    mobileTrigger.dataset.shellTooltip = label;
  }
  if (mobile) {
    sidebar.setAttribute('aria-hidden', shellNavigation().mobileOpen ? 'false' : 'true');
    sidebar.setAttribute('role', 'dialog');
    sidebar.setAttribute('aria-label', 'Navigation menu');
    if (shellNavigation().mobileOpen) sidebar.setAttribute('aria-modal', 'true');
    else sidebar.removeAttribute('aria-modal');
  } else {
    sidebar.removeAttribute('aria-hidden');
    sidebar.removeAttribute('role');
    sidebar.removeAttribute('aria-modal');
    sidebar.setAttribute('aria-label', 'Primary navigation');
  }
  workspace.inert = mobile && shellNavigation().mobileOpen;
  document.body.classList.toggle('shell-navigation-open', mobile && shellNavigation().mobileOpen);
  document.body.classList.toggle('shell-navigation-resizing', shellNavigation().resizing);
}

function setShellNavigationState(next: ShellNavigationMode): void {
  const navigation = shellNavigation();
  if (next === 'expanded' && !navigation.pinned && shellNavigationDesktopInteractive()) {
    workManagementClientState.updateShellNavigation({ mode: 'compact', peek: true });
  } else {
    workManagementClientState.updateShellNavigation({ mode: next, ...(next === 'compact' ? { peek: false } : {}) });
  }
  writeShellNavigationPreference();
  syncShellNavigationPresentation();
}

function setShellNavigationPinned(pinned: boolean): void {
  workManagementClientState.updateShellNavigation(pinned
    ? { pinned: true, mode: 'expanded', peek: false }
    : { pinned: false, mode: 'compact', peek: shellNavigationDesktopInteractive() });
  writeShellNavigationPreference();
  syncShellNavigationPresentation();
  announceShellNavigationStatus(pinned ? `Navigation pinned at ${shellNavigation().width} pixels.` : 'Navigation unpinned. It will preview when hovered or focused.');
}

function setShellNavigationPeek(open: boolean): void {
  const navigation = shellNavigation();
  const next = Boolean(open && shellNavigationDesktopInteractive() && !navigation.pinned && navigation.mode === 'compact');
  if (navigation.peek === next) return;
  workManagementClientState.updateShellNavigation({ peek: next });
  syncShellNavigationPresentation();
}

function setShellNavigationWidth(next: number, { persist = true, announce = false }: { persist?: boolean; announce?: boolean } = {}): void {
  const clamped = clampShellNavigationWidth(next);
  if (clamped === shellNavigation().width && !announce) return;
  workManagementClientState.updateShellNavigation({ width: clamped });
  if (persist) writeShellNavigationPreference();
  syncShellNavigationPresentation();
  if (announce) announceShellNavigationStatus(`Navigation width ${shellNavigation().width} pixels.`);
}

function resetShellNavigationWidth(): void {
  setShellNavigationWidth(shellNavigationWidthBounds().defaultWidth, { persist:true, announce:true });
}

function startShellNavigationResize(event: PointerEvent, resizer: HTMLButtonElement): void {
  if (!shellNavigationDesktopInteractive() || resizer.disabled) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  const sidebar = shellQuery<HTMLElement>('#primarySidebar');
  if (!sidebar) return;
  event.preventDefault();
  const pointerId = event.pointerId;
  const left = sidebar.getBoundingClientRect().left;
  workManagementClientState.updateShellNavigation({ resizing: true });
  syncShellNavigationPresentation();
  try { resizer.setPointerCapture(pointerId); } catch {}

  const move = (moveEvent: PointerEvent): void => {
    if (moveEvent.pointerId !== pointerId) return;
    setShellNavigationWidth(moveEvent.clientX - left, { persist:false });
  };
  const finish = (upEvent: PointerEvent): void => {
    if (upEvent.pointerId !== pointerId) return;
    resizer.removeEventListener('pointermove', move);
    resizer.removeEventListener('pointerup', finish);
    resizer.removeEventListener('pointercancel', finish);
    try { if (resizer.hasPointerCapture(pointerId)) resizer.releasePointerCapture(pointerId); } catch {}
    workManagementClientState.updateShellNavigation({ resizing: false });
    writeShellNavigationPreference();
    syncShellNavigationPresentation();
    announceShellNavigationStatus(`Navigation width ${shellNavigation().width} pixels.`);
  };
  resizer.addEventListener('pointermove', move);
  resizer.addEventListener('pointerup', finish);
  resizer.addEventListener('pointercancel', finish);
}

function setShellMobileOpen(open: boolean, { restoreFocus = true } = {}): void {
  if (!shellMobileQuery?.matches && open) return;
  const trigger = shellQuery<HTMLButtonElement>('[data-shell-navigation-mobile-toggle]');
  if (open) shellMobileRestoreFocus = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  workManagementClientState.updateShellNavigation({ mobileOpen: open });
  syncShellNavigationPresentation();
  if (open) {
    window.requestAnimationFrame(() => shellQuery<HTMLElement>('#primarySidebar [data-nav], #primarySidebar [data-command]')?.focus());
  } else if (restoreFocus) {
    window.requestAnimationFrame(() => shellMobileRestoreFocus?.isConnected && shellMobileRestoreFocus.focus());
  }
}

function handleShellNavigationKeydown(event: KeyboardEvent): void {
  const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-shell-resizer]') : null;
  if (target && !target.disabled) {
    const bounds = shellNavigationWidthBounds();
    const step = event.shiftKey
      ? shellNavigationTokenPx('--wm-shell-sidebar-resize-step-large', 24)
      : shellNavigationTokenPx('--wm-shell-sidebar-resize-step', 8);
    let next: number | null = null;
    if (event.key === 'ArrowLeft') next = shellNavigation().width - step;
    else if (event.key === 'ArrowRight') next = shellNavigation().width + step;
    else if (event.key === 'Home') next = bounds.min;
    else if (event.key === 'End') next = bounds.max;
    if (next !== null) {
      event.preventDefault();
      setShellNavigationWidth(next, { persist:true, announce:true });
      return;
    }
  }

  if (!shellNavigation().mobileOpen || !shellMobileQuery?.matches) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    setShellMobileOpen(false);
    return;
  }
  if (event.key !== 'Tab') return;
  const sidebar = shellQuery<HTMLElement>('#primarySidebar');
  if (!sidebar) return;
  const focusable = [...sidebar.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])')].filter((element) => element.getClientRects().length > 0);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

let workspaceRouteKey = '';

function syncElementAttributes(target: Element, source: Element): void {
  for (const attribute of [...target.attributes]) {
    if (!source.hasAttribute(attribute.name)) target.removeAttribute(attribute.name);
  }
  for (const attribute of [...source.attributes]) target.setAttribute(attribute.name, attribute.value);
}

function patchWorkspaceContent(workspace: HTMLElement, content: string): void {
  const template = document.createElement('template');
  template.innerHTML = String(content || '').trim();
  const nextTopbar = template.content.querySelector<HTMLElement>('.topbar');
  const nextMain = template.content.querySelector<HTMLElement>('#main');
  const currentTopbar = workspace.querySelector<HTMLElement>(':scope > .topbar');
  const currentMain = workspace.querySelector<HTMLElement>(':scope > #main');
  if (!nextTopbar || !nextMain || !currentTopbar || !currentMain) {
    workspace.innerHTML = content;
    return;
  }
  // Persistent chrome: preserve the topbar/main containers themselves while
  // replacing their route-owned contents. This prevents shell/header remount
  // flashes and keeps motion scoped below the chrome boundary.
  syncElementAttributes(currentTopbar, nextTopbar);
  currentTopbar.innerHTML = nextTopbar.innerHTML;
  syncElementAttributes(currentMain, nextMain);
  currentMain.innerHTML = nextMain.innerHTML;
}
function syncPersistentShell(active: string = 'home', preserveManagement = false, preserveBoardPresentation = false): void {
  const workspaceMode = reactShellRuntime.getSnapshot().workspaceMode;
  const owner = routeLifecycle.getSnapshot().owner;
  if (owner === 'auth') return;
  const managementOwned = owner === 'management';
  const boardOwned = owner === 'boards';
  publishReactShell(active, workspaceMode, preserveManagement || managementOwned, preserveBoardPresentation || boardOwned);
  const nav = shellQuery<HTMLElement>('[data-shell-nav]');
  if (nav) motionRuntime()?.refreshIndicators(nav);
  applyShellResourceFilter();
  syncShellNavigationPresentation();
}

function captureShellFrameOwnership(): PresentationFrameToken {
  return createPresentationFrameToken(location.hash || '#/', routeLifecycle.getSnapshot());
}

function shellFrameStillCurrent(token: PresentationFrameToken): boolean {
  return isPresentationFrameCurrent(
    token,
    location.hash || '#/',
    routeLifecycle.getSnapshot(),
    reactShellRuntime.getSnapshot().mode === 'shell',
  );
}

function focusShellMainContent({ preventScroll = false, owner = null }: { preventScroll?: boolean; owner?: string | null } = {}): boolean {
  const main = resolveShellRouteContentTarget(owner);
  if (!main) return false;
  main.tabIndex = -1;
  try { main.focus({ preventScroll }); } catch { main.focus(); }
  if (!preventScroll) main.scrollIntoView({ block: 'start', inline: 'nearest' });
  return document.activeElement === main;
}

function acknowledgeCurrentPresentationTarget(target: HTMLElement | null): void {
  const owner = routeLifecycle.getSnapshot().owner;
  if (!owner || !target) return;
  presentationReadinessRuntime.acknowledge(owner, target);
}

function publishReactShell(active: string = 'home', workspaceMode: 'page' | 'module' = 'page', preserveManagement = false, preserveBoardPresentation = false): void {
  authenticationUiRuntime.hide();
  if (!preserveManagement) authenticatedManagementUiRuntime.hide();
  if (!preserveBoardPresentation) boardPresentationFacadeRuntime.hide();
  reactShellRuntime.showShell({
    navigationMarkup: sidebarNavMarkup(active),
    online: navigator.onLine,
    cloudModeLabel: cloudModeLabel(),
    platformVersion: PLATFORM_VERSION,
    activeRoute: shellActiveResourceKey(active),
    workspaceMode,
  });
}

function showStandaloneAuthentication(view: Exclude<AuthenticationUIView, 'hidden'>): void {
  authenticatedManagementUiRuntime.hide();
  boardPresentationFacadeRuntime.hide();
  reactShellRuntime.showStandalone(view);
  accountProfileMenu?.close({ restoreFocus:false });
  shellTooltipController.close();
  app.replaceChildren();
  authenticationUiRuntime.show(view);
}

function showAuthenticatedManagement(view: Exclude<AuthenticatedManagementUIView, 'hidden'>): void {
  const frameToken = captureShellFrameOwnership();
  const routeKey = frameToken.routeKey;
  const routeChanged = workspaceRouteKey !== routeKey;
  publishReactShell(view, 'page', true);
  accountProfileMenu?.close({ restoreFocus:false });
  shellTooltipController.close();
  app.replaceChildren();
  workspaceRouteKey = routeKey;
  authenticatedManagementUiRuntime.show(view);
  window.requestAnimationFrame(() => {
    if (!shellFrameStillCurrent(frameToken) || authenticatedManagementUiRuntime.getSnapshot().view !== view || !auth.isAuthenticated) return;
    syncPersistentShell(view, true);
    syncShellNavigationPresentation();
    applyShellResourceFilter();
    void refreshShellBoardResources();
    if (routeChanged) queueEntranceMotion('page');
  });
}

function backendPreflightMarkup(module: M38CapabilityModule): string {
  const preflight = backendCapabilityPreflight.getSnapshot();
  const moduleStatus = preflight.modules[module];
  const detail = moduleStatus?.missing?.length ? moduleStatus.missing.join(', ') : preflight.message;
  const title = preflight.state === 'checking' || preflight.state === 'idle' ? 'Checking backend requirements' : 'Backend capability unavailable';
  const message = preflight.state === 'checking' || preflight.state === 'idle'
    ? 'Work Management is verifying the Supabase services required by this module before it is exposed.'
    : preflight.message;
  return `${topbar('Backend preflight','Runtime configuration and backend capability verification')}
    <main id="main" class="page settings-page" tabindex="-1" data-wm-backend-preflight="${esc(module)}">
      <section class="settings-card"><div class="section-title"><div><span>STAGE G · M38</span><h3>${esc(title)}</h3></div></div>
      <p>${esc(message)}</p><p><strong>Module:</strong> ${esc(module)}</p><p><strong>Environment:</strong> ${esc(preflight.environment)}</p><p><strong>Configuration source:</strong> ${esc(preflight.configurationSource)}</p><p><strong>Project:</strong> ${esc(preflight.projectHost || 'not configured')}</p><p><strong>Code:</strong> ${esc(preflight.code || 'WM_BACKEND_PREFLIGHT_PENDING')}</p>
      <p><strong>Details:</strong> ${esc(detail || 'Pending capability result.')}</p>
      <div class="top-actions"><button class="${secondaryButtonClass}" type="button" data-retry-backend-preflight>Retry backend preflight</button></div></section>
    </main>`;
}

function renderBackendCapabilityPreflight(module: M38CapabilityModule, active: string): void {
  const preflight = backendCapabilityPreflight.getSnapshot();
  renderWorkspace(backendPreflightMarkup(module), active);
  if (preflight.state === 'idle') void backendCapabilityPreflight.ensure(auth).then(() => render());
}

function backendCapabilityRequirement(route: Readonly<{ name: string; moduleId?: string }>): Readonly<{ module: M38CapabilityModule; active: string }> | null {
  if (route.name === 'account') return Object.freeze({ module: 'account', active: 'account' });
  if (route.name === 'settings') return Object.freeze({ module: 'settings', active: 'settings' });
  if (route.name === 'users') return Object.freeze({ module: 'users', active: 'users' });
  if (route.name === 'boards' || route.name === 'board') return Object.freeze({ module: 'boards', active: 'boards' });
  if (route.name === 'app' && route.moduleId && Object.prototype.hasOwnProperty.call(M38_MODULE_REQUIREMENTS, route.moduleId)) return Object.freeze({ module: route.moduleId as M38CapabilityModule, active: 'applications' });
  return null;
}

function renderWorkspace(content: string, active: string = 'home', motionMode: MotionMode = 'page'): void {
  const workspace = app;
  const frameToken = captureShellFrameOwnership();
  const routeKey = frameToken.routeKey;
  const routeChanged = workspaceRouteKey !== routeKey;
  publishReactShell(active, motionMode === 'module' ? 'module' : 'page');
  accountProfileMenu?.close({ restoreFocus:false });
  shellTooltipController.close();
  patchWorkspaceContent(workspace, content);
  const routeMain = workspace.querySelector<HTMLElement>('#main');
  if (routeMain) routeMain.tabIndex = -1;
  acknowledgeCurrentPresentationTarget(routeMain);
  workspaceRouteKey = routeKey;
  window.requestAnimationFrame(() => {
    if (!shellFrameStillCurrent(frameToken)) return;
    syncPersistentShell(active);
    syncShellNavigationPresentation();
    applyShellResourceFilter();
    void refreshShellBoardResources();
  });
  // Entrance motion is route-scoped. State refreshes inside the same route are
  // updated without replaying page animations.
  if (routeChanged && motionMode) queueEntranceMotion(motionMode);
}

function renderBoardWorkspace(content: string, active: string = 'boards', motionMode: MotionMode = 'page'): void {
  const workspace = resolveBoardPresentationHost();
  const frameToken = captureShellFrameOwnership();
  const routeKey = frameToken.routeKey;
  const routeChanged = workspaceRouteKey !== routeKey;
  publishReactShell(active, 'page', false, true);
  accountProfileMenu?.close({ restoreFocus:false });
  shellTooltipController.close();
  app.replaceChildren();
  patchWorkspaceContent(workspace, content);
  const routeMain = workspace.querySelector<HTMLElement>('#main');
  if (routeMain) routeMain.tabIndex = -1;
  acknowledgeCurrentPresentationTarget(routeMain);
  workspaceRouteKey = routeKey;
  window.requestAnimationFrame(() => {
    if (!shellFrameStillCurrent(frameToken) || boardPresentationFacadeRuntime.getSnapshot().view === 'hidden') return;
    syncPersistentShell(active, false, true);
    syncShellNavigationPresentation();
    applyShellResourceFilter();
    void refreshShellBoardResources();
  });
  if (routeChanged && motionMode) queueEntranceMotion(motionMode);
}

function topbar(title: string, subtitle: string = '', actions: string = ''): string {
  return `<header class="topbar"><div><span class="top-eyebrow">WORK MANAGEMENT</span><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><div class="${topActionToolbarClass}">${actions}<span class="connection-pill ${navigator.onLine?'':'offline'}"><i></i>${navigator.onLine?'Online':'Offline'}</span><button class="${iconButtonClass({ tone: 'secondary' }, 'icon-btn mobile-command')}" data-command aria-label="Search">${icons.search}</button>${accountControl()}</div></header>`;
}

const boardsFeature = createBoardsFeature({ auth, renderWorkspace: renderBoardWorkspace, topbar, toast, navigate, icons, diagnostics, queryClient:serverState, service:platformServices.boards.service, commands:platformServices.boards.commands, realtime:platformServices.boards.realtime });
const boardsPresentationFeature = Object.freeze({
  activate(context: unknown): void { boardsFeature.activate?.(context); },
  deactivate(context: unknown): void {
    boardsFeature.deactivate?.(context);
    boardPresentationFacadeRuntime.hide();
    resolveBoardPresentationHost().replaceChildren();
  },
});
const homeFeature = createHomeFeature({
  auth,
  renderWorkspace,
  topbar,
  icons,
  escapeHtml: esc,
  transitionUpdate,
  navigate,
  getInstallPrompt: () => deferredInstall,
  consumeInstallPrompt: () => { deferredInstall = null; },
});
authenticatedManagementUiRuntime.configure({
  navigate,
  toast: (message, tone = 'success') => toast(message, tone),
  onPreferencesChanged: (next) => { prefs = next; homeFeature.syncPreferences(next); },
  resetLauncherFilters: () => homeFeature.resetFilters(),
  setAuthenticationFeedback: authenticationUiRuntime.setFeedback,
});

accountProfileMenu = createAccountProfileMenu({
  auth,
  navigate,
  escapeHtml: esc,
  onPreferencesChanged: (next) => { prefs = next; homeFeature.syncPreferences(next); },
  onSignOut: async () => {
    await auth.signOut({ scope:'local' });
    authenticationUiRuntime.setFeedback('', 'success');
    navigate('login');
  },
});

const commandFeature = createCommandPaletteFeature({
  auth,
  navigate,
  icons,
  escapeHtml: esc,
  toast,
  motionEnabled,
  getUserLabel: () => userDisplayName(),
});

// Runtime feature ownership is registered once. This makes route transitions
// lifecycle-aware without forcing renderers to know about other features.
featureRegistry.register('shell', {}, { kind: 'shell' });
featureRegistry.register('home', homeFeature, { kind: 'native-feature' });
featureRegistry.register('commands', commandFeature, { kind: 'react-feature', boundary: 'src/app/shared-ui/SharedApplicationUI.tsx' });
featureRegistry.register('auth', authenticationUiRuntime, { kind: 'react-feature', boundary: 'src/app/auth/AuthenticationUI.tsx' });
featureRegistry.register('management', authenticatedManagementUiRuntime, { kind: 'react-feature', boundary: 'src/app/management/AuthenticatedManagementUI.tsx', views: Object.freeze(['account', 'settings', 'users']) });
featureRegistry.register('boards', boardsPresentationFeature, { kind: 'react-feature', boundary: 'src/app/boards/BoardPresentationFacade.tsx', engine: 'assets/js/boards-ui.ts' });
featureRegistry.register('modules', moduleRegistry, { kind: 'module-registry' });
featureRegistry.register('module-host', modulePresentationHost, { kind: 'hybrid-module-presentation-host', iframeCompatibility: true, nativeRetirementGate: true });
const featureValidation = featureRegistry.validate();
if (!featureValidation.valid) console.error('[Work Management] Runtime feature registry is incomplete', featureValidation.missing);

function moduleIcon(mod: WorkManagementModuleDefinition | null | undefined): string { if (mod?.icon === 'fuel') return icons.fuel; if (mod?.icon === 'trade') return icons.trade; return icons.clock; }

function moduleBrowserPermissions(mod: WorkManagementModuleDefinition): string {
  return (mod.browserPermissions || []).join('; ');
}

function renderModule(moduleId: string | null | undefined): void {
  workspaceRouteKey = '';
  const mod = moduleById(moduleId);
  if (!mod) return renderNotFound();
  if (mod.status !== 'active') return renderUnavailable(mod);
  if (!auth.canAccessModule(mod.id)) return renderAccessDenied(mod);
  homeFeature.recordRecent(mod.id);
  activeModuleId = mod.id;
  auth.publishIdentityContext();
  const iframeMode = mod.presentationMode === 'same-origin-iframe';
  const actions = `<button class="module-action" data-command title="Search workspace">${icons.search}<span>Search</span></button><button class="module-action" data-reload-frame title="Reload module">${icons.reload}<span>Reload</span></button>`;
  const moduleSurface = iframeMode
    ? `<iframe id="moduleFrame" title="${esc(mod.name)}" src="${esc(mod.route)}" ${moduleBrowserPermissions(mod) ? `allow="${esc(moduleBrowserPermissions(mod))}" ` : ''}referrerpolicy="same-origin"></iframe>`
    : `<section id="nativeModuleHost" class="native-module-host" data-native-module="${esc(mod.id)}" aria-label="${esc(mod.name)}"></section>`;
  const loadingCopy = iframeMode ? 'Loading the isolated compatibility runtime.' : 'Mounting the host-native module runtime.';
  const content = `<header class="module-topbar"><button class="back-btn" data-nav="">${icons.back}<span>Work Management</span></button><div class="module-identity"><div class="module-mini-icon ${esc(mod.accent)}">${moduleIcon(mod)}</div><div><strong>${esc(mod.name)}</strong><small>${esc(mod.eyebrow)} · v${esc(mod.version)}</small></div></div><div class="module-actions">${actions}</div></header>
  <main id="main" class="module-stage"><div class="frame-loading" id="frameLoading"><span></span><strong>Opening ${esc(mod.name)}</strong><small>${loadingCopy}</small></div>${moduleSurface}<div class="frame-error" id="frameError" hidden><strong>Module is taking longer than expected.</strong><p>Retry the authenticated module runtime without leaving Work Management.</p><div><button class="secondary-btn" data-reload-frame>Retry</button></div></div></main>`;
  renderWorkspace(content, `app/${mod.id}`, 'module');
  runtimeClient.setContext({ route: 'app', moduleId: mod.id, authenticated: auth.isAuthenticated });
  if (iframeMode) {
    moduleFrame = document.querySelector<HTMLIFrameElement>('#moduleFrame');
    if (!moduleFrame) throw new Error(`Embedded module frame for ${mod.id} was not created.`);
    modulePresentationHost.attachIframe(moduleFrame, mod);
    monitorModuleFrameLoad();
    return;
  }
  moduleFrame = null;
  const nativeHost = document.querySelector<HTMLElement>('#nativeModuleHost');
  if (!nativeHost) throw new Error(`Native module host for ${mod.id} was not created.`);
  const loading = document.querySelector<HTMLElement>('#frameLoading');
  void modulePresentationHost.mountNative(nativeHost, mod).then((mounted) => {
    if (!mounted) return;
    loading?.classList.add('done');
    window.setTimeout(() => { if (loading) loading.hidden = true; }, 180);
    runtimeClient.emit('module:loaded', { moduleId: activeModuleId, presentationMode: 'native-host' });
  }).catch((error: unknown) => {
    if (loading) loading.hidden = true;
    const frameError = document.querySelector<HTMLElement>('#frameError');
    if (frameError) frameError.hidden = false;
    diagnostics.error('NATIVE_MODULE_MOUNT_FAILURE', error instanceof Error ? error.message : 'Native module mount failed.', { moduleId: mod.id });
  });
}

function monitorModuleFrameLoad(): void {
  if (!moduleFrame) return;
  const loading = document.querySelector<HTMLElement>('#frameLoading');
  const error = document.querySelector<HTMLElement>('#frameError');
  if (moduleLoadTimer !== null) window.clearTimeout(moduleLoadTimer);
  loading?.classList.remove('done');
  moduleFrame.classList.remove('module-frame-ready');
  if (loading) loading.hidden = false;
  if (error) error.hidden = true;
  let completed = false;
  const onLoad = () => {
    completed = true;
    if (moduleLoadTimer !== null) window.clearTimeout(moduleLoadTimer);
    moduleLoadTimer = null;
    if (error) error.hidden = true;
    moduleFrame?.classList.add('module-frame-ready');
    moduleHost.publishIdentity();
    runtimeClient.emit('module:loaded', { moduleId: activeModuleId });
    loading?.classList.add('done');
    window.setTimeout(() => { if (loading) loading.hidden = true; }, 280);
  };
  moduleFrame.addEventListener('load', onLoad, { once: true });
  moduleLoadTimer = window.setTimeout(() => {
    moduleLoadTimer = null;
    if (completed) return;
    loading?.classList.add('done');
    if (loading) loading.hidden = true;
    if (error) error.hidden = false;
  }, 10000);
}

function renderUnavailable(mod: WorkManagementModuleDefinition): void {
  renderWorkspace(`${topbar(mod.name,'This module is not currently available.')}<main id="main" class="page"><div class="empty"><strong>—</strong><h2>${esc(mod.name)} is ${esc(mod.status)}</h2><button class="${primaryButtonClass}" data-nav="">Return home</button></div></main>`, 'unavailable', 'page');
}

function renderNotFound(): void {
  renderWorkspace(`${topbar('Not found','The requested workspace route does not exist.')}<main id="main" class="page"><div class="empty"><strong>404</strong><h2>Workspace not found</h2><button class="${primaryButtonClass}" data-nav="">Return home</button></div></main>`, 'not-found', 'page');
}


function renderRouteFailure(error: WorkManagementError, context: RuntimeBoundaryContext = {}): void {
  const code = error?.code || 'WM_ROUTE_FAILURE';
  const message = error?.message || 'This workspace could not be opened.';
  renderWorkspace(`${topbar('Workspace unavailable','A recoverable application error interrupted this route.')}<main id="main" class="page"><div class="empty"><strong>!</strong><h2>We couldn’t open this workspace</h2><p>${esc(message)}</p><small class="error-reference">Reference: ${esc(code)}</small><div class="empty-actions"><button class="${primaryButtonClass}" data-retry-route>Try again</button><button class="${secondaryButtonClass}" data-nav="">Return home</button></div></div></main>`, 'route-error', 'page');
  diagnostics.error('ROUTE_RENDER_FAILURE', message, { code, route:context.route || parseRoute().name, owner:context.owner || null });
}

function renderAccessDenied(mod: WorkManagementModuleDefinition): void {
  renderWorkspace(`${topbar('Access restricted', 'Your account is not authorized for this application.')}<main id="main" class="page"><div class="empty"><strong>${icons.lock}</strong><h2>${esc(mod.name)} is restricted</h2><p>Your current cloud role is ${esc(auth.moduleRole(mod.id))}. Contact a platform administrator if access is required.</p><button class="${primaryButtonClass}" data-nav="">Return to applications</button></div></main>`, 'access-denied', 'page');
}

function renderRouteAuthorizationDenied(route: ReturnType<typeof parseRoute>): void {
  if (route.name === 'app' && route.moduleId) {
    const mod = modules.find((entry) => entry.id === route.moduleId);
    if (mod) return renderAccessDenied(mod);
  }
  renderWorkspace(`${topbar('Access restricted', 'Your current role does not authorize this route.')}<main id="main" class="page"><div class="empty"><strong>${icons.lock}</strong><h2>Administrator access required</h2><p>This route is protected by the current platform role and module-assignment policy. Refresh access after an administrator changes your permissions.</p><button class="${primaryButtonClass}" data-nav="">Return to applications</button></div></main>`, 'access-denied', 'page');
}

function toast(message: string, tone: ToastTone = 'success'): void {
  sharedApplicationUiRuntime.pushToast(message, tone);
}

function deactivateModuleRoute(): void {
  if (moduleLoadTimer !== null) {
    window.clearTimeout(moduleLoadTimer);
    moduleLoadTimer = null;
  }
  modulePresentationHost.detach();
  moduleFrame = null;
  activeModuleId = null;
}

function rememberAuthReturnRoute(): void {
  const route = parseRoute();
  if (route.name === 'login' || route.name === 'register' || route.name === 'verify') return;
  try { sessionStorage.setItem('wm.platform.auth.return-to.v1', location.hash || '#/'); } catch {}
}

const routeErrorBoundary = createRuntimeErrorBoundary({ diagnostics, onError:renderRouteFailure });

function prepareRoutePresentationTransition(): void {
  presentationReadinessRuntime.cancel();
  commandFeature.deactivate();
  accountProfileMenu?.close({ restoreFocus: false });
  shellTooltipController.close();
  globalOverlayRuntime.reset();
  if (shellNavigation().mobileOpen) setShellMobileOpen(false, { restoreFocus: false });
}

function commitRoutePresentationTransition(transition: Readonly<{ revision: number; route: Readonly<{ name: string }>; owner: string }>): void {
  runtimeClient.emit('route:lifecycle-committed', { revision: transition.revision, route: transition.route.name, owner: transition.owner });
  const requestCommittedRouteFocus = (): boolean => presentationReadinessRuntime.requestFocus({
    revision: transition.revision,
    owner: transition.owner as Parameters<typeof presentationReadinessRuntime.acknowledge>[0],
    isCurrent: (revision) => routeLifecycle.isCurrent(revision),
    preventScroll: false,
  });
  requestCommittedRouteFocus();

  // Overlay teardown is React-owned and can finish after the imperative route
  // renderer commits. If removal of the previously focused overlay control
  // drops document focus back to BODY, reconcile once on the next frame. The
  // generation guard prevents stale routes from stealing focus and the fallback
  // only runs when no interactive element owns focus.
  window.requestAnimationFrame(() => {
    if (!routeLifecycle.isCurrent(transition.revision)) return;
    const active = document.activeElement;
    if (active && active !== document.body && active !== document.documentElement) return;
    requestCommittedRouteFocus();
  });
}

function resolveBackendCapabilityPresentation({ route, decision, defaultOwner, defaultRenderer }: Parameters<NonNullable<Parameters<typeof createRouteController>[0]['resolvePresentation']>>[0]) {
  if (decision.kind !== 'allow') return Object.freeze({ owner: defaultOwner, renderer: defaultRenderer });
  const requirement = backendCapabilityRequirement(route);
  if (!requirement || backendCapabilityPreflight.moduleReady(requirement.module)) return Object.freeze({ owner: defaultOwner, renderer: defaultRenderer });
  return Object.freeze({
    owner: 'shell' as const,
    renderer: () => renderBackendCapabilityPreflight(requirement.module, requirement.active),
  });
}

const routeController = createRouteController({
  auth,
  parseRoute,
  navigate,
  runtimeClient,
  featureRegistry,
  moduleHost,
  lifecycle: routeLifecycle,
  resolvePresentation: resolveBackendCapabilityPresentation,
  beforeTransition: prepareRoutePresentationTransition,
  afterTransition: commitRoutePresentationTransition,
  deactivateModule: deactivateModuleRoute,
  rememberReturnRoute: rememberAuthReturnRoute,
  errorBoundary: routeErrorBoundary,
  routePolicy: platformServices.routing,
  renderers: {
    home: () => homeFeature.render(),
    settings: () => showAuthenticatedManagement('settings'),
    account: () => showAuthenticatedManagement('account'),
    users: () => showAuthenticatedManagement('users'),
    boards: () => { boardPresentationFacadeRuntime.showBoards(); return boardsFeature.renderBoards(); },
    board: (route) => { if (!route.boardId) return renderNotFound(); boardPresentationFacadeRuntime.showBoard(route.boardId); return boardsFeature.renderBoard(route.boardId); },
    login: () => showStandaloneAuthentication('login'),
    register: () => showStandaloneAuthentication('register'),
    verify: () => showStandaloneAuthentication('verify'),
    wait: () => showStandaloneAuthentication('boot'),
    app: (route) => route.moduleId ? renderModule(route.moduleId) : renderNotFound(),
    disabled: () => showStandaloneAuthentication('disabled'),
    'auth-recovery': () => { rememberAuthReturnRoute(); showStandaloneAuthentication('recovery'); },
    forbidden: (route) => renderRouteAuthorizationDenied(route),
    'not-found': () => renderNotFound(),
  },
});

function render(): void {
  routeController.render();
  if (swUpdate && !updateDismissed) sharedApplicationUiRuntime.showUpdate();
}

reactShellRoot.addEventListener('click', async (event) => {
  // Backdrop closing is intentionally limited to the backdrop itself. Clicking dialog content is inert.
  if (await commandFeature.handleAction(null, event.target instanceof Element ? event.target : null)) return;

  const action = resolveAppAction(event.target);
  if (!action || !isValidActivation(event, action)) return;

  if (action.matches('a[data-shell-skip]')) { event.preventDefault(); focusShellMainContent(); return; }
  if (action.matches('button[data-retry-route]')) { render(); return; }
  if (action.matches('button[data-retry-backend-preflight]')) { void backendCapabilityPreflight.ensure(auth, { force:true }).then(() => render()); return; }
  if (action.matches('button[data-shell-navigation-toggle]')) {
    if (shellMobileQuery?.matches) setShellMobileOpen(false);
    else if (!shellNavigation().pinned && shellNavigation().peek) setShellNavigationPeek(false);
    else setShellNavigationState(shellNavigation().mode === 'expanded' ? 'compact' : 'expanded');
    return;
  }
  if (action.matches('button[data-shell-navigation-pin]')) { setShellNavigationPinned(!shellNavigation().pinned); return; }
  if (action.matches('button[data-shell-navigation-mobile-toggle]')) { setShellMobileOpen(!shellNavigation().mobileOpen); return; }
  if (action.matches('button[data-shell-navigation-dismiss]')) { setShellMobileOpen(false); return; }
  if (action.matches('button[data-shell-section-toggle]')) {
    const id = action.dataset.shellSectionToggle as ShellSectionId | undefined;
    if (id && Object.prototype.hasOwnProperty.call(shellClientState().sections, id)) setShellSectionExpanded(id, !shellClientState().sections[id]);
    return;
  }
  if (action.matches('button[data-shell-resource-search-clear]')) {
    workManagementClientState.setShellResourceSearchQuery('');
    const input = shellQuery<HTMLInputElement>('[data-shell-resource-search]');
    if (input) input.value = '';
    applyShellResourceFilter();
    input?.focus();
    return;
  }
  if (action.matches('button[data-nav]')) { if (shellNavigation().mobileOpen) setShellMobileOpen(false, { restoreFocus:false }); if (!shellNavigation().pinned) setShellNavigationPeek(false); navigate(action.dataset.nav ?? ''); return; }
  if (action.matches('[data-open-module]')) { const moduleId = action.dataset.openModule; if (moduleId) navigate(`app/${moduleId}`); return; }
  if (await commandFeature.handleAction(action)) return;
  if (await homeFeature.handleAction(action)) return;
  if (action.matches('button[data-reload-frame]')) {
    if (moduleFrame) {
      monitorModuleFrameLoad();
      try { moduleFrame.contentWindow?.location?.reload?.(); }
      catch { moduleFrame.src = moduleFrame.src; }
    } else if (activeModuleId) {
      renderModule(activeModuleId);
    }
    return;
  }
  if (action.matches('button[data-account-menu-trigger]')) { accountProfileMenu?.toggle(action as HTMLButtonElement); return; }
  if (action.matches('button[data-account]')) { navigate(auth.isAuthenticated ? 'account' : 'login'); return; }
});

reactShellRoot.addEventListener('pointerdown', (event) => {
  const resizer = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-shell-resizer]') : null;
  if (resizer) startShellNavigationResize(event, resizer);
});

reactShellRoot.addEventListener('dblclick', (event) => {
  const resizer = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-shell-resizer]') : null;
  if (!resizer || resizer.disabled) return;
  event.preventDefault();
  resetShellNavigationWidth();
});

reactShellRoot.addEventListener('pointerover', (event) => {
  if (shellNavigation().pinned || !shellNavigationDesktopInteractive()) return;
  const sidebar = event.target instanceof Element ? event.target.closest<HTMLElement>('#primarySidebar') : null;
  const fromSidebar = event.relatedTarget instanceof Element ? event.relatedTarget.closest<HTMLElement>('#primarySidebar') : null;
  if (sidebar && !fromSidebar) setShellNavigationPeek(true);
});

reactShellRoot.addEventListener('pointerout', (event) => {
  if (shellNavigation().pinned || shellNavigation().resizing || !shellNavigationDesktopInteractive()) return;
  const sidebar = event.target instanceof Element ? event.target.closest<HTMLElement>('#primarySidebar') : null;
  const toSidebar = event.relatedTarget instanceof Element ? event.relatedTarget.closest<HTMLElement>('#primarySidebar') : null;
  if (!sidebar || toSidebar) return;
  if (document.activeElement instanceof Element && sidebar.contains(document.activeElement)) return;
  setShellNavigationPeek(false);
});

reactShellRoot.addEventListener('focusin', (event) => {
  if (shellNavigation().pinned || !shellNavigationDesktopInteractive()) return;
  if (event.target instanceof Element && event.target.closest('#primarySidebar')) setShellNavigationPeek(true);
});

reactShellRoot.addEventListener('focusout', (event) => {
  if (shellNavigation().pinned || !shellNavigationDesktopInteractive()) return;
  const sidebar = event.target instanceof Element ? event.target.closest<HTMLElement>('#primarySidebar') : null;
  if (!sidebar) return;
  window.requestAnimationFrame(() => {
    if (!sidebar.isConnected) return;
    const focusInside = document.activeElement instanceof Element && sidebar.contains(document.activeElement);
    if (!focusInside && !sidebar.matches(':hover')) setShellNavigationPeek(false);
  });
});

reactShellRoot.addEventListener('keydown', (event) => {
  handleShellNavigationKeydown(event);
  homeFeature.handleKeydown(event);
});

document.addEventListener('input', (event) => {
  if (event.target instanceof HTMLInputElement && event.target.matches('[data-shell-resource-search]')) {
    workManagementClientState.setShellResourceSearchQuery(event.target.value);
    applyShellResourceFilter();
    return;
  }
  if (commandFeature.handleInput(event.target)) return;
  if (homeFeature.handleInput(event.target)) return;
});


document.addEventListener('keydown', (event) => {
  commandFeature.handleKeydown(event);
});

window.addEventListener('resize', () => accountProfileMenu?.reposition(), { passive:true });
window.addEventListener('scroll', () => accountProfileMenu?.reposition(), { passive:true, capture:true });

function handleStorageChange(event: StorageEvent): void {
  const route = parseRoute();
  if (event.key === 'wm.platform.auth.session.v1') { auth.init({ forceStorage:true }).then(() => render()); return; }
  if (event.key === SHELL_NAVIGATION_STORAGE_KEY) {
    const next = readShellNavigationPreference();
    workManagementClientState.hydratePersistentShell({ navigation: { mode: next.state, width: next.width, pinned: next.pinned } });
    workManagementClientState.updateShellNavigation({ peek: false });
    syncShellNavigationPresentation();
    return;
  }
  if (event.key === 'wm.platform.preferences.v1') {
    prefs = getPreferences(); applyTheme(prefs.theme); applyDensity(prefs.compact);
    if (route.name === 'home' || route.name === 'settings') render();
    else syncPersistentShell(route.name);
    return;
  }
  if (route.name === 'home' && event.key?.startsWith('timetracker.')) homeFeature.render();
}

function handleConnectivityChange(): void {
  const route = parseRoute();
  if (route.name === 'home' || route.name === 'settings') render();
  else toast(navigator.onLine ? 'Connection restored.' : 'You are offline. Cached applications remain available locally.', navigator.onLine ? 'success' : 'warning');
}

async function revalidateSessionOnResume(): Promise<void> {
  if (document.visibilityState === 'hidden' || !auth.hasSession) return;
  const token = await auth.ensureValidSession({ reason:'resume' });
  if (!token) { authenticationUiRuntime.setFeedback('Your session expired or was revoked. Sign in again.', 'warning'); navigate('login'); }
}
installApplicationLifecycle({
  hashchange: () => { transitionUpdate(() => { render(); }, 'route'); },
  storage: handleStorageChange,
  online: handleConnectivityChange,
  offline: handleConnectivityChange,
  beforeinstallprompt: (event) => { event.preventDefault(); deferredInstall = event; if (parseRoute().name === 'home') homeFeature.render(); },
  appinstalled: () => { deferredInstall = null; toast('Work Management installed.'); },
  focus: revalidateSessionOnResume,
  visibilitychange: () => { if (document.visibilityState === 'visible') revalidateSessionOnResume(); },
  error: (event) => { const error=event.error||new Error(event.message||'Unhandled error'); diagnostics.error('WINDOW_ERROR',error.message,{route:parseRoute().name,stack:error.stack?.split('\n').slice(0,4).join('\n')||null}); console.error('[Work Management] Unhandled error',error); },
  unhandledrejection: (event) => { const error=event.reason instanceof Error?event.reason:new Error(String(event.reason||'Unhandled rejection')); diagnostics.error('UNHANDLED_REJECTION',error.message,{route:parseRoute().name,stack:error.stack?.split('\n').slice(0,4).join('\n')||null}); console.error('[Work Management] Unhandled rejection',error); },
});

shellMobileQuery?.addEventListener('change', () => syncShellNavigationPresentation());
shellTabletQuery?.addEventListener('change', () => syncShellNavigationPresentation());

document.addEventListener('pointerdown', (event) => {
  rememberPointerActivation(event);
  addInteractionRipple(event);
}, { passive: true, capture: true });
document.addEventListener('pointerup', clearPointerActivation, { passive: true, capture: true });
document.addEventListener('pointercancel', clearPointerActivation, { passive: true, capture: true });
document.addEventListener('pointermove', updatePointerMotion, { passive: true });
document.addEventListener('pointerout', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const related = event.relatedTarget instanceof Element ? event.relatedTarget : null;
  if (target && related && target.closest('.module-card') === related.closest('.module-card')) return;
  resetPointerMotion(event);
}, { passive: true });

async function bootstrap(): Promise<void> {
  reactShellRuntime.showStandalone(auth.hasAuthCallback ? 'verify' : 'boot');
  app.replaceChildren();
  if (auth.hasAuthCallback) authenticationUiRuntime.showCallbackProgress();
  else authenticationUiRuntime.show('boot');
  await auth.init();
  authenticationUiRuntime.completeCallbackProgress();
  if (auth.state?.notice) {
    authenticationUiRuntime.setFeedback(auth.state.notice, 'success');
  } else if (auth.state?.error && !auth.isAuthenticated) {
    authenticationUiRuntime.setFeedback(auth.state.error, 'warning');
  }
  render();
}

let lastAuthorizationFingerprint = authorizationFingerprint(auth);

function revalidateAuthorizationContext(): void {
  if (!auth.isAuthenticated || document.hidden) return;
  void auth.revalidateAccessContext().catch((error: unknown) => {
    const normalized = platformServices.errors.normalize(error, { operation: 'auth.revalidate-access' });
    diagnostics.warn('AUTH_REVALIDATION_FAILURE', normalized.message, { code: normalized.code, retryable: normalized.retryable });
  });
}

auth.addEventListener(AUTH_EVENT, () => {
  if (!auth.isAuthenticated) backendCapabilityPreflight.reset();
  else if (backendCapabilityPreflight.getSnapshot().state === 'idle') void backendCapabilityPreflight.ensure(auth).then(() => render());
  const reconciliation = reconcileAuthorizationContext({
    auth,
    previousFingerprint: lastAuthorizationFingerprint,
    serverState,
    clientState,
    moduleHost,
    activeModuleId,
    deactivateModule: deactivateModuleRoute,
    diagnostics,
  });
  lastAuthorizationFingerprint = reconciliation.fingerprint;

  const route = parseRoute();
  if (reconciliation.changed || ['home','settings','account','users','login','register','verify'].includes(route.name)) render();
});

window.addEventListener('focus', revalidateAuthorizationContext, { passive: true });
document.addEventListener('visibilitychange', () => { if (!document.hidden) revalidateAuthorizationContext(); }, { passive: true });

bootstrap();
