export const workManagementFeedback = Object.freeze({
  milestone: 67,
  typedAuthority: 'src/design-system/feedback-system.ts',
  presentationAuthority: 'assets/css/foundation/feedback-system.css',
  liveRegionAuthority: 'src/design-system/accessibility-system.tsx',
  globalToastRuntimeAuthority: 'src/app/shared-ui/shared-application-ui-runtime.ts',
  toastPortalRoot: '#toastRoot',
  kinds: Object.freeze(['status', 'loading', 'empty', 'error', 'success'] as const),
  tones: Object.freeze(['neutral', 'info', 'success', 'warning', 'danger'] as const),
  announcements: Object.freeze(['none', 'polite', 'assertive'] as const),
  contracts: Object.freeze({
    persistentFeedbackRemainsVisibleInContext: true,
    persistentFeedbackIsNotLiveByDefault: true,
    emptyStatesAreNotLiveByDefault: true,
    recoverableErrorsExposeActionSlots: true,
    errorStatesAreNotAssertiveUnlessRequested: true,
    loadingStateUsesAriaBusy: true,
    loadingStateRequiresVisibleText: true,
    transientAnnouncementsReuseM63LiveRegionAuthority: true,
    colorIsNeverTheOnlyMeaningChannel: true,
    globalToastQueueRemainsM14CompatibilityAuthority: true,
    toastRootIsPageLifetime: true,
    noFeatureConsumerRewriteInM67: true,
  }),
  successorBoundaries: Object.freeze({
    applicationShellAndNavigation: 68,
    hostMigration: 72,
    boardsMigration: 73,
    timeTrackerMigration: 74,
    fuelTrackMigration: 75,
    tradeLinkMigration: 76,
  }),
});

export type WorkManagementFeedbackKind = (typeof workManagementFeedback.kinds)[number];
export type WorkManagementFeedbackTone = (typeof workManagementFeedback.tones)[number];
export type WorkManagementFeedbackAnnouncement = (typeof workManagementFeedback.announcements)[number];
