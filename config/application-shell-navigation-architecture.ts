export const applicationShellNavigationArchitecture = Object.freeze({
  milestone: 68,
  stage: 'H',
  typedAuthority: 'src/app/shell/application-shell-navigation-system.ts',
  runtimeAuthorities: Object.freeze([
    'src/app/shell/WorkManagementShell.tsx',
    'src/app/shell/shell-runtime-bridge.ts',
    'assets/js/app.ts',
    'assets/js/platform/state/client-state-store.ts',
  ]),
  presentationAuthority: 'assets/css/shell-navigation.css',
  policies: Object.freeze({
    informationArchitectureIsRouteAndCapabilityAware: true,
    primaryAndResourceNavigationRemainDistinct: true,
    activeRouteUsesAriaCurrentPage: true,
    shellPreferencesRemainClientPreferenceState: true,
    mobileNavigationOwnsModalAndInertSemantics: true,
    routeOwnershipRemainsM40Authority: true,
    overlayBehaviorRemainsM66Authority: true,
    noHostConsumerMigrationInM68: true,
    preserveCertifiedShellM1ThroughM8Behavior: true,
  }),
  successorBoundaries: Object.freeze({ dataPresentation:69, dashboardPresentation:70, motionContinuity:71, hostMigration:72, boardsMigration:73, timeTrackerMigration:74, fuelTrackMigration:75, tradeLinkMigration:76 }),
});
