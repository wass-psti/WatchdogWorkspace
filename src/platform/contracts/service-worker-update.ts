export type ServiceWorkerUpdateLifecycleType =
  | 'registered'
  | 'update-check-started'
  | 'update-check-completed'
  | 'update-found'
  | 'update-ready'
  | 'activation-requested'
  | 'controller-changed'
  | 'registration-failed'
  | 'update-check-failed';

export interface ServiceWorkerUpdateLifecycleEvent {
  readonly type: ServiceWorkerUpdateLifecycleType;
  readonly at: string;
  readonly reason?: 'initial' | 'visibility' | 'online' | 'manual';
  readonly detail?: string;
}

export interface ServiceWorkerUpdateCoordinatorOptions {
  readonly onUpdate?: ((registration: ServiceWorkerRegistration) => void) | null | undefined;
  readonly onLifecycle?: ((event: ServiceWorkerUpdateLifecycleEvent) => void) | null | undefined;
  readonly minimumUpdateCheckIntervalMs?: number;
}
