import { useSyncExternalStore } from 'react';
import { authenticatedManagementUiRuntime, type AuthenticatedManagementUIRuntimeSnapshot } from './authenticated-management-ui-runtime.ts';

export function useAuthenticatedManagementUiRuntime<T>(selector: (snapshot: AuthenticatedManagementUIRuntimeSnapshot) => T): T {
  const snapshot = useSyncExternalStore(
    authenticatedManagementUiRuntime.subscribe,
    authenticatedManagementUiRuntime.getSnapshot,
    authenticatedManagementUiRuntime.getSnapshot,
  );
  return selector(snapshot);
}
