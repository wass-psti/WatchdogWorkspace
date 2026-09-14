import { useSyncExternalStore } from 'react';
import { sharedApplicationUiRuntime, type SharedApplicationUiSnapshot } from './shared-application-ui-runtime.ts';

export function useSharedApplicationUiRuntime<T>(selector: (snapshot: SharedApplicationUiSnapshot) => T): T {
  return useSyncExternalStore(
    sharedApplicationUiRuntime.subscribe,
    () => selector(sharedApplicationUiRuntime.getSnapshot()),
    () => selector(sharedApplicationUiRuntime.getSnapshot()),
  );
}
