import type { HTMLAttributes, ReactNode } from 'react';

function classes(base: string, className?: string): string {
  return className ? `${base} ${className}` : base;
}

export interface WMApplicationShellFrameProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
  readonly active?: boolean;
}

export function WMApplicationShellFrame({ active = true, className, children, ...props }: WMApplicationShellFrameProps) {
  const shellClassName = active ? classes('shell', className) : className;
  return <div {...props} className={shellClassName} data-wm-application-shell-frame={active ? '' : undefined}>{children}</div>;
}

export interface WMGlobalNavigationProps extends HTMLAttributes<HTMLElement> {
  readonly children?: ReactNode;
}

export function WMGlobalNavigation({ className, children, ...props }: WMGlobalNavigationProps) {
  return <aside {...props} className={classes('sidebar', className)} data-wm-global-navigation="">{children}</aside>;
}

export interface WMShellHeaderFrameProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
}

export function WMShellHeaderFrame({ className, children, ...props }: WMShellHeaderFrameProps) {
  return <div {...props} className={classes('shell-sidebar-header', className)} data-wm-shell-header="">{children}</div>;
}

export interface WMShellNavigationScrollProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
}

export function WMShellNavigationScroll({ className, children, ...props }: WMShellNavigationScrollProps) {
  return <div {...props} className={classes('shell-navigation-scroll', className)} data-wm-shell-navigation-scroll="">{children}</div>;
}

export interface WMShellStatusFooterProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
}

export function WMShellStatusFooter({ className, children, ...props }: WMShellStatusFooterProps) {
  return <div {...props} className={classes('sidebar-foot', className)} data-wm-shell-status-footer="">{children}</div>;
}

export interface WMGlobalPageFrameProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
  readonly module?: boolean;
}

export function WMGlobalPageFrame({ className, module = false, children, ...props }: WMGlobalPageFrameProps) {
  const base = module ? 'workspace module-workspace' : 'workspace';
  return <div {...props} className={classes(base, className)} data-wm-global-page-frame="">{children}</div>;
}
