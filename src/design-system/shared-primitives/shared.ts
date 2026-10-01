import type { ReactNode } from 'react';

export type WMPrimitiveSize = 'sm' | 'md' | 'lg';
export type WMPrimitiveTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export interface WMPrimitiveLabelledContent {
  readonly label: ReactNode;
  readonly description?: ReactNode;
}

export function wmPrimitiveClasses(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
