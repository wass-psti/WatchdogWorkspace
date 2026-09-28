export const coreComponentArchitecture = Object.freeze({
  milestone: 64,
  stage: 'H',
  typedAuthority: 'src/design-system/core-component-system.ts',
  publicApi: 'src/design-system/index.ts',
  presentationAuthority: 'assets/css/foundation/components.css',
  interactionAuthority: 'src/design-system/interactions',
  interactionPresentationAuthority: 'assets/css/foundation/interactions.css',
  policies: Object.freeze({
    typedReactApiIsCanonical: true,
    frameworkAgnosticCssRemainsCompatibilityAuthority: true,
    preserveCertifiedInteractionImplementations: true,
    additiveConsolidationOnly: true,
    noFeatureConsumerRewriteInM64: true,
    noBusinessLogicOwnership: true,
  }),
  successorBoundaries: Object.freeze({ formsAndDataEntry: 65, overlays: 66, feedback: 67, shell: 72, boards: 73, timeTracker: 74, fuelTrack: 75, tradeLink: 76 }),
});
