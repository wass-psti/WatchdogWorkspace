export const dataPresentationDenseUiArchitecture = Object.freeze({
  milestone: 69,
  stage: 'H',
  typedAuthority: 'src/design-system/data-presentation-system.ts',
  componentAuthority: 'src/design-system/data/data-presentation.tsx',
  presentationAuthority: 'assets/css/foundation/dense-data-system.css',
  compatibilityAuthorities: Object.freeze([
    'assets/css/foundation/components.css',
    'src/features/boards/virtualization/board-table-virtualization.ts',
    'src/app/boards/evaluation/tanstack-table-evaluation.ts',
  ]),
  policies: Object.freeze({
    nativeTableAndListSemanticsFirst: true,
    overflowContainmentIsSharedPresentationConcern: true,
    sortingFilteringSelectionRemainFeatureOwned: true,
    virtualizationAndStickyGeometryRemainBoardsOwned: true,
    tanStackTableDecisionRemainsDeferProductionAdoption: true,
    noBoardEngineRewriteInM69: true,
    noDashboardKpiWorkInM69: true,
    noHostOrModuleConsumerMigrationInM69: true,
  }),
  successorBoundaries: Object.freeze({ dashboardPresentation:70, motionContinuity:71, hostMigration:72, boardsMigration:73, timeTrackerMigration:74, fuelTrackMigration:75, tradeLinkMigration:76 }),
});
