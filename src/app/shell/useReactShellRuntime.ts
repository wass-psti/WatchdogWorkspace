import { useSyncExternalStore } from 'react';
import { reactShellRuntime, type ReactShellRuntimeSnapshot } from './shell-runtime-bridge.ts';

export function useReactShellRuntime<T>(selector: (snapshot: ReactShellRuntimeSnapshot) => T): T {
  const snapshot = useSyncExternalStore(
    reactShellRuntime.subscribe,
    reactShellRuntime.getSnapshot,
    reactShellRuntime.getSnapshot,
  );
  return selector(snapshot);
}
