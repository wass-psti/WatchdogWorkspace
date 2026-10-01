export const stageIM81ApplicationShellGlobalNavigationTarget = Object.freeze({
  milestone: 81,
  stage: 'I',
  name: 'Application Shell & Global Navigation',
  activationState: 'active-certified',
  prerequisite: Object.freeze({
    milestone: 80,
    certifiedZipSha256: '7e0f42e510d8f5189892171cddbed73f3a063e6b7a16a86b94a2d6bebb9e76ff',
    certifiedSourceSha256: '978163479a590ec914f2c7574ed5710efeeb0734a3181584a0404934fafe5576',
  }),
  scope: Object.freeze([
    'application-shell', 'primary-navigation', 'secondary-navigation', 'sidebars', 'headers',
    'global-page-frame', 'responsive-shell-behavior', 'stable-shell-hierarchy', 'navigation-regression-protection',
  ]),
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
