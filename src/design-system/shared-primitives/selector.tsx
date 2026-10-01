import type { SelectHTMLAttributes } from 'react';
import { WMNativeSelect } from '../forms/field.tsx';

export interface WMSelectorProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly compact?: boolean;
  readonly accessibleLabel?: string;
}

export function WMSelector({ compact = false, accessibleLabel, ...props }: WMSelectorProps) {
  return (
    <WMNativeSelect
      {...props}
      compact={compact}
      aria-label={props['aria-label'] ?? accessibleLabel}
      data-wm-shared-primitive="selector"
    />
  );
}
