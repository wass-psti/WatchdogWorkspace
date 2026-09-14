import type { FeatureId } from '../../../src/types/manifest.ts';
import { applicationRouteSchema } from '../../../src/runtime-schemas/index.ts';
import type { ApplicationRoute, AuthRuntimeStatus, FeatureRegistryPort, ModuleHostPort, RouteAccessDecision, RouteErrorBoundaryPort, RouteName, RoutePolicyService, RuntimeClientPort } from '../../../src/platform/contracts/routing.ts';
import type { RouteLifecycleCoordinator, RouteLifecycleTransition } from '../../../src/platform/contracts/route-lifecycle.ts';
import { resolveRoutePresentationOwner } from './route-lifecycle.ts';

interface RouteAuthPort {
  readonly isAuthenticated: boolean;
  readonly canManageUsers: boolean;
  readonly state: Readonly<{ initialized: boolean; status: AuthRuntimeStatus }>;
  canAccessModule(moduleId: string): boolean;
}

type RouteRenderer = (route: ApplicationRoute) => unknown;
type RouteRenderers = Partial<Record<RouteName | 'forbidden' | 'auth-recovery' | 'wait', RouteRenderer>>;
type RoutePresentationResolution = Readonly<{ owner: FeatureId; renderer: RouteRenderer | undefined }>;
type RoutePresentationResolver = (context: Readonly<{ route: ApplicationRoute; decision: RouteAccessDecision; defaultOwner: FeatureId; defaultRenderer: RouteRenderer | undefined }>) => RoutePresentationResolution;

export interface RoutePresentationTransition extends RouteLifecycleTransition {
  readonly decision: RouteAccessDecision['kind'];
}

export interface RouteControllerDependencies {
  readonly auth: RouteAuthPort;
  readonly parseRoute: () => ApplicationRoute;
  readonly navigate: (path: string) => unknown;
  readonly runtimeClient: RuntimeClientPort;
  readonly featureRegistry: FeatureRegistryPort;
  readonly moduleHost: ModuleHostPort;
  readonly renderers: RouteRenderers;
  readonly routePolicy: RoutePolicyService;
  readonly lifecycle?: RouteLifecycleCoordinator | null;
  readonly resolvePresentation?: RoutePresentationResolver | null;
  readonly beforeTransition?: ((transition: RoutePresentationTransition) => void) | null;
  readonly afterTransition?: ((transition: RoutePresentationTransition) => void) | null;
  readonly deactivateModule?: (() => void) | null;
  readonly rememberReturnRoute?: (() => void) | null;
  readonly errorBoundary?: RouteErrorBoundaryPort | null;
}

export interface RouteController {
  render(): boolean;
  dispose(): void;
  current(): ApplicationRoute | null;
  owner(): FeatureId | null;
}

export function createRouteController({
  auth,
  parseRoute,
  navigate,
  runtimeClient,
  featureRegistry,
  moduleHost,
  renderers,
  routePolicy,
  lifecycle = null,
  resolvePresentation = null,
  beforeTransition = null,
  afterTransition = null,
  deactivateModule = null,
  rememberReturnRoute = null,
  errorBoundary = null,
}: RouteControllerDependencies): RouteController {
  let activeOwner: FeatureId | null = null;
  let activeRoute: ApplicationRoute | null = null;

  function transitionOwnership(route: ApplicationRoute, nextOwner: FeatureId): void {
    if (activeOwner === nextOwner) {
      activeRoute = route;
      return;
    }
    const previousOwner = activeOwner;
    const previousRoute = activeRoute;
    if (previousOwner) featureRegistry.get(previousOwner)?.implementation?.deactivate?.({ from: previousRoute, to: route });
    activeOwner = null;
    activeRoute = null;
    featureRegistry.get(nextOwner)?.implementation?.activate?.({ from: previousRoute, to: route });
    activeOwner = nextOwner;
    activeRoute = route;
  }

  function detachEmbeddedPresentation(): void {
    moduleHost.detach();
    deactivateModule?.();
  }

  function renderDecision(route: ApplicationRoute, decision: RouteAccessDecision, renderer: RouteRenderer | undefined): boolean {
    const defaultOwner = resolveRoutePresentationOwner(decision, route, (routeName) => featureRegistry.ownerForRoute(routeName));
    const presentation = resolvePresentation?.({ route, decision, defaultOwner, defaultRenderer: renderer }) ?? Object.freeze({ owner: defaultOwner, renderer });
    const nextOwner = presentation.owner;
    const activeRenderer = presentation.renderer;
    const baseTransition = lifecycle?.begin(route, nextOwner) ?? Object.freeze({ revision: 0, route, owner: nextOwner, changed: activeOwner !== nextOwner || activeRoute?.name !== route.name || activeRoute?.moduleId !== route.moduleId || activeRoute?.boardId !== route.boardId });
    const transition: RoutePresentationTransition = Object.freeze({ ...baseTransition, decision: decision.kind });
    if (transition.changed) beforeTransition?.(transition);

    const invoke = (): true => {
      transitionOwnership(route, nextOwner);
      activeRenderer?.(route);
      return true;
    };
    const result = errorBoundary
      ? errorBoundary.run({ scope: 'route', operation: `route.${route.name}`, route: route.name, owner: nextOwner, lifecycleRevision: transition.revision }, invoke)
      : invoke();

    if (result !== true) {
      lifecycle?.fail(transition.revision);
      return true;
    }
    lifecycle?.commit(transition.revision);
    if (transition.changed) afterTransition?.(transition);
    return true;
  }

  function render(): boolean {
    const parsedRoute = applicationRouteSchema.safeParse(parseRoute());
    const route: ApplicationRoute = parsedRoute.success ? parsedRoute.data as ApplicationRoute : { name: 'not-found' };
    runtimeClient.setContext({ route: route.name, moduleId: route.moduleId ?? null, boardId: route.boardId ?? null, authenticated: auth.isAuthenticated });

    const decision = routePolicy.decide({
      route,
      initialized: auth.state.initialized,
      status: auth.state.status,
      authenticated: auth.isAuthenticated,
      canManageUsers:auth.canManageUsers,
      canAccessModule:(moduleId)=>auth.canAccessModule(moduleId),
    });

    const embeddedPresentationAllowed = decision.kind === 'allow' && route.name === 'app';
    if (!embeddedPresentationAllowed) detachEmbeddedPresentation();

    if (decision.kind === 'redirect') {
      if (decision.rememberReturnRoute) rememberReturnRoute?.();
      navigate(decision.target);
      return false;
    }
    if (decision.kind === 'wait') return renderDecision(route, decision, renderers.wait);
    if (decision.kind === 'render-disabled') return renderDecision(route, decision, renderers.disabled);
    if (decision.kind === 'render-auth-recovery') return renderDecision(route, decision, renderers['auth-recovery']);
    if (decision.kind === 'render-forbidden') return renderDecision(route, decision, renderers.forbidden);
    return renderDecision(route, decision, renderers[route.name] ?? renderers['not-found']);
  }

  function dispose(): void {
    detachEmbeddedPresentation();
    if (activeOwner) featureRegistry.get(activeOwner)?.implementation?.deactivate?.({ from: activeRoute, to: null });
    activeOwner = null;
    activeRoute = null;
    lifecycle?.dispose();
  }

  return Object.freeze({ render, dispose, current: () => activeRoute, owner: () => activeOwner } satisfies RouteController);
}
