import type { ReactNode } from 'react';
import { WMStatusMessage } from './status-message.tsx';
import type { WorkManagementFeedbackTone } from '../feedback-system.ts';

export interface WMNotificationItem {
  readonly id: string;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly tone?: WorkManagementFeedbackTone;
  readonly actions?: ReactNode;
}

export interface WMNotificationStackProps {
  readonly items: readonly WMNotificationItem[];
  readonly ariaLabel?: string;
}

export function WMNotificationStack({ items, ariaLabel = 'Notifications' }: WMNotificationStackProps) {
  return (
    <section className="wm-notification-stack" aria-label={ariaLabel} data-wm-interaction="notification-stack">
      {items.map((item) => (
        <WMStatusMessage
          key={item.id}
          title={item.title}
          {...(item.description === undefined ? {} : { description: item.description })}
          {...(item.tone === undefined ? {} : { tone: item.tone })}
          {...(item.actions === undefined ? {} : { actions: item.actions })}
          announcement="none"
        />
      ))}
    </section>
  );
}
