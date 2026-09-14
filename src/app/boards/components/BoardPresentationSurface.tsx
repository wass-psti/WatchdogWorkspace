import { memo, useLayoutEffect, useRef } from 'react';
import { presentationReadinessRuntime } from '../../composition/presentation-readiness-runtime.ts';
import type { BoardPresentationRouteModel } from './board-presentation-model.ts';

export interface BoardPresentationSurfaceProps {
  readonly className?: string;
  readonly inert?: boolean;
  readonly model: BoardPresentationRouteModel;
}

function BoardPresentationSurfaceComponent({ className, inert = false, model }: BoardPresentationSurfaceProps) {
  const active = model.kind !== 'inactive';
  const hostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!active) return;
    const main = hostRef.current?.querySelector<HTMLElement>('#main') ?? null;
    if (!main) return;
    presentationReadinessRuntime.acknowledge('boards', main);
    return () => presentationReadinessRuntime.release('boards', main);
  }, [active, model.view, model.boardId]);

  return (
    <div
      ref={hostRef}
      className={className}
      data-workspace-root=""
      aria-label={model.ariaLabel}
      inert={inert || !active ? true : undefined}
      hidden={!active}
      data-wm-board-presentation-host=""
      data-wm-board-presentation-route={model.kind}
      data-wm-board-presentation-view={model.view}
      data-wm-board-id={model.boardId ?? undefined}
      data-wm-board-component-decomposition="react-board-component-decomposition-v1"
      data-wm-composition-owner="react-board-presentation-facade"
    />
  );
}

/**
 * React owns this host element and its route metadata only. The compatibility
 * Board engine owns the host descendants; React must never render children here.
 */
export const BoardPresentationSurface = memo(BoardPresentationSurfaceComponent);
