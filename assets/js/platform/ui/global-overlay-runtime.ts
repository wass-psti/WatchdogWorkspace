import type {
  GlobalOverlayClaim,
  GlobalOverlayRuntime,
  GlobalOverlayRuntimeSnapshot,
} from '../../../../src/platform/contracts/overlay.ts';

export const GLOBAL_OVERLAY_OPEN_EVENT = 'wm:overlay-open';

const EMPTY_SNAPSHOT: GlobalOverlayRuntimeSnapshot = Object.freeze({
  active: false,
  ownerInstanceId: null,
  ownerScope: null,
  rootId: null,
  topId: null,
});

let activeClaim: GlobalOverlayClaim | null = null;
let snapshot: GlobalOverlayRuntimeSnapshot = EMPTY_SNAPSHOT;
const listeners = new Set<() => void>();

const freezeSnapshot = (next: GlobalOverlayRuntimeSnapshot): GlobalOverlayRuntimeSnapshot => Object.freeze({ ...next });

const publish = (next: GlobalOverlayRuntimeSnapshot): void => {
  if (
    next.active === snapshot.active
    && next.ownerInstanceId === snapshot.ownerInstanceId
    && next.ownerScope === snapshot.ownerScope
    && next.rootId === snapshot.rootId
    && next.topId === snapshot.topId
  ) return;
  snapshot = freezeSnapshot(next);
  for (const listener of listeners) listener();
};

const eventConstructor = (documentRef: Document): typeof CustomEvent | null => {
  const view = documentRef.defaultView;
  if (view?.CustomEvent) return view.CustomEvent;
  return typeof CustomEvent === 'function' ? CustomEvent : null;
};

const announceOpen = (claim: GlobalOverlayClaim): void => {
  const documentRef = claim.documentRef;
  if (!documentRef) return;
  const CustomEventConstructor = eventConstructor(documentRef);
  if (!CustomEventConstructor) return;
  documentRef.dispatchEvent(new CustomEventConstructor(GLOBAL_OVERLAY_OPEN_EVENT, {
    detail: Object.freeze({
      scope: claim.scope,
      id: claim.topId,
      rootId: claim.rootId,
      instanceId: claim.instanceId,
    }),
  }));
};

const toSnapshot = (claim: GlobalOverlayClaim | null): GlobalOverlayRuntimeSnapshot => claim
  ? {
      active: true,
      ownerInstanceId: claim.instanceId,
      ownerScope: claim.scope,
      rootId: claim.rootId,
      topId: claim.topId,
    }
  : EMPTY_SNAPSHOT;

export const globalOverlayRuntime: GlobalOverlayRuntime = Object.freeze({
  getSnapshot: (): GlobalOverlayRuntimeSnapshot => snapshot,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  claim(claim: GlobalOverlayClaim): void {
    const normalized: GlobalOverlayClaim = Object.freeze({ ...claim });
    const previous = activeClaim;
    if (previous && previous.instanceId !== normalized.instanceId) {
      // Publish the incoming owner before asking the previous branch to close.
      // A previous close callback can synchronously open another overlay; in
      // that re-entrant case the newer claim must win instead of being
      // overwritten when this claim resumes.
      activeClaim = normalized;
      publish(toSnapshot(normalized));
      previous.closeAll();
      if (activeClaim?.instanceId === normalized.instanceId) announceOpen(normalized);
      return;
    }
    activeClaim = normalized;
    publish(toSnapshot(normalized));
    announceOpen(normalized);
  },
  update(instanceId: string, topId: string): void {
    if (!activeClaim || activeClaim.instanceId !== instanceId || activeClaim.topId === topId) return;
    activeClaim = Object.freeze({ ...activeClaim, topId });
    publish(toSnapshot(activeClaim));
  },
  release(instanceId: string): void {
    if (!activeClaim || activeClaim.instanceId !== instanceId) return;
    activeClaim = null;
    publish(EMPTY_SNAPSHOT);
  },
  reset(): void {
    const previous = activeClaim;
    activeClaim = null;
    publish(EMPTY_SNAPSHOT);
    previous?.closeAll();
  },
});

export function resolveGlobalOverlayRoot(documentRef: Document = document): HTMLElement {
  const root = documentRef.querySelector<HTMLElement>('#overlayRoot');
  if (!root) throw new Error('Work Management global overlay root is missing.');
  return root;
}

export function resolveGlobalToastRoot(documentRef: Document = document): HTMLElement {
  const root = documentRef.querySelector<HTMLElement>('#toastRoot');
  if (!root) throw new Error('Work Management global toast root is missing.');
  return root;
}
