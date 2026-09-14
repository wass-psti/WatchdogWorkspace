import { Popover } from '@ark-ui/react/popover';
import { Portal } from '@ark-ui/react/portal';
import type { ReactElement, ReactNode } from 'react';
import type { WMPlacement } from './shared.ts';

export interface WMPopoverProps {
  readonly trigger: ReactElement;
  readonly children: ReactNode;
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly placement?: WMPlacement;
}

export function WMPopover({
  trigger,
  children,
  title,
  description,
  open,
  defaultOpen,
  onOpenChange,
  placement = 'bottom-start',
}: WMPopoverProps) {
  return (
    <Popover.Root
      {...(open === undefined ? {} : { open })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
      positioning={{ placement, gutter: 8 }}
      lazyMount
      unmountOnExit
      onOpenChange={(details) => onOpenChange?.(details.open)}
    >
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Portal>
        <Popover.Positioner className="wm-react-popover-positioner">
          <Popover.Content className="wm-react-popover" data-wm-interaction="popover">
            {title ? <Popover.Title className="wm-react-popover__title">{title}</Popover.Title> : null}
            {description ? <Popover.Description className="wm-react-popover__description">{description}</Popover.Description> : null}
            <div className="wm-react-popover__body">{children}</div>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
