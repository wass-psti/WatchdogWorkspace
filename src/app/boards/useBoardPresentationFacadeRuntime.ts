import { useSyncExternalStore } from 'react';
import { boardPresentationFacadeRuntime, type BoardPresentationFacadeSnapshot } from './board-presentation-facade-runtime.ts';

export function useBoardPresentationFacadeRuntime<T>(selector: (snapshot: BoardPresentationFacadeSnapshot) => T): T {
  return useSyncExternalStore(
    boardPresentationFacadeRuntime.subscribe,
    () => selector(boardPresentationFacadeRuntime.getSnapshot()),
    () => selector(boardPresentationFacadeRuntime.getSnapshot()),
  );
}
