import type { HTMLAttributes, ReactNode } from 'react';

export interface WMEmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
  readonly actions?: ReactNode;
}

export function WMEmptyState({ title, description, icon, actions, className, ...props }: WMEmptyStateProps) {
  return <div {...props} className={['wm-empty-state', className ?? ''].filter(Boolean).join(' ')} data-wm-component="empty-state">{icon ? <div className="wm-feedback-state-icon" aria-hidden="true">{icon}</div> : null}<div className="wm-feedback-state-copy"><h3>{title}</h3>{description ? <p>{description}</p> : null}{actions ? <div className="wm-feedback-actions">{actions}</div> : null}</div></div>;
}
