import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { wmPrimitiveClasses } from './shared.ts';

export interface WMFilterBarProps extends HTMLAttributes<HTMLDivElement> {
  readonly label: string;
  readonly children?: ReactNode;
}

export function WMFilterBar({ label, children, className, ...props }: WMFilterBarProps) {
  return (
    <div {...props} className={wmPrimitiveClasses('wm-toolbar', className)} role="region" aria-label={label} data-wm-component="filter-bar">
      {children}
    </div>
  );
}

export interface WMFilterChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> {
  readonly selected?: boolean;
  readonly count?: number;
}

export function WMFilterChip({ selected = false, count, children, className, type = 'button', ...props }: WMFilterChipProps) {
  return (
    <button
      {...props}
      type={type}
      className={wmPrimitiveClasses('wm-button wm-button--tertiary wm-control--sm', className)}
      aria-pressed={selected}
      data-wm-component="filter-chip"
    >
      <span>{children}</span>
      {count === undefined ? null : <span className="wm-badge" aria-label={`${count} results`}>{count}</span>}
    </button>
  );
}
