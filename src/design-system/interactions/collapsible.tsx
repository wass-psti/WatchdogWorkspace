import { Collapsible } from '@ark-ui/react/collapsible';
import type { ReactNode } from 'react';

export interface WMCollapsibleProps {
  readonly trigger: ReactNode;
  readonly children: ReactNode;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly disabled?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}

export function WMCollapsible({ trigger, children, open, defaultOpen, disabled, onOpenChange }: WMCollapsibleProps) {
  return (
    <Collapsible.Root
      className="wm-react-collapsible"
      {...(open === undefined ? {} : { open })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
      {...(disabled === undefined ? {} : { disabled })}
      onOpenChange={(details) => onOpenChange?.(details.open)}
    >
      <Collapsible.Trigger className="wm-react-collapsible__trigger">{trigger}</Collapsible.Trigger>
      <Collapsible.Content className="wm-react-collapsible__content">{children}</Collapsible.Content>
    </Collapsible.Root>
  );
}
