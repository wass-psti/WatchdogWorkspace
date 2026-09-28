import type { HTMLAttributes, ReactNode } from 'react';

export interface WMToolbarProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
  readonly wrap?: boolean;
  readonly ariaLabel?: string;
}

export interface WMToolbarGroupProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
  readonly ariaLabel?: string;
}

function classes(base: string, className?: string): string {
  return className ? `${base} ${className}` : base;
}

export function WMToolbar({ children, wrap = false, ariaLabel, className, role = 'toolbar', ...props }: WMToolbarProps) {
  return (
    <div
      {...props}
      role={role}
      aria-label={ariaLabel}
      className={classes('wm-toolbar', className)}
      data-wrap={wrap ? 'true' : undefined}
      data-wm-component="toolbar"
    >
      {children}
    </div>
  );
}

export function WMToolbarGroup({ children, ariaLabel, className, role = 'group', ...props }: WMToolbarGroupProps) {
  return (
    <div
      {...props}
      role={role}
      aria-label={ariaLabel}
      className={classes('wm-toolbar-group', className)}
      data-wm-component="toolbar-group"
    >
      {children}
    </div>
  );
}

export function WMToolbarSpacer({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} aria-hidden="true" className={classes('wm-toolbar-spacer', className)} data-wm-component="toolbar-spacer" />;
}
