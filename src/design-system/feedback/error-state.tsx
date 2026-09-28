import type { HTMLAttributes, ReactNode } from 'react';
import type { WorkManagementFeedbackAnnouncement } from '../feedback-system.ts';
import { announcementProps } from './shared.tsx';

export interface WMErrorStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
  readonly actions?: ReactNode;
  readonly announcement?: WorkManagementFeedbackAnnouncement;
}

export function WMErrorState({ title, description, icon, actions, announcement='none', className, ...props }: WMErrorStateProps) {
  return <div {...props} {...announcementProps(announcement)} data-tone="danger" className={['wm-feedback-state', 'wm-error-state', className ?? ''].filter(Boolean).join(' ')} data-wm-component="error-state" data-wm-feedback-kind="error">{icon ? <div className="wm-feedback-state-icon" aria-hidden="true">{icon}</div> : null}<div className="wm-feedback-state-copy"><h3>{title}</h3>{description ? <p>{description}</p> : null}{actions ? <div className="wm-feedback-actions">{actions}</div> : null}</div></div>;
}
