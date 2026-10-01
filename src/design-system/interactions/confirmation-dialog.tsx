import { Dialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import type { ReactElement, ReactNode } from 'react';
import { WMButton } from './button.tsx';

export interface WMConfirmationDialogProps {
  readonly trigger: ReactElement;
  readonly title: ReactNode;
  readonly description: ReactNode;
  readonly confirmLabel?: ReactNode;
  readonly cancelLabel?: ReactNode;
  readonly destructive?: boolean;
  readonly busy?: boolean;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onConfirm: () => void;
}

export function WMConfirmationDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  open,
  defaultOpen,
  onOpenChange,
  onConfirm,
}: WMConfirmationDialogProps) {
  return (
    <Dialog.Root
      {...(open === undefined ? {} : { open })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
      modal
      role="alertdialog"
      closeOnEscape
      closeOnInteractOutside={false}
      lazyMount
      unmountOnExit
      onOpenChange={(details) => onOpenChange?.(details.open)}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className="wm-react-overlay-backdrop" data-wm-overlay-layer="modal-backdrop" />
        <Dialog.Positioner className="wm-react-dialog-positioner">
          <Dialog.Content className="wm-react-dialog" data-wm-interaction="confirmation-dialog">
            <div className="wm-react-dialog__header">
              <div>
                <Dialog.Title className="wm-react-dialog__title">{title}</Dialog.Title>
                <Dialog.Description className="wm-react-dialog__description">{description}</Dialog.Description>
              </div>
            </div>
            <div className="wm-react-dialog__body">
              <div className="wm-confirmation-actions" data-wm-interaction="confirmation-actions">
                <Dialog.CloseTrigger asChild>
                  <WMButton variant="ghost" type="button" disabled={busy}>{cancelLabel}</WMButton>
                </Dialog.CloseTrigger>
                <WMButton
                  variant="solid"
                  tone={destructive ? 'danger' : 'accent'}
                  type="button"
                  disabled={busy}
                  loading={busy}
                  data-danger={destructive ? '' : undefined}
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </WMButton>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
