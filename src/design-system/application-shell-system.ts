/**
 * Stage I M81 application-shell contract.
 * This is a presentation/composition boundary only. Route ownership, auth/RBAC,
 * persistence, module lifecycle and business state remain with their existing
 * certified authorities.
 */
export const workManagementApplicationShellSystem = Object.freeze({
  milestone: 81,
  stage: 'I',
  semanticsVersion: '1.43.2-m81-v1',
  hierarchy: Object.freeze([
    'application-shell',
    'global-navigation',
    'shell-header',
    'navigation-scroll-region',
    'navigation-status',
    'global-page-frame',
  ]),
  navigation: Object.freeze({
    primary: 'Main',
    desktopModes: Object.freeze(['expanded', 'compact']),
    mobileMode: 'modal-navigation-drawer',
    activeRouteUsesAriaCurrentPage: true,
    mobileWorkspaceInertWhileOpen: true,
    persistentWidthAndPinPreferences: true,
    noRouteOwnershipMutation: true,
  }),
  responsive: Object.freeze({
    compactBreakpointMaxPx: 620,
    intermediateBreakpointMaxPx: 900,
    desktopStartsPx: 901,
    stableWorkspaceHost: true,
    compactNavigationDoesNotRecreateRouteHost: true,
    unpinnedPreviewOverlaysInsteadOfShiftingContent: true,
  }),
  accessibility: Object.freeze({
    skipLinkTargetsMain: true,
    navigationLandmarkNamed: true,
    mobileDrawerIsModal: true,
    resizerUsesSeparatorSemantics: true,
    navigationStateAnnouncementsArePolite: true,
    focusRestorationRemainsExistingRuntimeAuthority: true,
  }),
  ownership: Object.freeze({
    routeLifecycle: 'M40',
    navigationState: 'client-state-store',
    navigationMarkup: 'assets/js/app.ts',
    globalOverlayHost: 'M11/M14/M66',
    shellPresentation: 'assets/css/shell-navigation.css',
    shellComposition: 'src/app/shell/WorkManagementShell.tsx',
    sharedShellPrimitives: 'src/design-system/application-shell/index.tsx',
  }),
  compatibility: Object.freeze({
    preservesM68NavigationSemantics: true,
    preservesShellM1ThroughM8Behavior: true,
    preservesRuntimeRouteContentIsland: true,
    preservesBoardPresentationFacade: true,
    noDatabaseSchemaMutation: true,
    noAuthenticationAuthorizationMutation: true,
    noPersistenceMutation: true,
  }),
} as const);

export type WorkManagementApplicationShellHierarchy = typeof workManagementApplicationShellSystem.hierarchy[number];
