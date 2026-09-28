export const workManagementDataPresentationSystem = Object.freeze({
  milestone: 69,
  stage: 'H',
  semanticsVersion: '1.43.2-m69-v1',
  canonicalComponents: Object.freeze([
    'WMDataRegion',
    'WMTable',
    'WMTableHeaderCell',
    'WMTableCell',
    'WMDataList',
    'WMDataListItem',
  ]),
  policies: Object.freeze({
    nativeTableAndListSemanticsFirst: true,
    horizontalOverflowBelongsToDataRegion: true,
    densityIsPresentationNotDomainState: true,
    numericAlignmentUsesTabularFigures: true,
    truncationMustNotDestroyAccessibleContent: true,
    sortStateUsesAriaSortOnHeaderCell: true,
    virtualizationRemainsProductOwned: true,
    boardInteractionEngineRemainsProductOwned: true,
    tanStackTableProductionAdoptionRemainsDeferred: true,
    noConsumerRewriteRequiredInM69: true,
  }),
  successorBoundaries: Object.freeze({
    dashboardPresentation: 70,
    motionContinuity: 71,
    hostMigration: 72,
    boardsMigration: 73,
    timeTrackerMigration: 74,
    fuelTrackMigration: 75,
    tradeLinkMigration: 76,
  }),
});

export type WorkManagementDataPresentationSystem = typeof workManagementDataPresentationSystem;
