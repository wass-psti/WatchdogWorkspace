export const TYPOGRAPHY_CONTENT_HIERARCHY = Object.freeze({
  milestone: 59,
  semanticsVersion: '1.43.2-m59-v1',
  authorities: Object.freeze({
    tokenScale: 'assets/css/foundation/tokens.css',
    tokenArchitecture: 'assets/css/foundation/token-architecture.css',
    roleStyles: 'assets/css/foundation/typography-system.css',
    productContract: 'src/design-system/typography-system.ts',
    reactPrimitive: 'src/design-system/primitives/typography.tsx',
  }),
  roles: Object.freeze([
    'display','pageTitle','sectionTitle','subsectionTitle','body','bodyStrong',
    'control','label','caption','helper','metadata','data','dataHeader',
  ] as const),
  specializedRoles: Object.freeze(['numeric','code'] as const),
  contentFlow: Object.freeze(['wrap','truncate','preserve'] as const),
  headingSemantics: Object.freeze({
    visualRoleDoesNotDetermineHeadingLevel: true,
    headingLevelMustFollowDocumentOutline: true,
  }),
  accessibility: Object.freeze({
    remBasedRoleScale: true,
    browserZoomAndTextScalingPreserved: true,
    noColorOnlyHierarchy: true,
    noViewportSpecificFontReductionInM59: true,
    truncationRequiresAccessibleFullValueWhenMeaningWouldBeLost: true,
  }),
  dataTypography: Object.freeze({
    numericUsesTabularLiningNumbers: true,
    dataRoleDoesNotForceNoWrap: true,
    codeUsesCertifiedMonospaceFamily: true,
  }),
  compatibility: Object.freeze({
    existingConsumersRemainValid: true,
    roleAdoptionIsOptInDuringM59: true,
    noMassSelectorRewrite: true,
    noExistingConcreteTokenChange: true,
  }),
  successorOwnership: Object.freeze({
    colorThemeContrast: 60,
    layoutSpatial: 61,
    breakpointBehavior: 62,
    accessibilityExpansion: 63,
    componentMigration: 64,
    hostMigration: 72,
    moduleMigration: Object.freeze([74,75,76] as const),
  }),
} as const);
export type WorkManagementTypographyRoleName = typeof TYPOGRAPHY_CONTENT_HIERARCHY.roles[number];
