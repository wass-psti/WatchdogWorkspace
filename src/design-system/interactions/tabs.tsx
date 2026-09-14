import { Tabs } from '@ark-ui/react/tabs';
import type { ReactNode } from 'react';

export interface WMTabsItem {
  readonly value: string;
  readonly label: ReactNode;
  readonly content: ReactNode;
  readonly disabled?: boolean;
}

export interface WMTabsProps {
  readonly items: readonly WMTabsItem[];
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly ariaLabel: string;
  readonly activationMode?: 'automatic' | 'manual';
  readonly orientation?: 'horizontal' | 'vertical';
}

export function WMTabs({
  items,
  value,
  defaultValue,
  onValueChange,
  ariaLabel,
  activationMode = 'automatic',
  orientation = 'horizontal',
}: WMTabsProps) {
  return (
    <Tabs.Root
      {...(value === undefined ? {} : { value })}
      {...(defaultValue === undefined ? {} : { defaultValue })}
      activationMode={activationMode}
      orientation={orientation}
      onValueChange={(details) => onValueChange?.(details.value)}
    >
      <Tabs.List className="wm-react-tabs__list" aria-label={ariaLabel}>
        {items.map((item) => (
          <Tabs.Trigger
            className="wm-react-tabs__trigger"
            {...(item.disabled === undefined ? {} : { disabled: item.disabled })}
            key={item.value}
            value={item.value}
          >
            {item.label}
          </Tabs.Trigger>
        ))}
        <Tabs.Indicator className="wm-react-tabs__indicator" />
      </Tabs.List>
      {items.map((item) => (
        <Tabs.Content className="wm-react-tabs__content" key={item.value} value={item.value}>
          {item.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
