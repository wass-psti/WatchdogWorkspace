import { Dialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import type { ReactElement, ReactNode } from 'react';
import { WMButton } from './button.tsx';

export interface WMDrawerProps {
  readonly trigger: ReactElement;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly children: ReactNode;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly placement?: 'start' | 'end' | 'bottom';
  readonly closeLabel?: string;
  readonly closeOnEscape?: boolean;
  readonly closeOnInteractOutside?: boolean;
}

export function WMDrawer({
  trigger,
  title,
  description,
  children,
  open,
  defaultOpen,
  onOpenChange,
  placement = 'end',
  closeLabel = 'Close drawer',
  closeOnEscape = true,
  closeOnInteractOutside = true,
}: WMDrawerProps) {
  return (
    <Dialog.Root
      {...(open === undefined ? {} : { open })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
      modal
      closeOnEscape={closeOnEscape}
      closeOnInteractOutside={closeOnInteractOutside}
      lazyMount
      unmountOnExit
      onOpenChange={(details) => onOpenChange?.(details.open)}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className="wm-react-overlay-backdrop" data-wm-overlay-layer="modal-backdrop" />
        <Dialog.Positioner className="wm-react-drawer-positioner" data-placement={placement}>
          <Dialog.Content className="wm-react-drawer" data-wm-interaction="drawer" data-placement={placement}>
            <div className="wm-react-drawer__header">
              <div>
                <Dialog.Title className="wm-react-drawer__title">{title}</Dialog.Title>
                {description ? <Dialog.Description className="wm-react-drawer__description">{description}</Dialog.Description> : null}
              </div>
              <Dialog.CloseTrigger asChild>
                <WMButton variant="ghost" size="sm" aria-label={closeLabel}>×</WMButton>
              </Dialog.CloseTrigger>
            </div>
            <div className="wm-react-drawer__body">{children}</div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
