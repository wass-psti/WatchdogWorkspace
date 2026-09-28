export const workManagementOverlays = Object.freeze({
  milestone: 66,
  typedAuthority: 'src/design-system/overlay-system.ts',
  interactionAuthority: 'src/design-system/interactions',
  globalRuntimeAuthority: 'assets/js/platform/ui/global-overlay-runtime.ts',
  compatibilityCoordinator: 'assets/js/platform/ui/overlay-manager.ts',
  portalRoots: Object.freeze({
    interactive: '#overlayRoot',
    feedback: '#toastRoot',
  }),
  kinds: Object.freeze({
    modal: Object.freeze(['dialog', 'alertdialog'] as const),
    anchoredInteractive: Object.freeze(['menu', 'popover', 'choice-surface'] as const),
    anchoredDescriptive: Object.freeze(['tooltip'] as const),
  }),
  contracts: Object.freeze({
    arkOwnsDialogMenuPopoverTooltipSemantics: true,
    floatingUiOwnsGeometryOnly: true,
    pageLifetimeInteractivePortalRoot: true,
    oneActiveRootOverlayBranch: true,
    explicitParentChildOverlayBranchesAllowed: true,
    escapeClosesTopmostDismissibleLayer: true,
    outsideDismissalIsOwnerControlled: true,
    modalFocusLifecycleOwnedByDialogPrimitive: true,
    anchoredSurfacesMustRemainViewportContained: true,
    customChoiceSurfacesUseAnchoredOverlayContract: true,
    feedbackToastRootReservedForM67: true,
    noFeatureConsumerRewriteInM66: true,
  }),
  successorBoundaries: Object.freeze({
    feedbackStatusEmptyErrorUx: 67,
    shellMigration: 72,
    boardsMigration: 73,
    timeTrackerMigration: 74,
    fuelTrackMigration: 75,
    tradeLinkMigration: 76,
  }),
});

export type WorkManagementOverlayKind =
  | (typeof workManagementOverlays.kinds.modal)[number]
  | (typeof workManagementOverlays.kinds.anchoredInteractive)[number]
  | (typeof workManagementOverlays.kinds.anchoredDescriptive)[number];

export type WorkManagementFloatingSurfaceWidth = 'content' | 'bounded' | 'reference';
