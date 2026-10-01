export const workManagementSharedPrimitiveSystem = Object.freeze({
  milestone: 80,
  stage: 'I',
  program: 'futuristic-minimalist-visual-system-migration',
  publicApi: 'src/design-system/shared-primitives/index.ts',
  rootPublicApi: 'src/design-system/index.ts',
  presentationAuthorities: Object.freeze([
    'assets/css/foundation/components.css',
    'assets/css/foundation/interactions.css',
  ] as const),
  canonical: Object.freeze({
    actions: Object.freeze(['button', 'icon-button'] as const),
    fields: Object.freeze(['input', 'textarea', 'selector', 'search-input'] as const),
    filtering: Object.freeze(['filter-bar', 'filter-chip'] as const),
    identity: Object.freeze(['badge', 'icon'] as const),
    feedback: Object.freeze(['alert'] as const),
    controls: Object.freeze(['checkbox', 'switch', 'segmented-control'] as const),
    floating: Object.freeze(['tooltip', 'menu', 'popover'] as const),
    surfaces: Object.freeze(['card'] as const),
  }),
  accessibility: Object.freeze({
    nativeSemanticsFirst: true,
    iconOnlyActionsRequireAccessibleName: true,
    searchRequiresAccessibleName: true,
    selectorUsesNativeSelectSemantics: true,
    filterSelectionUsesAriaPressed: true,
    segmentedControlUsesGroupedPressedButtons: true,
    keyboardArrowNavigationForSegmentedControl: true,
    disabledAndBusyStatesRemainNativeWhereAvailable: true,
    focusVisibilityInheritedFromCertifiedFoundation: true,
    reducedMotionInheritedFromCertifiedFoundation: true,
    noPositiveTabIndex: true,
  }),
  interactionStates: Object.freeze([
    'default', 'hover', 'focus-visible', 'active', 'selected', 'disabled', 'busy', 'invalid',
  ] as const),
  architecture: Object.freeze({
    composesCertifiedM64M67Authorities: true,
    doesNotForkLegacyPrimitiveImplementations: true,
    noBusinessLogicOwnership: true,
    noPersistenceOwnership: true,
    noAuthorizationOwnership: true,
    noDatabaseOrMigrationMutation: true,
    noConsumerMigrationRequiredInM80: true,
    consumerMigrationBeginsWithM81Plus: true,
  }),
} as const);

export type WorkManagementSharedPrimitiveCategory = keyof typeof workManagementSharedPrimitiveSystem.canonical;
