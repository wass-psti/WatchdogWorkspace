import type { FeatureId } from '../../../src/types/manifest.ts';
import type { ApplicationRoute, RouteAccessDecision } from '../../../src/platform/contracts/routing.ts';
import type { RouteLifecycleCoordinator, RouteLifecycleSnapshot, RouteLifecycleTransition } from '../../../src/platform/contracts/route-lifecycle.ts';

const EMPTY: RouteLifecycleSnapshot = Object.freeze({
  phase: 'idle',
  revision: 0,
  route: null,
  owner: null,
  previousRoute: null,
  previousOwner: null,
});

const sameRoute = (left: ApplicationRoute | null, right: ApplicationRoute | null): boolean =>
  left?.name === right?.name
  && (left?.moduleId ?? null) === (right?.moduleId ?? null)
  && (left?.boardId ?? null) === (right?.boardId ?? null);


export function resolveRoutePresentationOwner(
  decision: RouteAccessDecision,
  route: ApplicationRoute,
  ownerForRoute: (routeName: string) => FeatureId | null,
): FeatureId {
  if (decision.kind === 'render-disabled' || decision.kind === 'render-auth-recovery' || decision.kind === 'wait') return 'auth';
  if (decision.kind === 'render-forbidden') return 'shell';
  return ownerForRoute(route.name) ?? 'shell';
}

export function createRouteLifecycleCoordinator(): RouteLifecycleCoordinator {
  let snapshot = EMPTY;
  const listeners = new Set<() => void>();

  const publish = (next: RouteLifecycleSnapshot): RouteLifecycleSnapshot => {
    snapshot = Object.freeze({ ...next });
    for (const listener of listeners) listener();
    return snapshot;
  };

  return Object.freeze({
    getSnapshot(): RouteLifecycleSnapshot { return snapshot; },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    begin(route: ApplicationRoute, owner: FeatureId): RouteLifecycleTransition {
      const changed = snapshot.owner !== owner || !sameRoute(snapshot.route, route) || snapshot.phase !== 'committed';
      if (!changed) {
        return Object.freeze({ revision: snapshot.revision, route, owner, changed: false });
      }
      const revision = snapshot.revision + 1;
      publish({
        phase: 'transitioning',
        revision,
        route,
        owner,
        previousRoute: snapshot.route,
        previousOwner: snapshot.owner,
      });
      return Object.freeze({ revision, route, owner, changed: true });
    },
    commit(revision: number): boolean {
      if (snapshot.revision !== revision || snapshot.phase !== 'transitioning') return false;
      publish({ ...snapshot, phase: 'committed' });
      return true;
    },
    fail(revision: number): boolean {
      if (snapshot.revision !== revision || snapshot.phase !== 'transitioning') return false;
      publish({ ...snapshot, phase: 'failed' });
      return true;
    },
    dispose(): void {
      publish({
        phase: 'disposed',
        revision: snapshot.revision + 1,
        route: null,
        owner: null,
        previousRoute: snapshot.route,
        previousOwner: snapshot.owner,
      });
    },
    isCurrent(revision: number): boolean { return snapshot.revision === revision && snapshot.phase !== 'failed' && snapshot.phase !== 'disposed'; },
  });
}
