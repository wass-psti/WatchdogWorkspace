export const accessibilityArchitecture = Object.freeze({
  milestone: 63,
  stage: 'H',
  cssAuthority: 'assets/css/foundation/accessibility-system.css',
  typedAuthority: 'src/design-system/accessibility-system.tsx',
  interactionAuthorities: Object.freeze([
    'src/design-system/interactions/button.tsx',
    'src/design-system/interactions/dialog.tsx',
    'src/design-system/interactions/menu.tsx',
    'src/design-system/interactions/tabs.tsx',
  ] as const),
  policies: Object.freeze({
    nativeSemanticsFirst: true,
    visibleKeyboardFocus: true,
    noPositiveTabIndexInSharedArchitecture: true,
    iconOnlyControlsRequireAccessibleName: true,
    reducedMotionPreferenceRespected: true,
    forcedColorsPreferenceRespected: true,
    liveRegionSemanticsAvailable: true,
    minimumCoarsePointerTargetCssPx: 44,
    noGlobalFeatureRewriteInM63: true,
  }),
  successorBoundaries: Object.freeze({ componentConsolidation: 64, hostMigration: 72, boardsMigration: 73, timeTrackerMigration: 74, fuelTrackMigration: 75, tradeLinkMigration: 76 }),
});
