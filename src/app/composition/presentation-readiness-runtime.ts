import type { FeatureId } from '../../types/manifest.ts';

export interface PresentationFocusRequest {
  readonly revision: number;
  readonly owner: FeatureId;
  readonly isCurrent: (revision: number) => boolean;
  readonly preventScroll?: boolean;
}

export interface PresentationReadinessSnapshot {
  readonly pendingRevision: number | null;
  readonly pendingOwner: FeatureId | null;
  readonly readyOwners: readonly FeatureId[];
}

type ReadyTarget = Readonly<{ owner: FeatureId; element: HTMLElement }>;

let pending: PresentationFocusRequest | null = null;
const readyTargets = new Map<FeatureId, ReadyTarget>();

function isVisible(element: HTMLElement): boolean {
  if (!element.isConnected || element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(element);
  return element.getClientRects().length > 0 && style.display !== 'none' && style.visibility !== 'hidden';
}

function focusTarget(request: PresentationFocusRequest, target: ReadyTarget | undefined): boolean {
  if (!target || target.owner !== request.owner || !request.isCurrent(request.revision) || !isVisible(target.element)) return false;
  const element = target.element;
  element.tabIndex = -1;
  try { element.focus({ preventScroll: request.preventScroll ?? false }); }
  catch { element.focus(); }
  if (!(request.preventScroll ?? false)) element.scrollIntoView({ block: 'start', inline: 'nearest' });
  return document.activeElement === element;
}

function settlePending(): boolean {
  if (!pending) return false;
  if (!pending.isCurrent(pending.revision)) {
    pending = null;
    return false;
  }
  const target = readyTargets.get(pending.owner);
  if (!focusTarget(pending, target)) return false;
  pending = null;
  return true;
}

export const presentationReadinessRuntime = Object.freeze({
  getSnapshot(): PresentationReadinessSnapshot {
    return Object.freeze({
      pendingRevision: pending?.revision ?? null,
      pendingOwner: pending?.owner ?? null,
      readyOwners: Object.freeze([...readyTargets.entries()].filter(([, target]) => isVisible(target.element)).map(([owner]) => owner)),
    });
  },
  requestFocus(request: PresentationFocusRequest): boolean {
    pending = Object.freeze({ ...request });
    return settlePending();
  },
  acknowledge(owner: FeatureId, element: HTMLElement | null): boolean {
    if (!element) return false;
    readyTargets.set(owner, Object.freeze({ owner, element }));
    return settlePending();
  },
  release(owner: FeatureId, element?: HTMLElement | null): void {
    const current = readyTargets.get(owner);
    if (!current) return;
    if (element && current.element !== element) return;
    readyTargets.delete(owner);
  },
  cancel(): void {
    pending = null;
  },
  resetForTest(): void {
    pending = null;
    readyTargets.clear();
  },
});
