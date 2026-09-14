export type M29ActivationState =
  | 'implementation-complete-pending-certification'
  | 'active-pending-release-certification'
  | 'active-certified';

export const stageFM29DatabaseRlsTestSuiteTarget = Object.freeze({
  milestone: 29,
  stage: 'F',
  name: 'Database/RLS test suite',
  activationState: 'active-certified' as M29ActivationState,
  prerequisite: Object.freeze({ milestone: 28, requiredState: 'active-certified' as const }),
  architectureVersion: 37,
  authority: Object.freeze({
    framework: 'pgtap-supabase-cli-v1' as const,
    testRoot: 'supabase/tests/database',
    runner: 'scripts/run-database-rls-tests.mjs',
    verifier: 'verify-stage-f-m29-database-rls-test-suite.mjs',
    migration: 'supabase/migrations/v1.43.2-stage-f-m29-database-rls-hardening.sql',
    correctiveMigration: 'supabase/migrations/v1.43.2-stage-f-m29-database-rls-corrective.sql',
    localDatabasePolicy: 'disposable-stack-schema-snapshot-transactional-pgtap-v1' as const,
  }),
  coverage: Object.freeze({
    rlsTables: 16,
    assertions: 87,
    suites: Object.freeze([
      '00_rls_structure.test.sql',
      '10_account_rbac.test.sql',
      '20_module_state_authorization.test.sql',
      '30_board_authorization.test.sql',
    ]),
    positiveAndNegativePathsRequired: true,
    anonymousBoundaryRequired: true,
    authenticatedBoundaryRequired: true,
    disabledAccountBoundaryRequired: true,
    adminSafeguardsRequired: true,
    realtimeAuthorizationRequired: true,
  }),
  hardening: Object.freeze({
    directProfileUpdateRetired: true,
    directModuleRoleMutationRetired: true,
    anonymousAdminProbeRetired: true,
    boardAuthorizationFailsClosed: true,
    displayNameNormalizationDeterministic: true,
    safeguardedUserManagementRpcRetained: true,
    derivedModuleRoleAuthorityRetained: true,
  }),
  tooling: Object.freeze({
    supabaseCliCertifiedVersion: '2.117.0',
    containerRuntimeRequired: true,
    localOnlyByDefault: true,
    linkedOrProductionTestRunsForbiddenByCertification: true,
    schemaBootstrapAuthority: 'supabase/schema.sql' as const,
    historicalMigrationReplayDuringTests: false,
  }),
  compatibilityBoundaries: Object.freeze([
    Object.freeze({ id: 'remote-production-database', status: 'not-used-for-certification' as const, reason: 'M29 certification creates an isolated local Supabase project and bootstraps it from the authoritative schema snapshot; production is never reset, linked, or mutated by the suite.' }),
    Object.freeze({ id: 'legacy-migration-filenames', status: 'preserved-not-cli-replayed' as const, reason: 'Historical Work Management migrations predate the current Supabase timestamp filename convention. M29 does not rename migration history; the local test harness disables migration replay and loads supabase/schema.sql into a disposable stack.' }),
    Object.freeze({ id: 'storage-realtime-managed-schemas', status: 'structural-plus-domain-helper-tests' as const, reason: 'Managed storage/realtime schemas are structurally verified while Work Management domain authorization helpers receive behavioral coverage.' }),
    Object.freeze({ id: 'edge-function-live-deployment', status: 'independent' as const, reason: 'M29 database/RLS certification does not require the M28 Edge Function to be remotely deployed.' }),
  ]),
  dependencyChanges: Object.freeze({ externalRuntimeDependencyAdded: false, packageLockChangeRequired: false }),
  databaseChanges: Object.freeze({ migrationRequired: true, schemaChangeRequired: true, productionDataRewriteRequired: false }),
});
