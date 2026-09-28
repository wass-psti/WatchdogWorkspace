import type { HTMLAttributes, ReactNode } from 'react';

export type WMBadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface WMBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly children?: ReactNode;
  readonly tone?: WMBadgeTone;
}

function classes(base: string, className?: string): string {
  return className ? `${base} ${className}` : base;
}

export function WMBadge({ children, tone = 'neutral', className, ...props }: WMBadgeProps) {
  return (
    <span
      {...props}
      className={classes('wm-badge', className)}
      data-tone={tone === 'neutral' ? undefined : tone}
      data-wm-component="badge"
    >
      {children}
    </span>
  );
}
