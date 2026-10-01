/**
 * Stage I M82 — Layout, Surface & Responsive Composition System.
 *
 * This layer composes the already-certified M61/M62 layout and responsive
 * primitives into a smaller, application-facing API. It does not take route,
 * auth/RBAC, persistence, module-domain, or shell-lifecycle ownership.
 */
export const workManagementLayoutCompositionSystem = Object.freeze({
  milestone: 82,
  stage: 'I',
  semanticsVersion: '1.43.2-m82-v1',
  primitives: Object.freeze([
    'page-layout',
    'content-container',
    'section-layout',
    'surface-section',
    'responsive-grid',
    'responsive-cluster',
    'layout-stack',
  ]),
  viewportClasses: Object.freeze({
    mobile: Object.freeze({ max: '40rem', authority: 'M62 narrow' }),
    tablet: Object.freeze({ min: '40.0625rem', max: '70rem', authority: 'M62 tablet/laptop' }),
    desktop: Object.freeze({ min: '70.0625rem', authority: 'M62 laptop/wide' }),
  }),
  pageWidths: Object.freeze(['content', 'reading', 'full']),
  density: Object.freeze({
    modes: Object.freeze(['inherit', 'compact', 'comfortable']),
    presentationOnly: true,
    compactUsesCertifiedDensityToken: true,
    comfortableUsesCertifiedDensityToken: true,
    inheritedModeDoesNotOverrideWorkspacePreference: true,
  }),
  responsive: Object.freeze({
    gridProfiles: Object.freeze({
      single: Object.freeze({ columns: 1 }),
      split: Object.freeze({ columns: 2, collapseAt: 'tablet' }),
      dashboard: Object.freeze({ columns: 3, collapseAt: 'tablet' }),
      wideDashboard: Object.freeze({ columns: 3, collapseAt: 'laptop' }),
    }),
    clusterProfiles: Object.freeze({
      inline: Object.freeze({}),
      mobileStack: Object.freeze({ stackAt: 'narrow' }),
      tabletStack: Object.freeze({ stackAt: 'tablet' }),
    }),
    adaptationIsExplicit: true,
    noImplicitContentHiding: true,
  }),
  ownership: Object.freeze({
    spatialTokens: 'M61',
    breakpointsAndMediaBehavior: 'M62',
    semanticThemeTokens: 'M79',
    sharedPrimitives: 'M80',
    applicationShell: 'M81',
    compositionApi: 'src/design-system/layout-composition/index.tsx',
  }),
  boundaries: Object.freeze({
    noDatabaseSchemaMutation: true,
    noMigrationMutation: true,
    noAuthenticationAuthorizationMutation: true,
    noPersistenceMutation: true,
    noRouteOwnershipMutation: true,
    noModuleBusinessLogicMutation: true,
    noNewGlobalCssPayloadRequired: true,
  }),
} as const);

export type WorkManagementLayoutCompositionPrimitive = typeof workManagementLayoutCompositionSystem.primitives[number];
export type WorkManagementViewportClass = keyof typeof workManagementLayoutCompositionSystem.viewportClasses;
export type WorkManagementLayoutDensity = typeof workManagementLayoutCompositionSystem.density.modes[number];
export type WorkManagementGridProfile = keyof typeof workManagementLayoutCompositionSystem.responsive.gridProfiles;
export type WorkManagementClusterProfile = keyof typeof workManagementLayoutCompositionSystem.responsive.clusterProfiles;
