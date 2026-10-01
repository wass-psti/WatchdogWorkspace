export const visualConsistencyLegacyStylingRetirement = Object.freeze({
  milestone: 96,
  model: 'successor-owned-presentation-consolidation',
  predecessor: 'M95 Cross-Module Responsive Harmonization',
  retirementPolicy: Object.freeze({
    oneOffReconciliationStylesheetsMayNotRemainRuntimeLoaded: true,
    liveDeclarationsMustMoveToCurrentPresentationOwnerBeforeRetirement: true,
    deadDeclarationsMustBeDeletedRatherThanCopiedForward: true,
    transitionalPresentationMarkersMustNotRemainRuntimeDependencies: true,
    unusedCustomPropertiesRequireRepositoryWideNoConsumerEvidence: true,
    historicalVerifiersMustRemainSemanticAndSuccessorAware: true,
    domainPersistenceAuthorizationAndWorkflowOwnershipMustRemainUnchanged: true,
  }),
  successorAuthorities: Object.freeze({
    hostResponsive: 'assets/css/foundation/cross-module-responsive-harmonization.css',
    boards: 'assets/css/foundation/boards-visual-migration.css',
    timeTracker: 'apps/time-tracker/m85-visual-migration.css',
    fuelTrackPlus: 'apps/fueltrack-plus/m86-visual-migration.css',
    tradeLink: 'apps/tradelink/m87-visual-migration.css',
  }),
} as const);
