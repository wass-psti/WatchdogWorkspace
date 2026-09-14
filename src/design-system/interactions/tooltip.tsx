import { Portal } from '@ark-ui/react/portal';
import { Tooltip } from '@ark-ui/react/tooltip';
import type { ReactElement, ReactNode } from 'react';
import type { WMPlacement } from './shared.ts';

export interface WMTooltipProps {
  readonly children: ReactElement;
  readonly content: ReactNode;
  readonly disabled?: boolean;
  readonly openDelay?: number;
  readonly closeDelay?: number;
  readonly placement?: WMPlacement;
}

export function WMTooltip({
  children,
  content,
  disabled = false,
  openDelay = 450,
  closeDelay = 80,
  placement = 'top',
}: WMTooltipProps) {
  return (
    <Tooltip.Root
      disabled={disabled}
      openDelay={openDelay}
      closeDelay={closeDelay}
      positioning={{ placement, gutter: 8 }}
      lazyMount
      unmountOnExit
    >
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner className="wm-react-tooltip-positioner">
          <Tooltip.Content className="wm-react-tooltip" data-wm-interaction="tooltip">{content}</Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  );
}
