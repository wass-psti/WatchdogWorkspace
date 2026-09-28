export const dashboardAnalyticsPresentationArchitecture = Object.freeze({
  milestone: 70,
  stage: 'H',
  typedAuthority: 'src/design-system/analytics-presentation-system.ts',
  componentAuthority: 'src/design-system/analytics/analytics-presentation.tsx',
  presentationAuthority: 'assets/css/foundation/analytics-system.css',
  compatibilityAuthorities: Object.freeze([
    'assets/js/runtime/fueltrack-analytics.ts',
    'apps/fueltrack-plus/styles.v3.17.0-wm6.css',
    'src/design-system/data-presentation-system.ts',
  ]),
  policies: Object.freeze({
    metricAndChartPresentationIsShared: true,
    analyticsCalculationsRemainFeatureOwned: true,
    filtersQueriesExportsRemainFeatureOwned: true,
    echartsRendererRemainsExistingRuntimeAuthority: true,
    noAnalyticsDataModelChangeInM70: true,
    noDashboardConsumerMigrationInM70: true,
  }),
  successorBoundaries: Object.freeze({ motionContinuity:71, hostMigration:72, boardsMigration:73, timeTrackerMigration:74, fuelTrackMigration:75, tradeLinkMigration:76 }),
});
