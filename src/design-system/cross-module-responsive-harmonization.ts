import { workManagementResponsive } from './responsive-system.ts';

export const crossModuleResponsiveHarmonization = Object.freeze({
  milestone: 95,
  stage: 'I',
  authority: 'src/design-system/responsive-system.ts',
  stylesheet: 'assets/css/foundation/cross-module-responsive-harmonization.css',
  breakpoints: workManagementResponsive.breakpoints,
  surfaces: Object.freeze(['shell', 'boards', 'time-tracker', 'fueltrack', 'tradelink'] as const),
  viewportModes: Object.freeze({
    narrow: 'max-width:40rem',
    tablet: '40.0625rem–52.5rem',
    laptop: '52.5625rem–70rem',
    wide: '70.0625rem+',
  }),
  policies: Object.freeze({
    canonicalViewportBreakpointsOnly: true,
    moduleOwnedViewportBreakpointsForbidden: true,
    mediaCapabilityQueriesRemainIndependent: true,
    horizontalDataOverflowMustRemainReachable: true,
    mobileNavigationMustRemainOperable: true,
    tabletLayoutsMustNotInheritDesktopOnlyGeometry: true,
    narrowLayoutsMustNotRequireHorizontalPageScrolling: true,
    preserveBusinessLogicAndDataContracts: true,
  }),
} as const);
