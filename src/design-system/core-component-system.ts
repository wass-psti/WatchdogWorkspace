export const workManagementCoreComponents = Object.freeze({
  milestone: 64,
  publicApi: 'src/design-system/index.ts',
  presentationAuthority: 'assets/css/foundation/components.css',
  interactionPresentationAuthority: 'assets/css/foundation/interactions.css',
  componentIdentityAttribute: 'data-wm-component',
  canonical: Object.freeze({
    layout: Object.freeze(['stack', 'cluster', 'grid', 'page', 'section', 'container'] as const),
    content: Object.freeze(['surface', 'divider', 'text', 'heading', 'kicker', 'badge'] as const),
    actions: Object.freeze(['button', 'icon-button', 'toolbar', 'toolbar-group'] as const),
    selection: Object.freeze(['tabs', 'checkbox', 'switch', 'collapsible'] as const),
    overlays: Object.freeze(['dialog', 'menu', 'popover', 'tooltip'] as const),
    accessibility: Object.freeze(['live-region', 'visually-hidden'] as const),
  }),
  contracts: Object.freeze({
    typedReactApiIsCanonical: true,
    frameworkAgnosticCssRemainsCompatibilityAuthority: true,
    nativeSemanticsFirst: true,
    m64ComponentsExposeStableIdentity: true,
    noFeatureConsumerRewriteRequiredInM64: true,
    noBusinessLogicOwnership: true,
  }),
  successorBoundaries: Object.freeze({
    formsAndDataEntry: 65,
    overlayArchitecture: 66,
    feedbackAndEmptyStates: 67,
    shellMigration: 72,
    boardsMigration: 73,
    timeTrackerMigration: 74,
    fuelTrackMigration: 75,
    tradeLinkMigration: 76,
  }),
});

export type WorkManagementCoreComponentCategory = keyof typeof workManagementCoreComponents.canonical;
