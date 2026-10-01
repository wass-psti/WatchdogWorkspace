export const workManagementTimeTrackerVisualMigrationSystem = Object.freeze({
  milestone: 85,
  stage: 'I',
  baseline: 'M84-certified',
  migrationModel: 'presentation-only-time-tracker-successor',
  migratedSurfaces: Object.freeze([
    'overview','clock','log','reports','calendar','roles','ot','maps-and-gps-evidence','forms-and-dialogs','responsive-states',
  ] as const),
  preservedAuthorities: Object.freeze({
    stabilizationAndRuntime: 'M23',
    priorUiHarmonization: 'M74',
    domainPolicy: 'apps/time-tracker/domain-config.js',
    attendanceRuntime: 'apps/time-tracker/app.js',
    persistenceConcurrency: 'apps/time-tracker/stability-runtime.js',
  }),
  invariants: Object.freeze({
    presentationOnlySuccessor: true,
    preservesTimeTrackerSpecificRbac: true,
    preservesGpsLifecycle: true,
    preservesWorkNoteRules: true,
    preservesScheduleAndLatePolicy: true,
    preservesAutoClockOutLifecycle: true,
    preservesOtApprovalAndExtensionLogic: true,
    preservesCloudPersistenceSemantics: true,
    preservesAuditAndMapEvidence: true,
    preservesLegacySelectorsAndEventHooks: true,
    noSchemaMigrationRequired: true,
    noBackendMutationRequired: true,
  }),
});
export type WorkManagementTimeTrackerVisualSurface = typeof workManagementTimeTrackerVisualMigrationSystem.migratedSurfaces[number];
