export const systemFeedbackArchitecture = Object.freeze({
  milestone: 67,
  stage: 'H',
  typedAuthority: 'src/design-system/feedback-system.ts',
  presentationAuthority: 'assets/css/foundation/feedback-system.css',
  policies: Object.freeze({
    persistentStatesRemainVisibleInContext: true,
    persistentStatesDoNotAutoAnnounce: true,
    emptyStatesDoNotAutoAnnounce: true,
    loadingUsesAriaBusyAndVisibleText: true,
    recoverableErrorsExposeActions: true,
    assertiveAnnouncementsRequireExplicitUrgency: true,
    transientAnnouncementsReuseM63LiveRegions: true,
    preserveM14GlobalToastQueue: true,
    preserveM66ToastPortalOwnership: true,
    noFeatureConsumerRewriteInM67: true,
  }),
  successorBoundaries: Object.freeze({ applicationShellAndNavigation: 68, hostMigration: 72, boardsMigration: 73, timeTrackerMigration: 74, fuelTrackMigration: 75, tradeLinkMigration: 76 }),
});
