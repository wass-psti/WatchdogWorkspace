import type { HTMLAttributes, ReactNode } from 'react';

export const workManagementAccessibility = Object.freeze({
  milestone: 63,
  focus: Object.freeze({ visibleOnly: true, preservesNativeKeyboardModality: true, forcedColorsUsesHighlight: true }),
  targets: Object.freeze({ coarsePointerMinimumCssPx: 44, sharedOptInClass: 'wm-a11y-target' }),
  liveRegions: Object.freeze({ polite: 'polite', assertive: 'assertive', atomicByDefault: true }),
  keyboard: Object.freeze({ nativeControlsFirst: true, escapeDismissesDismissibleOverlays: true, tabOrderFollowsDom: true, noPositiveTabIndex: true }),
  semantics: Object.freeze({ nativeElementsPreferred: true, iconOnlyControlsRequireAccessibleName: true, busyStateUsesAriaBusy: true, invalidStateUsesAriaInvalid: true }),
  preferences: Object.freeze({ reducedMotion: 'prefers-reduced-motion', forcedColors: 'forced-colors' }),
  migration: Object.freeze({ componentConsolidationMilestone: 64, hostMilestone: 72, boardsMilestone: 73, timeTrackerMilestone: 74, fuelTrackMilestone: 75, tradeLinkMilestone: 76 }),
});

export type WorkManagementLivePoliteness = 'polite' | 'assertive';

export interface WMLiveRegionProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
  readonly politeness?: WorkManagementLivePoliteness;
  readonly atomic?: boolean;
  readonly visuallyHidden?: boolean;
}

export function WMLiveRegion({ children, className, politeness = 'polite', atomic = true, visuallyHidden = false, ...props }: WMLiveRegionProps) {
  const classes = ['wm-a11y-live-region', visuallyHidden ? 'wm-visually-hidden' : '', className ?? ''].filter(Boolean).join(' ');
  return <div {...props} className={classes} role={politeness === 'assertive' ? 'alert' : 'status'} aria-live={politeness} aria-atomic={atomic}>{children}</div>;
}

export interface WMVisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> { readonly children?: ReactNode; }
export function WMVisuallyHidden({ children, className, ...props }: WMVisuallyHiddenProps) {
  return <span {...props} className={['wm-visually-hidden', className ?? ''].filter(Boolean).join(' ')}>{children}</span>;
}
