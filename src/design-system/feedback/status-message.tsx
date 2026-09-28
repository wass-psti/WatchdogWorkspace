import type { HTMLAttributes, ReactNode } from 'react';
import type { WorkManagementFeedbackAnnouncement, WorkManagementFeedbackTone } from '../feedback-system.ts';
import { announcementProps, toneData } from './shared.tsx';

export interface WMStatusMessageProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly tone?: WorkManagementFeedbackTone;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
  readonly actions?: ReactNode;
  readonly announcement?: WorkManagementFeedbackAnnouncement;
}

export function WMStatusMessage({ tone='info', title, description, icon, actions, announcement='none', className, ...props }: WMStatusMessageProps) {
  return <div {...props} {...announcementProps(announcement)} {...toneData(tone)} className={['wm-alert', 'wm-status-message', className ?? ''].filter(Boolean).join(' ')} data-wm-component="status-message">{icon ? <div className="wm-status-message-icon" aria-hidden="true">{icon}</div> : null}<div className="wm-status-message-copy"><strong>{title}</strong>{description ? <p>{description}</p> : null}{actions ? <div className="wm-feedback-actions">{actions}</div> : null}</div></div>;
}
