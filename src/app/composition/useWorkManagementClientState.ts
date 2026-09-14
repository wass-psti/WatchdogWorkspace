import { useSyncExternalStore } from 'react';
import { workManagementClientState } from '../../../assets/js/platform/state/client-state-store.ts';
import type { WorkManagementClientStateSnapshot } from '../../platform/contracts/client-state.ts';

export function useWorkManagementClientState<T>(selector: (snapshot: WorkManagementClientStateSnapshot) => T): T {
  const snapshot = useSyncExternalStore(
    workManagementClientState.subscribe,
    workManagementClientState.getSnapshot,
    workManagementClientState.getSnapshot,
  );
  return selector(snapshot);
}
