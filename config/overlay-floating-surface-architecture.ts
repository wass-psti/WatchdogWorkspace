export const overlayFloatingSurfaceArchitecture = Object.freeze({
  milestone: 66,
  stage: 'H',
  typedAuthority: 'src/design-system/overlay-system.ts',
  presentationAuthority: 'assets/css/foundation/overlay-system.css',
  policies: Object.freeze({
    preserveCertifiedArkInteractionImplementations: true,
    preserveM11GlobalOverlayRuntime: true,
    sharedPortalRootIsPageLifetime: true,
    rootOverlayBranchesAreExclusive: true,
    nestedOverlayBranchesRequireExplicitParentage: true,
    modalFocusLifecycleDelegatesToDialogPrimitive: true,
    anchoredGeometryDelegatesToFloatingOrArkPositioning: true,
    customChoiceSurfacesAreAnchoredInteractiveOverlays: true,
    feedbackAndToastSemanticsRemainM67Owned: true,
    noFeatureConsumerRewriteInM66: true,
  }),
  successorBoundaries: Object.freeze({ feedbackStatusEmptyErrorUx: 67, shellMigration: 72, boardsMigration: 73, timeTrackerMigration: 74, fuelTrackMigration: 75, tradeLinkMigration: 76 }),
});
