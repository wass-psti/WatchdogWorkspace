import type { FeatureId } from '../../types/manifest.ts';
import type { ApplicationRoute } from './routing.ts';

export type RouteLifecyclePhase = 'idle' | 'transitioning' | 'committed' | 'failed' | 'disposed';

export interface RouteLifecycleSnapshot {
  readonly phase: RouteLifecyclePhase;
  readonly revision: number;
  readonly route: ApplicationRoute | null;
  readonly owner: FeatureId | null;
  readonly previousRoute: ApplicationRoute | null;
  readonly previousOwner: FeatureId | null;
}

export interface RouteLifecycleTransition {
  readonly revision: number;
  readonly route: ApplicationRoute;
  readonly owner: FeatureId;
  readonly changed: boolean;
}

export interface RouteLifecycleCoordinator {
  getSnapshot(): RouteLifecycleSnapshot;
  subscribe(listener: () => void): () => void;
  begin(route: ApplicationRoute, owner: FeatureId): RouteLifecycleTransition;
  commit(revision: number): boolean;
  fail(revision: number): boolean;
  dispose(): void;
  isCurrent(revision: number): boolean;
}
