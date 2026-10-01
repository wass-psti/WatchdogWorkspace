export const workManagementOverlayFeedbackSystem = Object.freeze({
  milestone: 91,
  stage: 'I',
  ownership: 'successor-composition-over-m63-m66-m67-with-runtime-authorities-preserved',
  surfaces: Object.freeze([
    'modal', 'drawer', 'popover', 'menu', 'alert', 'notification', 'confirmation', 'feedback-announcement',
  ] as const),
  hierarchy: Object.freeze({
    rootInteractivePortal: '#overlayRoot',
    rootFeedbackPortal: '#toastRoot',
    rootOverlayBranchIsExclusive: true,
    explicitParentChildBranchesRemainAllowed: true,
    topmostDismissibleLayerOwnsEscape: true,
    modalAndDrawerUseDialogFocusLifecycle: true,
    anchoredGeometryRemainsFloatingUiOwned: true,
    toastQueueRemainsCompatibilityRuntimeOwned: true,
  }),
  accessibility: Object.freeze({
    arkDialogMenuPopoverSemanticsRemainAuthoritative: true,
    focusTrapAndRestoreRemainPrimitiveOwned: true,
    triggerFocusRestorationRequired: true,
    alertDialogOutsideDismissalDisabled: true,
    escapeBehaviorMustNotBypassOverlayCoordinator: true,
    notificationsRemainVisibleInContext: true,
    transientAnnouncementsRemainM63LiveRegionOwned: true,
    reducedMotionMustRemainUsable: true,
    forcedColorsMustRemainLegible: true,
  }),
  responsive: Object.freeze({
    modalViewportContained: true,
    drawersCollapseToBottomSheetOnNarrowViewports: true,
    anchoredSurfacesRemainViewportContained: true,
    mobileTouchTargetsRemainPractical: true,
  }),
  preservation: Object.freeze({
    m63AccessibilityAuthority: true,
    m66OverlayAuthority: true,
    m67FeedbackAuthority: true,
    m80SharedPrimitiveAuthority: true,
    m81ShellOverlayAuthority: true,
    featureStateAndMutationRemainProductOwned: true,
    noSchemaMigrationRequired: true,
    noBackendMutationRequired: true,
    noAuthorizationSemanticChange: true,
  }),
});

export type WorkManagementM91Surface = (typeof workManagementOverlayFeedbackSystem.surfaces)[number];
