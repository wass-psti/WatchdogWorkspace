import type { HTMLAttributes, ReactNode } from 'react';
import type { WorkManagementFeedbackAnnouncement, WorkManagementFeedbackTone } from '../feedback-system.ts';

export interface WMFeedbackCopyProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
  readonly actions?: ReactNode;
}

export function announcementProps(announcement: WorkManagementFeedbackAnnouncement): Pick<HTMLAttributes<HTMLElement>, 'role' | 'aria-live' | 'aria-atomic'> {
  if (announcement === 'assertive') return { role: 'alert', 'aria-live': 'assertive', 'aria-atomic': true };
  if (announcement === 'polite') return { role: 'status', 'aria-live': 'polite', 'aria-atomic': true };
  return {};
}

export function toneData(tone: WorkManagementFeedbackTone) { return { 'data-tone': tone } as const; }
