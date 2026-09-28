import type { HTMLAttributes, ReactNode, TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';

export type WMDataDensity = 'compact' | 'default';
export type WMDataLayout = 'auto' | 'fixed';
export type WMDataAlign = 'start' | 'center' | 'end';
export type WMDataWrap = 'wrap' | 'nowrap' | 'truncate';
export type WMDataSort = 'ascending' | 'descending' | 'none' | 'other';

function classes(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export interface WMDataRegionProps extends HTMLAttributes<HTMLDivElement> {
  readonly density?: WMDataDensity;
  readonly label?: string;
  readonly children: ReactNode;
}

export function WMDataRegion({ density = 'default', label, className, children, ...props }: WMDataRegionProps) {
  return (
    <div
      {...props}
      className={classes('wm-data-region', className)}
      data-density={density}
      aria-label={label}
    >
      {children}
    </div>
  );
}

export interface WMTableProps extends TableHTMLAttributes<HTMLTableElement> {
  readonly density?: WMDataDensity;
  readonly layout?: WMDataLayout;
}

export function WMTable({ density = 'default', layout = 'auto', className, ...props }: WMTableProps) {
  return <table {...props} className={classes('wm-table', className)} data-density={density} data-layout={layout} />;
}

export interface WMTableHeaderCellProps extends Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> {
  readonly align?: WMDataAlign;
  readonly wrap?: WMDataWrap;
  readonly sort?: WMDataSort;
}

export function WMTableHeaderCell({ align = 'start', wrap = 'wrap', sort, scope = 'col', ...props }: WMTableHeaderCellProps) {
  const sortProps = sort === undefined ? {} : { 'aria-sort': sort };
  return <th {...props} {...sortProps} scope={scope} data-align={align} data-wrap={wrap} />;
}

export interface WMTableCellProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
  readonly align?: WMDataAlign;
  readonly wrap?: WMDataWrap;
}

export function WMTableCell({ align = 'start', wrap = 'wrap', ...props }: WMTableCellProps) {
  return <td {...props} data-align={align} data-wrap={wrap} />;
}

export interface WMDataListProps extends HTMLAttributes<HTMLUListElement> {
  readonly density?: WMDataDensity;
}

export function WMDataList({ density = 'default', className, ...props }: WMDataListProps) {
  return <ul {...props} className={classes('wm-data-list', className)} data-density={density} />;
}

export interface WMDataListItemProps extends HTMLAttributes<HTMLLIElement> {
  readonly current?: boolean;
  readonly align?: WMDataAlign;
  readonly wrap?: WMDataWrap;
}

export function WMDataListItem({ current = false, align = 'start', wrap = 'wrap', className, ...props }: WMDataListItemProps) {
  return (
    <li
      {...props}
      className={classes('wm-data-list-item', current ? 'is-current' : undefined, className)}
      aria-current={current ? 'true' : undefined}
      data-align={align}
      data-wrap={wrap}
    />
  );
}
