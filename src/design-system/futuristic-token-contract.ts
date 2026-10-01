/**
 * Stage I M79 — product-facing contract for the Futuristic Minimalist token system.
 *
 * The contract contains references only. CSS remains the cross-runtime value
 * authority so React, the host runtime, and embedded modules resolve the same
 * semantic roles without importing a framework-specific theme object.
 */
export const futuristicMinimalistTokenContract = Object.freeze({
  semanticsVersion: '1.43.2-m79-v1',
  architecture: 'primitive -> semantic -> component -> compatibility',
  categories: Object.freeze([
    'color',
    'semantic-color',
    'typography',
    'spacing',
    'sizing',
    'border',
    'radius',
    'surface',
    'elevation',
    'shadow',
    'blur',
    'density',
    'breakpoint',
    'motion-timing',
    'motion-easing',
  ] as const),
  authorities: Object.freeze({
    primitive: 'assets/css/foundation/tokens.css',
    semanticTheme: 'assets/css/foundation/themes.css',
    semanticAliases: 'assets/css/foundation/token-architecture.css',
    typedFoundation: 'src/design-system/foundation.ts',
    typedSemanticReferences: 'src/design-system/tokens.ts',
    typedTheme: 'src/design-system/theme-contract.ts',
  }),
  principles: Object.freeze({
    rawPaletteValuesArePrimitiveOnly: true,
    productColorRolesAreSemantic: true,
    semanticAliasesResolveThroughGovernedAuthorities: true,
    componentTokensMayConsumeSemanticOrPrimitiveTokens: true,
    compatibilityTokensRemainUntilSuccessorMigration: true,
    blurIsOptionalAndNeverRequiredForMeaning: true,
    breakpointCustomPropertiesAreDescriptiveOnly: true,
    reducedMotionRemainsAuthoritative: true,
  }),
  successorOwnership: Object.freeze({
    sharedPrimitives: 80,
    shellAndNavigation: 81,
    layoutAndResponsiveComposition: 82,
    authenticationAndAccount: 83,
    boards: 84,
    timeTracker: 85,
    fuelTrackPlus: 86,
    tradeLink: 87,
    usersAndAdministration: 88,
    settings: 89,
    denseData: 90,
    overlaysAndFeedback: 91,
    asyncStates: 92,
    accessibility: 93,
    motion: 94,
    responsiveHarmonization: 95,
    legacyRetirement: 96,
  }),
} as const);

export type FuturisticMinimalistTokenCategory = typeof futuristicMinimalistTokenContract.categories[number];
