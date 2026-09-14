import { autoUpdate, flip, offset, shift, size, useFloating } from '@floating-ui/react';
import type { Placement } from '@floating-ui/react';

export interface WMFloatingLayerOptions {
  readonly placement?: Placement;
  readonly gap?: number;
  readonly viewportPadding?: number;
  readonly matchReferenceWidth?: boolean;
}

/**
 * Product-owned positioning adapter for anchored layers not already modeled by
 * an Ark interaction primitive. Focus, dismissal, and ARIA semantics stay with
 * the owning Work Management primitive; this hook owns geometry only.
 */
export function useWMFloatingLayer({
  placement = 'bottom-start',
  gap = 8,
  viewportPadding = 12,
  matchReferenceWidth = false,
}: WMFloatingLayerOptions = {}) {
  return useFloating({
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(gap),
      flip({ padding: viewportPadding }),
      shift({ padding: viewportPadding }),
      size({
        padding: viewportPadding,
        apply({ availableHeight, rects, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.max(80, availableHeight)}px`,
            ...(matchReferenceWidth ? { minWidth: `${rects.reference.width}px` } : {}),
          });
        },
      }),
    ],
  });
}
