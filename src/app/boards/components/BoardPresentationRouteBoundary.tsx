import { memo } from 'react';
import type { BoardPresentationFacadeSnapshot } from '../board-presentation-facade-runtime.ts';
import { BoardPresentationSurface } from './BoardPresentationSurface.tsx';
import { deriveBoardPresentationRouteModel } from './board-presentation-model.ts';

export interface BoardPresentationRouteBoundaryProps {
  readonly className?: string;
  readonly inert?: boolean;
  readonly snapshot: BoardPresentationFacadeSnapshot;
}

function BoardPresentationRouteBoundaryComponent({ className, inert = false, snapshot }: BoardPresentationRouteBoundaryProps) {
  const model = deriveBoardPresentationRouteModel(snapshot);
  return <BoardPresentationSurface {...(className ? { className } : {})} inert={inert} model={model} />;
}

/**
 * M16 centralizes route-derived Board presentation state in one typed component
 * boundary so collection/detail branching never leaks into the host shell.
 */
export const BoardPresentationRouteBoundary = memo(BoardPresentationRouteBoundaryComponent);
