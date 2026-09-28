import type { HTMLAttributes, ReactNode } from 'react';
import type {
  WorkManagementClusterGap,
  WorkManagementContentWidth,
  WorkManagementGridColumns,
  WorkManagementGridGap,
  WorkManagementStackGap,
} from '../layout-system.ts';
import type { WorkManagementAdaptiveCollapse } from '../responsive-system.ts';

export interface WMLayoutProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
}

export interface WMStackProps extends WMLayoutProps {
  readonly gap?: WorkManagementStackGap;
}

export interface WMClusterProps extends WMLayoutProps {
  readonly gap?: WorkManagementClusterGap;
  readonly stackAt?: WorkManagementAdaptiveCollapse;
}

export interface WMGridProps extends WMLayoutProps {
  readonly columns?: WorkManagementGridColumns;
  readonly gap?: WorkManagementGridGap;
  readonly collapseAt?: WorkManagementAdaptiveCollapse;
}

export interface WMPageProps extends HTMLAttributes<HTMLElement> {
  readonly children?: ReactNode;
  readonly width?: WorkManagementContentWidth;
}

export interface WMSectionProps extends HTMLAttributes<HTMLElement> {
  readonly children?: ReactNode;
}

export interface WMContainerProps extends WMLayoutProps {
  readonly width?: WorkManagementContentWidth;
}

function classes(base: string, className?: string): string {
  return className ? `${base} ${className}` : base;
}

export function WMStack({ gap = 'md', className, children, ...props }: WMStackProps) {
  const dataGap = gap === 'md' ? undefined : gap;
  return <div {...props} className={classes('wm-stack', className)} data-gap={dataGap}>{children}</div>;
}

export function WMCluster({ gap = 'compact', stackAt, className, children, ...props }: WMClusterProps) {
  const dataGap = gap === 'compact' ? undefined : gap;
  return <div {...props} className={classes('wm-cluster', className)} data-gap={dataGap} data-stack-at={stackAt}>{children}</div>;
}

export function WMGrid({ columns, gap = 'standard', collapseAt, className, children, ...props }: WMGridProps) {
  const dataGap = gap === 'standard' ? undefined : gap;
  return <div {...props} className={classes('wm-grid', className)} data-columns={columns} data-gap={dataGap} data-collapse-at={collapseAt}>{children}</div>;
}

export function WMPage({ width = 'content', className, children, ...props }: WMPageProps) {
  const dataWidth = width === 'content' ? undefined : width;
  return <main {...props} className={classes('wm-page', className)} data-width={dataWidth}>{children}</main>;
}

export function WMSection({ className, children, ...props }: WMSectionProps) {
  return <section {...props} className={classes('wm-section', className)}>{children}</section>;
}

export function WMContainer({ width = 'content', className, children, ...props }: WMContainerProps) {
  const dataWidth = width === 'content' ? undefined : width;
  return <div {...props} className={classes('wm-container', className)} data-width={dataWidth}>{children}</div>;
}
