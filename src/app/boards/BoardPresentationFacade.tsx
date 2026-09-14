import { memo } from 'react';
import { BoardPresentationRouteBoundary } from './components/BoardPresentationRouteBoundary.tsx';
import { useBoardPresentationFacadeRuntime } from './useBoardPresentationFacadeRuntime.ts';

export interface BoardPresentationFacadeProps {
  readonly className?: string;
  readonly inert?: boolean;
}

function BoardPresentationFacadeComponent({ className, inert = false }: BoardPresentationFacadeProps) {
  const snapshot = useBoardPresentationFacadeRuntime((value) => value);
  return <BoardPresentationRouteBoundary {...(className ? { className } : {})} inert={inert} snapshot={snapshot} />;
}

/**
 * M16 keeps BoardPresentationFacade as the route-level composition entrypoint,
 * but delegates route modeling and the compatibility host to focused components.
 * Board domain, commands, persistence, server state, and interaction authority
 * remain outside React presentation components.
 */
export const BoardPresentationFacade = memo(BoardPresentationFacadeComponent);
