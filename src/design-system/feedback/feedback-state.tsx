import type { HTMLAttributes, ReactNode } from 'react';
import type { WorkManagementFeedbackAnnouncement, WorkManagementFeedbackKind, WorkManagementFeedbackTone } from '../feedback-system.ts';
import { announcementProps, toneData } from './shared.tsx';

export interface WMFeedbackStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly kind?: WorkManagementFeedbackKind;
  readonly tone?: WorkManagementFeedbackTone;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
  readonly actions?: ReactNode;
  readonly announcement?: WorkManagementFeedbackAnnouncement;
}

export function WMFeedbackState({ kind='status', tone='neutral', title, description, icon, actions, announcement='none', className, ...props }: WMFeedbackStateProps) {
  const busy = kind === 'loading';
  return (
    <div {...props} {...announcementProps(announcement)} {...toneData(tone)} className={['wm-feedback-state', className ?? ''].filter(Boolean).join(' ')} data-wm-component="feedback-state" data-wm-feedback-kind={kind} aria-busy={busy || undefined}>
      {icon ? <div className="wm-feedback-state-icon" aria-hidden="true">{icon}</div> : busy ? <div className="wm-feedback-state-icon" aria-hidden="true"><span className="wm-feedback-spinner" /></div> : null}
      <div className="wm-feedback-state-copy"><h3>{title}</h3>{description ? <p>{description}</p> : null}{actions ? <div className="wm-feedback-actions">{actions}</div> : null}</div>
    </div>
  );
}
