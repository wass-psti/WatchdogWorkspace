import type { HTMLAttributes, ReactNode } from 'react';
import type { WorkManagementFeedbackAnnouncement } from '../feedback-system.ts';
import { WMFeedbackState } from './feedback-state.tsx';

export interface WMLoadingStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly announcement?: WorkManagementFeedbackAnnouncement;
}

export function WMLoadingState({ title, description, announcement='none', ...props }: WMLoadingStateProps) {
  return <WMFeedbackState {...props} kind="loading" tone="neutral" title={title} description={description} announcement={announcement} />;
}
