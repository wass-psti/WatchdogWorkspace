export const workManagementInteractionStateHarmonizationSystem = Object.freeze({
  milestone: 93,
  stage: 'I',
  semanticsVersion: '1.43.2-m93-v1',
  scope: Object.freeze([
    'focus-visible',
    'hover',
    'active',
    'disabled',
    'validation',
    'keyboard',
    'contrast',
    'reduced-motion',
  ]),
  focus: Object.freeze({
    visibleOnly: true,
    keyboardFocusMustRemainVisible: true,
    pointerFocusDoesNotForceRing: true,
    forcedColorsUsesHighlight: true,
    noPositiveTabIndex: true,
  }),
  keyboard: Object.freeze({
    nativeControlsFirst: true,
    tabOrderFollowsDom: true,
    enterAndSpacePreserveNativeActivation: true,
    escapeOwnershipRemainsWithOverlayAuthority: true,
    rovingFocusOwnershipRemainsWithCompositePrimitiveAuthority: true,
  }),
  pointer: Object.freeze({
    hoverRequiresHoverCapablePointer: true,
    activeNeverOverridesDisabled: true,
    disabledSuppressesInteractiveMotion: true,
  }),
  validation: Object.freeze({
    ariaInvalidRemainsSemanticAuthority: true,
    visualErrorStateMustNotBeColorOnly: true,
    requiredStateDoesNotImplyInvalidState: true,
  }),
  contrast: Object.freeze({
    focusUsesSemanticFocusColor: true,
    validationUsesSemanticNegativeColor: true,
    forcedColorsRetainsSystemContrast: true,
  }),
  motion: Object.freeze({
    reducedMotionRemovesInteractionTransforms: true,
    reducedMotionRemovesDecorativeAnimation: true,
    stateChangesRemainPerceivableWithoutMotion: true,
  }),
  visualBoundary: Object.freeze({
    noLayoutMutation: true,
    noTypographyMutation: true,
    noDefaultRestingStateRedesign: true,
    accessibilityEnhancementMustNotIntroduceDecorativeVisualEffects: true,
  }),
  preservedAuthorities: Object.freeze({
    accessibilityFoundationMilestone: 63,
    formValidationMilestone: 65,
    motionContinuityMilestone: 71,
    sharedPrimitivesMilestone: 80,
    shellNavigationMilestone: 81,
    overlayFeedbackMilestone: 91,
    stateSystemMilestone: 92,
  }),
  backendMutationRequired: false,
  schemaMigrationRequired: false,
  authorizationSemanticChange: false,
  persistenceSemanticChange: false,
});

export type WorkManagementInteractionState =
  | 'rest'
  | 'hover'
  | 'active'
  | 'focus-visible'
  | 'disabled'
  | 'validation-error';
