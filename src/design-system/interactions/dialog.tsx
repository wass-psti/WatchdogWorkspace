import { Dialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import type { ReactElement, ReactNode } from 'react';
import { WMButton } from './button.tsx';

export interface WMDialogProps {
  readonly trigger: ReactElement;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly children: ReactNode;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly closeLabel?: string;
  readonly role?: 'dialog' | 'alertdialog';
  readonly modal?: boolean;
  readonly closeOnEscape?: boolean;
  readonly closeOnInteractOutside?: boolean;
}

export function WMDialog({
  trigger,
  title,
  description,
  children,
  open,
  defaultOpen,
  onOpenChange,
  closeLabel = 'Close dialog',
  role = 'dialog',
  modal = true,
  closeOnEscape = true,
  closeOnInteractOutside,
}: WMDialogProps) {
  const outsideDismiss = closeOnInteractOutside ?? role !== 'alertdialog';
  return (
    <Dialog.Root
      {...(open === undefined ? {} : { open })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
      modal={modal}
      role={role}
      closeOnEscape={closeOnEscape}
      closeOnInteractOutside={outsideDismiss}
      lazyMount
      unmountOnExit
      onOpenChange={(details) => onOpenChange?.(details.open)}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className="wm-react-overlay-backdrop" />
        <Dialog.Positioner className="wm-react-dialog-positioner">
          <Dialog.Content className="wm-react-dialog" data-wm-interaction="dialog">
            <div className="wm-react-dialog__header">
              <div>
                <Dialog.Title className="wm-react-dialog__title">{title}</Dialog.Title>
                {description ? <Dialog.Description className="wm-react-dialog__description">{description}</Dialog.Description> : null}
              </div>
              <Dialog.CloseTrigger asChild>
                <WMButton variant="ghost" size="sm" aria-label={closeLabel}>×</WMButton>
              </Dialog.CloseTrigger>
            </div>
            <div className="wm-react-dialog__body">{children}</div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
