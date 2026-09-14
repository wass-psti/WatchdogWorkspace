import type { HTMLAttributes, ReactNode } from 'react';

export interface WMTextProps extends HTMLAttributes<HTMLParagraphElement> {
  readonly children?: ReactNode;
  readonly tone?: 'default' | 'muted';
}

function classes(base: string, className?: string): string {
  return className ? `${base} ${className}` : base;
}

export function WMText({ tone = 'default', className, children, ...props }: WMTextProps) {
  const toneClass = tone === 'muted' ? 'wm-muted' : '';
  return (
    <p {...props} className={classes(toneClass, className).trim() || undefined}>
      {children}
    </p>
  );
}

export function WMKicker({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p {...props} className={classes('wm-kicker', className)}>
      {children}
    </p>
  );
}

export interface WMHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  readonly children?: ReactNode;
  readonly level?: 1 | 2 | 3 | 4;
}

export function WMHeading({ level = 2, children, ...props }: WMHeadingProps) {
  if (level === 1) return <h1 {...props}>{children}</h1>;
  if (level === 3) return <h3 {...props}>{children}</h3>;
  if (level === 4) return <h4 {...props}>{children}</h4>;
  return <h2 {...props}>{children}</h2>;
}

export function WMVisuallyHidden({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span {...props} className={classes('wm-visually-hidden', className)}>
      {children}
    </span>
  );
}
