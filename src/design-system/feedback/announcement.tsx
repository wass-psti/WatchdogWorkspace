import type { ReactNode } from 'react';
import { WMLiveRegion } from '../accessibility-system.tsx';

export interface WMFeedbackAnnouncementProps { readonly children?: ReactNode; readonly urgency?: 'polite' | 'assertive'; readonly visuallyHidden?: boolean; }
export function WMFeedbackAnnouncement({ children, urgency='polite', visuallyHidden=true }: WMFeedbackAnnouncementProps) {
  return <WMLiveRegion politeness={urgency} atomic visuallyHidden={visuallyHidden} data-wm-component="feedback-announcement">{children}</WMLiveRegion>;
}
