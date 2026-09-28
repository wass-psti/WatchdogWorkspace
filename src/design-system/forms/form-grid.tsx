import type { HTMLAttributes, ReactNode } from 'react';

export interface WMFormGridProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
}

export function WMFormGrid({ children, className, ...props }: WMFormGridProps) {
  return (
    <div {...props} className={className ? `wm-form-grid ${className}` : 'wm-form-grid'} data-wm-component="form-grid">
      {children}
    </div>
  );
}
