import type { HTMLAttributes, ReactNode } from 'react';
import { WMStatusMessage } from '../feedback/status-message.tsx';
import type { WorkManagementFeedbackAnnouncement, WorkManagementFeedbackTone } from '../feedback-system.ts';

export interface WMAlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly tone?: WorkManagementFeedbackTone;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
  readonly actions?: ReactNode;
  readonly announcement?: WorkManagementFeedbackAnnouncement;
}

export function WMAlert(props: WMAlertProps) {
  return <WMStatusMessage {...props} data-wm-shared-primitive="alert" />;
}
