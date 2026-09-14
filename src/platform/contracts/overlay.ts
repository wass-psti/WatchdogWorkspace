export interface OverlayCloseOptions {
  readonly restoreFocus?: boolean;
  readonly fromCoordinator?: boolean;
}

export type OverlayCloseHandler = (options?: OverlayCloseOptions) => void;

export interface OverlayRegistration {
  readonly id: string;
  readonly element: HTMLElement;
  readonly trigger?: HTMLElement | null;
  readonly close: OverlayCloseHandler;
  readonly parentId?: string | null;
}

export interface OverlaySnapshotEntry {
  readonly id: string;
  readonly parentId: string | null;
}

export interface OverlayManager {
  readonly scope: string;
  readonly active: boolean;
  readonly topId: string | null;
  open(registration: OverlayRegistration): boolean;
  release(id: string): void;
  closeTop(options?: Readonly<{ restoreFocus?: boolean }>): boolean;
  closeAll(options?: Readonly<{ restoreFocus?: boolean; except?: string | null }>): void;
  snapshot(): readonly OverlaySnapshotEntry[];
  dispose(): void;
}


export interface GlobalOverlayClaim {
  readonly instanceId: string;
  readonly scope: string;
  readonly rootId: string;
  readonly topId: string;
  readonly documentRef: Document | null;
  readonly closeAll: () => void;
}

export interface GlobalOverlayRuntimeSnapshot {
  readonly active: boolean;
  readonly ownerInstanceId: string | null;
  readonly ownerScope: string | null;
  readonly rootId: string | null;
  readonly topId: string | null;
}

export interface GlobalOverlayRuntime {
  getSnapshot(): GlobalOverlayRuntimeSnapshot;
  subscribe(listener: () => void): () => void;
  claim(claim: GlobalOverlayClaim): void;
  update(instanceId: string, topId: string): void;
  release(instanceId: string): void;
  reset(): void;
}

export interface OverlayManagerOptions {
  readonly scope?: string;
  readonly documentRef?: Document | null;
  readonly replacementTrigger?: (target: Element) => boolean;
  readonly underlyingAction?: (target: EventTarget | null) => Element | null;
}
