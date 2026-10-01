import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import type { WorkManagementContentWidth, WorkManagementStackGap } from '../layout-system.ts';
import type { WorkManagementAdaptiveCollapse } from '../responsive-system.ts';
import {
  WMCluster,
  WMContainer,
  WMGrid,
  WMPage,
  WMSection,
  WMStack,
} from '../primitives/layout.tsx';
import { WMSurface } from '../primitives/surface.tsx';
import type {
  WorkManagementClusterProfile,
  WorkManagementGridProfile,
  WorkManagementLayoutDensity,
} from '../layout-composition-system.ts';

function classes(base: string, className?: string): string {
  return className ? `${base} ${className}` : base;
}

const explicitDensitySpace: Readonly<Record<Exclude<WorkManagementLayoutDensity, 'inherit'>, string>> = Object.freeze({
  compact: 'var(--wm-density-space-compact)',
  comfortable: 'var(--wm-density-space-comfortable)',
});

function withDensityStyle(
  density: WorkManagementLayoutDensity,
  style?: CSSProperties,
  property: 'gap' | 'padding' = 'gap',
): CSSProperties | undefined {
  if (density === 'inherit') return style;
  return { ...style, [property]: explicitDensitySpace[density] };
}

export interface WMPageLayoutProps extends HTMLAttributes<HTMLElement> {
  readonly children?: ReactNode;
  readonly width?: WorkManagementContentWidth;
  readonly density?: WorkManagementLayoutDensity;
}

export function WMPageLayout({ width = 'content', density = 'inherit', className, children, ...props }: WMPageLayoutProps) {
  return (
    <WMPage
      {...props}
      width={width}
      className={classes('wm-layout-page', className)}
      data-wm-page-layout=""
      data-wm-layout-density={density}
    >
      {children}
    </WMPage>
  );
}

export interface WMContentContainerProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
  readonly width?: WorkManagementContentWidth;
}

export function WMContentContainer({ width = 'content', className, children, ...props }: WMContentContainerProps) {
  return (
    <WMContainer {...props} width={width} className={classes('wm-layout-container', className)} data-wm-content-container="">
      {children}
    </WMContainer>
  );
}

export interface WMSectionLayoutProps extends HTMLAttributes<HTMLElement> {
  readonly children?: ReactNode;
  readonly density?: WorkManagementLayoutDensity;
}

export function WMSectionLayout({ density = 'inherit', style, className, children, ...props }: WMSectionLayoutProps) {
  return (
    <WMSection
      {...props}
      className={classes('wm-layout-section', className)}
      data-wm-section-layout=""
      data-wm-layout-density={density}
      style={withDensityStyle(density, style, 'gap')}
    >
      {children}
    </WMSection>
  );
}

export interface WMSurfaceSectionProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
  readonly density?: WorkManagementLayoutDensity;
  readonly elevation?: 'flat' | 'raised';
}

export function WMSurfaceSection({ density = 'inherit', elevation = 'flat', style, className, children, ...props }: WMSurfaceSectionProps) {
  return (
    <WMSurface
      {...props}
      elevation={elevation}
      className={classes('wm-layout-surface-section', className)}
      data-wm-surface-section=""
      data-wm-layout-density={density}
      style={withDensityStyle(density, style, 'padding')}
    >
      {children}
    </WMSurface>
  );
}

const gridProfiles: Readonly<Record<WorkManagementGridProfile, { columns: 1 | 2 | 3; collapseAt?: WorkManagementAdaptiveCollapse }>> = Object.freeze({
  single: Object.freeze({ columns: 1 }),
  split: Object.freeze({ columns: 2, collapseAt: 'tablet' }),
  dashboard: Object.freeze({ columns: 3, collapseAt: 'tablet' }),
  wideDashboard: Object.freeze({ columns: 3, collapseAt: 'laptop' }),
});

export interface WMResponsiveGridProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
  readonly profile?: WorkManagementGridProfile;
  readonly density?: WorkManagementLayoutDensity;
}

export function WMResponsiveGrid({ profile = 'split', density = 'inherit', style, className, children, ...props }: WMResponsiveGridProps) {
  const definition = gridProfiles[profile];
  const collapseProps = 'collapseAt' in definition ? { collapseAt: definition.collapseAt } : {};
  return (
    <WMGrid
      {...props}
      {...collapseProps}
      columns={definition.columns}
      className={classes('wm-layout-responsive-grid', className)}
      data-wm-responsive-grid={profile}
      data-wm-layout-density={density}
      style={withDensityStyle(density, style, 'gap')}
    >
      {children}
    </WMGrid>
  );
}

const clusterProfiles: Readonly<Record<WorkManagementClusterProfile, { stackAt?: WorkManagementAdaptiveCollapse }>> = Object.freeze({
  inline: Object.freeze({}),
  mobileStack: Object.freeze({ stackAt: 'narrow' }),
  tabletStack: Object.freeze({ stackAt: 'tablet' }),
});

export interface WMResponsiveClusterProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
  readonly profile?: WorkManagementClusterProfile;
  readonly density?: WorkManagementLayoutDensity;
}

export function WMResponsiveCluster({ profile = 'mobileStack', density = 'inherit', style, className, children, ...props }: WMResponsiveClusterProps) {
  const definition = clusterProfiles[profile];
  const stackProps = 'stackAt' in definition ? { stackAt: definition.stackAt } : {};
  return (
    <WMCluster
      {...props}
      {...stackProps}
      className={classes('wm-layout-responsive-cluster', className)}
      data-wm-responsive-cluster={profile}
      data-wm-layout-density={density}
      style={withDensityStyle(density, style, 'gap')}
    >
      {children}
    </WMCluster>
  );
}

export interface WMLayoutStackProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
  readonly gap?: WorkManagementStackGap;
  readonly density?: WorkManagementLayoutDensity;
}

export function WMLayoutStack({ gap = 'md', density = 'inherit', style, className, children, ...props }: WMLayoutStackProps) {
  return (
    <WMStack
      {...props}
      gap={gap}
      className={classes('wm-layout-stack', className)}
      data-wm-layout-stack=""
      data-wm-layout-density={density}
      style={withDensityStyle(density, style, 'gap')}
    >
      {children}
    </WMStack>
  );
}
