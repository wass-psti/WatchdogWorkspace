import type { FeatureId } from '../../../src/types/manifest.ts';
import type { RouteLifecycleSnapshot } from '../../../src/platform/contracts/route-lifecycle.ts';

export interface PresentationFrameToken {
  readonly routeKey: string;
  readonly revision: number;
  readonly owner: FeatureId | null;
}

export function createPresentationFrameToken(routeKey: string, lifecycle: RouteLifecycleSnapshot): PresentationFrameToken {
  return Object.freeze({
    routeKey: String(routeKey || '#/'),
    revision: lifecycle.revision,
    owner: lifecycle.owner,
  });
}

export function isPresentationFrameCurrent(
  token: PresentationFrameToken,
  currentRouteKey: string,
  lifecycle: RouteLifecycleSnapshot,
  shellActive: boolean,
): boolean {
  return shellActive
    && String(currentRouteKey || '#/') === token.routeKey
    && lifecycle.phase === 'committed'
    && lifecycle.revision === token.revision
    && lifecycle.owner === token.owner;
}
