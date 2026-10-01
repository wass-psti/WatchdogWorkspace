export type WorkManagementMotionDomain = 'route' | 'state' | 'interaction-feedback' | 'overlay' | 'persistent-shell' | 'decorative';

export const workManagementMotionTransitionArchitectureSystem = Object.freeze({
  milestone: 94,
  stage: 'I',
  semanticsVersion: '1.43.2-m94-v1',
  domains: Object.freeze(['route','state','interaction-feedback','overlay','persistent-shell','decorative'] as const),
  orchestration: Object.freeze({
    singleGlobalPreferenceAuthority: true,
    cancellationUsesTransitionEpochs: true,
    staleTransitionsMustNotCommit: true,
    routeMotionTargetsReplaceableContentOnly: true,
    stateMotionMustNotDelayInteractionOwnership: true,
  }),
  shell: Object.freeze({
    persistentShellTransformsForbidden: true,
    persistentShellGeometryAnimationForbidden: true,
    shellFeedbackLimitedToNonSpatialProperties: true,
    navigationSemanticsRemainM81Owned: true,
  }),
  reducedMotion: Object.freeze({
    spatialMotionDisabled: true,
    decorativeAnimationDisabled: true,
    transitionLatencyMinimized: true,
    essentialStateChangeRemainsPerceivable: true,
  }),
  boundaries: Object.freeze({
    continuityAuthorityMilestone: 71,
    accessibilityAuthorityMilestone: 63,
    shellAuthorityMilestone: 81,
    overlayAuthorityMilestone: 91,
    interactionStateAuthorityMilestone: 93,
    noBackendMutation: true,
    noSchemaMigration: true,
    noAuthorizationSemanticChange: true,
    noPersistenceSemanticChange: true,
  }),
});
export type WorkManagementMotionTransitionArchitectureSystem = typeof workManagementMotionTransitionArchitectureSystem;
