import type { HTMLAttributes, ReactNode } from 'react';
import { workManagementTypography, type WorkManagementTextFlow, type WorkManagementTypographyRole } from '../typography-system.ts';

export interface WMTextProps extends HTMLAttributes<HTMLParagraphElement> {
  readonly children?: ReactNode;
  readonly tone?: 'default' | 'muted';
  readonly role?: Exclude<WorkManagementTypographyRole, 'display' | 'pageTitle' | 'sectionTitle' | 'subsectionTitle'>;
  readonly flow?: WorkManagementTextFlow;
  readonly numeric?: boolean;
}


function classes(base: string, className?: string): string {
  return className ? `${base} ${className}` : base;
}

export function WMText({ tone = 'default', role, flow, numeric = false, className, children, ...props }: WMTextProps) {
  const semanticClasses = [
    tone === 'muted' ? 'wm-muted' : '',
    role ? workManagementTypography.roles[role] : '',
    flow ? workManagementTypography.contentFlow[flow] : '',
    numeric ? workManagementTypography.numeric : '',
    className ?? '',
  ].filter(Boolean).join(' ');
  return (
    <p {...props} className={semanticClasses || undefined}>
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
  readonly role?: 'display' | 'pageTitle' | 'sectionTitle' | 'subsectionTitle';
  readonly flow?: WorkManagementTextFlow;
}

export function WMHeading({ level = 2, role, flow, className, children, ...props }: WMHeadingProps) {
  const semanticClasses = [
    role ? workManagementTypography.roles[role] : '',
    flow ? workManagementTypography.contentFlow[flow] : '',
    className ?? '',
  ].filter(Boolean).join(' ');
  const headingProps = { ...props, className: semanticClasses || undefined };
  if (level === 1) return <h1 {...headingProps}>{children}</h1>;
  if (level === 3) return <h3 {...headingProps}>{children}</h3>;
  if (level === 4) return <h4 {...headingProps}>{children}</h4>;
  return <h2 {...headingProps}>{children}</h2>;
}

export function WMVisuallyHidden({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span {...props} className={classes('wm-visually-hidden', className)}>
      {children}
    </span>
  );
}
