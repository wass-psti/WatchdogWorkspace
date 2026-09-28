import { forwardRef, type HTMLAttributes } from 'react';
import { wmClasses } from '../interactions/shared.ts';
import type { WorkManagementFloatingSurfaceWidth } from '../overlay-system.ts';

export interface WMFloatingSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  readonly width?: WorkManagementFloatingSurfaceWidth;
  readonly overlayKind?: 'menu' | 'popover' | 'choice-surface' | 'tooltip';
}

export const WMFloatingSurface = forwardRef<HTMLDivElement, WMFloatingSurfaceProps>(function WMFloatingSurface({
  width = 'bounded',
  overlayKind = 'popover',
  className,
  ...props
}, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={wmClasses('wm-overlay-surface', className)}
      data-wm-component="floating-surface"
      data-wm-overlay-kind={overlayKind}
      data-wm-overlay-width={width}
    />
  );
});
