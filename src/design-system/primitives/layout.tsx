import type { HTMLAttributes, ReactNode } from 'react';

type StackGap = 'sm' | 'md' | 'lg';

export interface WMLayoutProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
}

export interface WMStackProps extends WMLayoutProps {
  readonly gap?: StackGap;
}

function classes(base: string, className?: string): string {
  return className ? `${base} ${className}` : base;
}

export function WMStack({ gap = 'md', className, children, ...props }: WMStackProps) {
  const dataGap = gap === 'md' ? undefined : gap;
  return (
    <div {...props} className={classes('wm-stack', className)} data-gap={dataGap}>
      {children}
    </div>
  );
}

export function WMCluster({ className, children, ...props }: WMLayoutProps) {
  return (
    <div {...props} className={classes('wm-cluster', className)}>
      {children}
    </div>
  );
}

export function WMGrid({ className, children, ...props }: WMLayoutProps) {
  return (
    <div {...props} className={classes('wm-grid', className)}>
      {children}
    </div>
  );
}

export function WMPage({ className, children, ...props }: WMLayoutProps) {
  return (
    <main {...props} className={classes('wm-page', className)}>
      {children}
    </main>
  );
}

export function WMSection({ className, children, ...props }: WMLayoutProps) {
  return (
    <section {...props} className={classes('wm-section', className)}>
      {children}
    </section>
  );
}
