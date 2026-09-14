import type { HTMLAttributes, ReactNode } from 'react';

export interface WMSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
  readonly elevation?: 'flat' | 'raised';
}

function classes(base: string, className?: string): string {
  return className ? `${base} ${className}` : base;
}

export function WMSurface({ elevation = 'flat', className, children, ...props }: WMSurfaceProps) {
  return (
    <div
      {...props}
      className={classes('wm-surface', className)}
      data-elevation={elevation === 'raised' ? 'raised' : undefined}
    >
      {children}
    </div>
  );
}

export function WMDivider(props: HTMLAttributes<HTMLHRElement>) {
  const { className, ...rest } = props;
  return <hr {...rest} className={classes('wm-divider', className)} />;
}
