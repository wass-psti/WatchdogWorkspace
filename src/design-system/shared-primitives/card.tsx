import type { HTMLAttributes, ReactNode } from 'react';
import { wmPrimitiveClasses } from './shared.ts';

export interface WMCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
  readonly elevated?: boolean;
  readonly interactive?: boolean;
  readonly selected?: boolean;
}

export function WMCard({ children, elevated = false, interactive = false, selected = false, className, ...props }: WMCardProps) {
  return (
    <div
      {...props}
      className={wmPrimitiveClasses('wm-card', className)}
      data-wm-component="card"
      data-elevation={elevated ? 'raised' : undefined}
      data-interactive={interactive ? '' : undefined}
      data-selected={interactive && selected ? '' : undefined}
    >
      {children}
    </div>
  );
}
