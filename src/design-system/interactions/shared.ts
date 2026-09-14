import type { ReactNode } from 'react';

export type WMInteractionSize = 'sm' | 'md' | 'lg';
export type WMInteractionTone = 'neutral' | 'accent' | 'danger';
export type WMPlacement = 'top' | 'top-start' | 'top-end' | 'right' | 'right-start' | 'right-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end';

export interface WMOpenChangeDetails {
  readonly open: boolean;
}

export interface WMLabelledContent {
  readonly label: ReactNode;
  readonly description?: ReactNode;
}

export function wmClasses(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
