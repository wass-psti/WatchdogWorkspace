export const workManagementResponsive = Object.freeze({
  breakpoints: Object.freeze({
    narrow: Object.freeze({ px: 640, rem: 40, max: '(max-width: 40rem)', min: '(min-width: 40.0625rem)' }),
    tablet: Object.freeze({ px: 840, rem: 52.5, max: '(max-width: 52.5rem)', min: '(min-width: 52.5625rem)' }),
    laptop: Object.freeze({ px: 1120, rem: 70, max: '(max-width: 70rem)', min: '(min-width: 70.0625rem)' }),
    wide: Object.freeze({ px: 1440, rem: 90, max: '(max-width: 90rem)', min: '(min-width: 90.0625rem)' }),
  }),
  policies: Object.freeze({
    adaptiveBehaviorIsOptIn: true,
    contentMayNotBeHiddenImplicitly: true,
    sharedQueriesUseRemUnits: true,
    featureSpecificLegacyQueriesRemainCompatibilityAuthorities: true,
  }),
} as const);

export type WorkManagementBreakpoint = keyof typeof workManagementResponsive.breakpoints;
export type WorkManagementAdaptiveCollapse = WorkManagementBreakpoint;
