import { Menu } from '@ark-ui/react/menu';
import { Portal } from '@ark-ui/react/portal';
import type { ReactElement, ReactNode } from 'react';

export interface WMMenuItem {
  readonly value: string;
  readonly label: ReactNode;
  readonly disabled?: boolean;
  readonly destructive?: boolean;
}

export interface WMMenuProps {
  readonly trigger: ReactElement;
  readonly items: readonly WMMenuItem[];
  readonly ariaLabel?: string;
  readonly onSelect?: (value: string) => void;
}

export function WMMenu({ trigger, items, ariaLabel, onSelect }: WMMenuProps) {
  return (
    <Menu.Root lazyMount unmountOnExit onSelect={(details) => onSelect?.(details.value)}>
      <Menu.Trigger asChild>{trigger}</Menu.Trigger>
      <Portal>
        <Menu.Positioner className="wm-react-menu-positioner">
          <Menu.Content
            className="wm-react-menu"
            {...(ariaLabel === undefined ? {} : { 'aria-label': ariaLabel })}
            data-wm-interaction="menu"
          >
            {items.map((item) => (
              <Menu.Item
                className="wm-react-menu__item"
                data-danger={item.destructive ? '' : undefined}
                {...(item.disabled === undefined ? {} : { disabled: item.disabled })}
                key={item.value}
                value={item.value}
              >
                {item.label}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
