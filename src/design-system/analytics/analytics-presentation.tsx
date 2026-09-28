import type { HTMLAttributes, ReactNode } from 'react';

export type WMAnalyticsDensity = 'comfortable' | 'compact';
export type WMMetricTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type WMTrendDirection = 'up' | 'down' | 'flat';

function classes(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export interface WMDashboardGridProps extends HTMLAttributes<HTMLDivElement> {
  readonly density?: WMAnalyticsDensity;
  readonly minColumnWidth?: 'sm' | 'md' | 'lg';
}

export function WMDashboardGrid({ density = 'comfortable', minColumnWidth = 'md', className, ...props }: WMDashboardGridProps) {
  return <div {...props} className={classes('wm-dashboard-grid', className)} data-density={density} data-min-column-width={minColumnWidth} />;
}

export interface WMMetricCardProps extends HTMLAttributes<HTMLElement> {
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly supportingText?: ReactNode;
  readonly trend?: ReactNode;
  readonly tone?: WMMetricTone;
}

export function WMMetricCard({ label, value, supportingText, trend, tone = 'neutral', className, ...props }: WMMetricCardProps) {
  return (
    <article {...props} className={classes('wm-metric-card', className)} data-tone={tone}>
      <div className="wm-metric-card-label">{label}</div>
      <div className="wm-metric-card-value">{value}</div>
      {(supportingText || trend) ? <div className="wm-metric-card-support">{supportingText ? <span>{supportingText}</span> : null}{trend}</div> : null}
    </article>
  );
}

export interface WMMetricValueProps extends HTMLAttributes<HTMLSpanElement> {
  readonly children: ReactNode;
  readonly unit?: ReactNode;
}

export function WMMetricValue({ children, unit, className, ...props }: WMMetricValueProps) {
  return <span {...props} className={classes('wm-metric-value', className)}><span className="wm-metric-value-number">{children}</span>{unit ? <span className="wm-metric-value-unit">{unit}</span> : null}</span>;
}

export interface WMTrendIndicatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  readonly direction: WMTrendDirection;
  readonly value?: ReactNode;
  readonly label: ReactNode;
}

export function WMTrendIndicator({ direction, value, label, className, ...props }: WMTrendIndicatorProps) {
  const glyph = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
  return (
    <span {...props} className={classes('wm-trend-indicator', className)} data-direction={direction}>
      <span aria-hidden="true" className="wm-trend-indicator-glyph">{glyph}</span>
      {value ? <span className="wm-trend-indicator-value">{value}</span> : null}
      <span className="wm-trend-indicator-label">{label}</span>
    </span>
  );
}

export interface WMChartPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

export function WMChartPanel({ title, description, actions, children, footer, className, ...props }: WMChartPanelProps) {
  return (
    <section {...props} className={classes('wm-chart-panel', className)}>
      <header className="wm-chart-panel-header">
        <div className="wm-chart-panel-heading"><h3>{title}</h3>{description ? <p>{description}</p> : null}</div>
        {actions ? <div className="wm-chart-panel-actions">{actions}</div> : null}
      </header>
      <div className="wm-chart-panel-body">{children}</div>
      {footer ? <footer className="wm-chart-panel-footer">{footer}</footer> : null}
    </section>
  );
}

export interface WMAnalyticsContextProps extends HTMLAttributes<HTMLDivElement> {
  readonly label: ReactNode;
  readonly value: ReactNode;
}

export function WMAnalyticsContext({ label, value, className, ...props }: WMAnalyticsContextProps) {
  return <div {...props} className={classes('wm-analytics-context', className)}><span className="wm-analytics-context-label">{label}</span><strong className="wm-analytics-context-value">{value}</strong></div>;
}
