export type WMMotionContinuityKind = 'route' | 'state' | 'overlay' | 'feedback' | 'decorative' | 'static';
export type WMMotionContinuityPriority = 'essential' | 'supporting' | 'decorative';

export const workManagementMotionContinuitySystem = Object.freeze({
  milestone: 71,
  stage: 'H',
  semanticsVersion: '1.43.2-m71-v1',
  continuityKinds: Object.freeze(['route','state','overlay','feedback','decorative','static'] as const),
  policies: Object.freeze({
    motionMustPreserveInteractionOwnership: true,
    routeMotionTargetsReplaceableContentOnly: true,
    persistentShellChromeMustNotBeRouteAnimated: true,
    reducedMotionRemovesSpatialAndDecorativeMotion: true,
    stateChangesPreferShortNonBlockingTransitions: true,
    overlayLifecycleRemainsM66Owned: true,
    feedbackSemanticsRemainM67Owned: true,
    analyticsSemanticsRemainM70Owned: true,
    transformsAndOpacityArePreferredForCompositorFriendlyMotion: true,
    willChangeMustNotBeAppliedPermanently: true,
    noDocumentWideViewTransitionsInM71: true,
    noConsumerRewriteRequiredInM71: true,
  }),
  successorBoundaries: Object.freeze({ hostMigration:72, boardsMigration:73, timeTrackerMigration:74, fuelTrackMigration:75, tradeLinkMigration:76 }),
});
export type WorkManagementMotionContinuitySystem = typeof workManagementMotionContinuitySystem;
