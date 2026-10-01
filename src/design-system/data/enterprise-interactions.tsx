import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

function classes(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export interface WMDenseDataToolbarProps extends HTMLAttributes<HTMLDivElement> {
  readonly label: string;
  readonly children: ReactNode;
}

/** Presentation-only enterprise toolbar. Query/filter state remains consumer-owned. */
export function WMDenseDataToolbar({ label, className, children, ...props }: WMDenseDataToolbarProps) {
  return <div {...props} className={classes('wm-dense-toolbar', className)} role="toolbar" aria-label={label}>{children}</div>;
}

export interface WMDataSummaryProps extends HTMLAttributes<HTMLDivElement> {
  readonly visibleCount: number;
  readonly totalCount?: number;
  readonly label?: string;
}

/** Polite result summary; it never owns filtering or pagination state. */
export function WMDataSummary({ visibleCount, totalCount = visibleCount, label = 'Results', className, ...props }: WMDataSummaryProps) {
  const text = visibleCount === totalCount ? `${visibleCount} ${visibleCount === 1 ? 'result' : 'results'}` : `${visibleCount} of ${totalCount} results`;
  return <div {...props} className={classes('wm-data-summary', className)} role="status" aria-live="polite" aria-atomic="true"><span>{label}</span><strong>{text}</strong></div>;
}

export interface WMBulkActionBarProps extends HTMLAttributes<HTMLDivElement> {
  readonly selectedCount: number;
  readonly label?: string;
  readonly children: ReactNode;
}

/** Controlled bulk-action presentation. Selected IDs and mutations remain product-owned. */
export function WMBulkActionBar({ selectedCount, label = 'Bulk actions', className, children, ...props }: WMBulkActionBarProps) {
  return <div {...props} className={classes('wm-bulk-action-bar', className)} role="toolbar" aria-label={label} data-selection-active={selectedCount > 0 || undefined}><span className="wm-bulk-selection" role="status" aria-live="polite">{selectedCount} selected</span><div className="wm-bulk-actions">{children}</div></div>;
}

export interface WMPaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  readonly page: number;
  readonly pageCount: number;
  readonly onPageChange: (page: number) => void;
  readonly disabled?: boolean;
  readonly previousLabel?: string;
  readonly nextLabel?: string;
  readonly buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled' | 'children'>;
}

/** Controlled pagination: navigation state is supplied by the product/query owner. */
export function WMPagination({ page, pageCount, onPageChange, disabled = false, previousLabel = 'Previous page', nextLabel = 'Next page', buttonProps, className, ...props }: WMPaginationProps) {
  const safeCount = Math.max(1, pageCount);
  const safePage = Math.min(Math.max(1, page), safeCount);
  return (
    <nav {...props} className={classes('wm-pagination', className)} aria-label="Pagination">
      <button {...buttonProps} type="button" className={classes('wm-button wm-button--tertiary wm-control--sm', buttonProps?.className)} aria-label={previousLabel} disabled={disabled || safePage <= 1} onClick={() => onPageChange(safePage - 1)}>Previous</button>
      <span className="wm-pagination-status" aria-current="page">Page {safePage} of {safeCount}</span>
      <button {...buttonProps} type="button" className={classes('wm-button wm-button--tertiary wm-control--sm', buttonProps?.className)} aria-label={nextLabel} disabled={disabled || safePage >= safeCount} onClick={() => onPageChange(safePage + 1)}>Next</button>
    </nav>
  );
}

export interface WMDenseDataViewportProps extends HTMLAttributes<HTMLDivElement> {
  readonly label: string;
  readonly children: ReactNode;
}

/** Keyboard-focusable overflow viewport; table/list semantics stay with descendants. */
export function WMDenseDataViewport({ label, className, children, tabIndex = 0, ...props }: WMDenseDataViewportProps) {
  return <div {...props} className={classes('wm-dense-data-viewport', className)} role="region" aria-label={label} tabIndex={tabIndex}>{children}</div>;
}
