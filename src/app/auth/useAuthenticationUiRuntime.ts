import { useSyncExternalStore } from 'react';
import {
  authenticationUiRuntime,
  type AuthenticationUIRuntimeSnapshot,
} from './authentication-ui-runtime.ts';

export function useAuthenticationUiRuntime<T>(selector: (snapshot: AuthenticationUIRuntimeSnapshot) => T): T {
  const snapshot = useSyncExternalStore(
    authenticationUiRuntime.subscribe,
    authenticationUiRuntime.getSnapshot,
    authenticationUiRuntime.getSnapshot,
  );
  return selector(snapshot);
}
