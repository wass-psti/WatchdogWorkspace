import type {
  ApplicationManifest,
  FeatureDefinition,
  FeatureId,
  ManifestValidationResult,
  RouteDefinition,
} from '../src/types/manifest.ts';
import { modules } from './modules.ts';
import { applicationManifestSchema, firstSchemaIssue } from '../src/runtime-schemas/index.ts';

const freezeList = <T extends object>(items: readonly T[]): readonly Readonly<T>[] =>
  Object.freeze(items.map((item) => Object.freeze({ ...item })));

const routes = freezeList<RouteDefinition>([
  { id: 'home', pattern: '#/', owner: 'home' },
  { id: 'boards', pattern: '#/boards', owner: 'boards' },
  { id: 'board', pattern: '#/boards/:boardId', owner: 'boards' },
  { id: 'settings', pattern: '#/settings', owner: 'management' },
  { id: 'login', pattern: '#/login', owner: 'auth' },
  { id: 'register', pattern: '#/register', owner: 'auth' },
  { id: 'verify', pattern: '#/verify', owner: 'auth' },
  { id: 'account', pattern: '#/account', owner: 'management' },
  { id: 'users', pattern: '#/users', owner: 'management' },
  { id: 'app', pattern: '#/app/:moduleId', owner: 'module-host' },
]);

const features = freezeList<FeatureDefinition>([
  { id: 'shell', state: 'active', boundary: 'src/app/shell/WorkManagementShell.tsx', dependencies: ['react-19.2', 'global-overlay-host', 'client-state-store', 'legacy-route-content-bridge', 'runtime', 'platform-services', 'query-client', 'diagnostics', 'route-controller', 'route-policy', 'error-boundary', 'application-lifecycle', 'auth', 'platform', 'modules'] },
  { id: 'home', state: 'active', boundary: 'assets/js/features/home/index.ts', dependencies: ['platform', 'modules', 'auth'] },
  { id: 'commands', state: 'active', boundary: 'src/app/shared-ui/SharedApplicationUI.tsx', dependencies: ['react-19.2', 'shared-application-ui-runtime', 'command-registry', 'command-feature-adapter', 'global-overlay-runtime', 'overlay-manager', 'modules', 'auth', 'backup'] },
  { id: 'auth', state: 'active', boundary: 'src/app/auth/AuthenticationUI.tsx', dependencies: ['react-19.2', 'core/auth', 'authentication-ui-runtime', 'supabase-client-adapter', 'route-controller'] },
  { id: 'management', state: 'active', boundary: 'src/app/management/AuthenticatedManagementUI.tsx', dependencies: ['react-19.2', 'authenticated-management-ui-runtime', 'core/auth', 'platform', 'backup', 'modules', 'tanstack-query-v5', 'supabase-client-adapter', 'edge-function-client'] },
  { id: 'boards', state: 'active', boundary: 'src/app/boards/BoardPresentationFacade.tsx', dependencies: ['react-19.2', 'board-presentation-facade-runtime', 'board-presentation-host', 'boards-feature-adapter', 'assets/js/boards-ui.ts', 'boards-controller', 'board-domain-service', 'board-schema', 'board-state', 'board-repository', 'board-contracts', 'column-type-registry', 'board-list-view', 'table-view', 'kanban-view', 'board-workspace-view', 'dialog-controller', 'column-workflows', 'group-workflows', 'item-workflows', 'member-workflows', 'activity-workflows', 'item-workspace-controller', 'item-panel-renderer', 'drag-drop-controller', 'board-move-state', 'view-switch-controller', 'history-controller', 'selection-controller', 'inline-edit-controller', 'column-resize-controller', 'structure-drag-controller', 'board-menu-controller', 'board-table-virtualization-controller', 'board-table-virtualization', 'supabase-realtime-client', 'board-realtime-service', 'board-realtime-controller', 'realtime-platform', 'global-overlay-runtime', 'overlay-manager', 'permissions', 'item-workspace-view', 'core/boards', 'boards-ui'] },
  { id: 'modules', state: 'active', boundary: 'assets/js/features/modules/index.ts', dependencies: ['module-bootstrap', 'identity-bridge', 'module-cloud-store', 'normalized-module-data-service', 'realtime-platform'] },
  { id: 'module-host', state: 'active', boundary: 'assets/js/runtime/module-host.ts', dependencies: ['auth', 'modules'] },
]);

export const applicationManifest = Object.freeze({
  id: 'work-management',
  name: 'Work Management',
  version: '1.43.2',
  architectureVersion: 59,
  runtime: 'vite-esm',
  architecture: Object.freeze({
    style: 'modular-platform',
    compositionRoot: 'src/app/composition/mount-react-composition.tsx',
    serviceComposition: 'assets/js/runtime/platform-services.ts',
    frontendPlatform: 'react-19.2',
    presentationBoundary: 'react-composition-runtime-content',
    hostShell: 'src/app/shell/WorkManagementShell.tsx',
    hostShellOwnership: 'react-shell-v1',
    routeContentBoundary: 'runtime-route-content-island-v1',
    globalOverlayHost: 'src/app/overlays/GlobalOverlayHost.tsx',
    globalOverlayRuntime: 'assets/js/platform/ui/global-overlay-runtime.ts',
    globalOverlayOwnership: 'react-global-overlays-v1',
    authenticationUi: 'src/app/auth/AuthenticationUI.tsx',
    authenticationUiRuntime: 'src/app/auth/authentication-ui-runtime.ts',
    authenticationUiOwnership: 'react-authentication-ui-v1',
    authenticatedManagementUi: 'src/app/management/AuthenticatedManagementUI.tsx',
    authenticatedManagementUiRuntime: 'src/app/management/authenticated-management-ui-runtime.ts',
    authenticatedManagementUiOwnership: 'react-management-v1',
    sharedApplicationUi: 'src/app/shared-ui/SharedApplicationUI.tsx',
    sharedApplicationUiRuntime: 'src/app/shared-ui/shared-application-ui-runtime.ts',
    sharedApplicationUiOwnership: 'react-command-palette-shared-ui-v1',
    commandRegistry: 'assets/js/features/commands/command-registry.ts',
    boardPresentationFacade: 'src/app/boards/BoardPresentationFacade.tsx',
    boardPresentationFacadeRuntime: 'src/app/boards/board-presentation-facade-runtime.ts',
    boardPresentationOwnership: 'react-board-presentation-facade-v1',
    boardPresentationEngine: 'assets/js/boards-ui.ts',
    boardComponentDecomposition: 'react-board-component-decomposition-v1',
    boardPresentationRouteBoundary: 'src/app/boards/components/BoardPresentationRouteBoundary.tsx',
    boardPresentationSurface: 'src/app/boards/components/BoardPresentationSurface.tsx',
    boardPresentationModel: 'src/app/boards/components/board-presentation-model.ts',
    boardTableVirtualization: 'conditional-row-column-windowing-v1',
    boardTableVirtualizationPlanner: 'src/features/boards/virtualization/board-table-virtualization.ts',
    boardTableVirtualizationController: 'assets/js/features/boards/controllers/board-table-virtualization-controller.ts',
    boardRealtime: 'supabase-private-broadcast-presence-v1',
    boardRealtimeClient: 'assets/js/platform/data/supabase-realtime-client.ts',
    boardRealtimeService: 'assets/js/features/boards/services/board-realtime-service.ts',
    boardRealtimeController: 'assets/js/features/boards/controllers/board-realtime-controller.ts',
    richItemWorkspace: 'typed-rich-item-workspace-v1',
    richItemWorkspaceView: 'assets/js/features/boards/views/item-workspace-view.ts',
    richItemWorkspaceController: 'assets/js/features/boards/controllers/item-workspace-controller.ts',
    richItemWorkspaceRuntime: 'assets/js/features/boards/services/item-workspace-runtime.ts',
    normalizedModuleData: 'canonical-module-state-foundation-v1',
    normalizedModuleDataRegistry: 'config/modules.ts',
    normalizedModuleDataService: 'assets/js/platform/data/normalized-module-data-service.ts',
    timeTrackerStabilization: 'embedded-timetracker-stability-v1',
    timeTrackerStabilityRuntime: 'apps/time-tracker/stability-runtime.js',
    timeTrackerRuntime: 'apps/time-tracker/app.js',
    fuelTrackStabilization: 'embedded-fueltrack-stability-v1',
    fuelTrackStabilityRuntime: 'apps/fueltrack-plus/stability-runtime.js',
    fuelTrackRuntime: 'apps/fueltrack-plus/app.v3.17.0-wm6.js',
    fuelTrackAnalytics: 'apache-echarts-6.1-route-lazy',
    fuelTrackAnalyticsRuntime: 'assets/js/runtime/fueltrack-analytics.ts',
    tradeLinkStabilization: 'embedded-tradelink-stability-v1',
    tradeLinkStabilityRuntime: 'apps/tradelink/stability-runtime.js',
    tradeLinkRuntime: 'apps/tradelink/app.v1.42.0-wm1.js',
    modulePresentation: 'hybrid-native-retirement-gated-v1',
    modulePresentationHost: 'assets/js/runtime/module-presentation-host.ts',
    moduleRetirementPolicy: 'config/stage-e-m26-iframe-retirement-target.ts',
    realtimePlatform: 'authenticated-private-channel-platform-v1',
    realtimePlatformContract: 'src/platform/contracts/realtime-platform.ts',
    realtimePlatformRuntime: 'assets/js/platform/realtime/realtime-platform.ts',
    realtimeTransport: 'assets/js/platform/data/supabase-realtime-client.ts',
    realtimeTokenLifecycle: 'platform-shared-refresh-v1',
    edgeFunctions: 'authenticated-governed-edge-functions-v1',
    edgeFunctionClient: 'assets/js/platform/data/edge-function-client.ts',
    edgeFunctionRoot: 'supabase/functions',
    edgeFunctionAuthorization: 'jwt-plus-live-admin-policy-v1',
    edgeFunctionSecrets: 'server-only-environment-v1',
    databaseRlsTests: 'pgtap-supabase-cli-v1',
    databaseRlsTestRoot: 'supabase/tests/database',
    databaseRlsTestRunner: 'scripts/run-database-rls-tests.mjs',
    databaseAuthorizationHardening: 'rpc-only-sensitive-mutations-v1',
    modernTesting: 'vitest-5-testing-library-playwright-v1',
    modernTestRoot: 'tests/modern',
    modernTestConfig: 'vitest.config.mjs',
    modernTestRunner: 'scripts/run-modern-tests.mjs',
    modernTestCoverage: 'v8-threshold-gate-v1',
    modernTestToolchain: 'isolated-exact-bootstrap-v1',
    modernE2e: 'playwright-1.63-system-browser-v1',
    modernE2eConfig: 'playwright.config.mjs',
    modernE2eRunner: 'scripts/run-modern-browser-tests.mjs',
    performanceEngineering: 'measured-budgets-hot-paths-v1',
    performanceBudgets: 'config/performance-budgets.json',
    performanceBenchmarkRunner: 'scripts/run-performance-benchmarks.mjs',
    performanceBundleVerifier: 'scripts/verify-performance-budgets.mjs',
    performanceStartupInstrumentation: 'src/main.ts',
    observability: 'vendor-neutral-client-observability-v1',
    observabilityContract: 'src/platform/contracts/observability.ts',
    observabilityRuntime: 'assets/js/platform/observability/observability.ts',
    observabilityBrowserInstrumentation: 'assets/js/platform/observability/browser-observer.ts',
    observabilityExport: 'optional-transport-disabled-by-default-v1',
    observabilityPrivacy: 'bounded-redacted-memory-first-v1',
    serviceWorkerUpdates: 'build-scoped-explicit-update-v1',
    serviceWorkerUpdateContract: 'src/platform/contracts/service-worker-update.ts',
    serviceWorkerUpdateCoordinator: 'assets/js/platform/update/service-worker-update.ts',
    serviceWorkerRuntimeManifest: 'config/runtime-assets.js',
    serviceWorkerActivation: 'explicit-user-controlled-v1',
    serviceWorkerCacheIdentity: 'deterministic-build-scoped-v1',
    backupDisasterRecovery: 'integrity-preflight-checkpoint-dr-v1',
    backupDisasterRecoveryPolicy: 'config/backup-disaster-recovery-policy.json',
    backupDisasterRecoveryContract: 'src/platform/contracts/backup-disaster-recovery.ts',
    backupDisasterRecoveryRuntime: 'assets/js/platform/recovery/backup-disaster-recovery.ts',
    backupWorkspaceAuthority: 'assets/js/core/backup.ts',
    backupRecoveryEnvelope: 'wm-recovery-package-v1',
    backupRecoveryIntegrity: 'sha256-json-stable-v1',
    finalLegacyDeletion: 'expired-compatibility-retirement-v1',
    runtimeContentBoundary: 'src/app/composition/RuntimeApplicationBoundary.tsx',
    legacyCompatibilityPolicy: 'only-live-certified-boundaries-retained-v1',
    productionCutoverCertification: 'governed-dist-provenance-cutover-v1',
    productionCutoverPolicy: 'config/production-cutover-policy.json',
    productionCutoverVerifier: 'verify-stage-f-m36-production-cutover-certification.mjs',
    productionCutoverArtifactVerifier: 'scripts/verify-production-cutover-artifact.mjs',
    productionCutoverDeployment: 'github-pages-dist-only-live-smoke-v1',
    functionalProductionReadiness: 'clean-install-live-pages-certification-v1',
    functionalProductionReadinessTarget: 'config/stage-g-m54-functional-production-readiness-certification-target.ts',
    functionalProductionReadinessPolicy: 'config/functional-production-readiness-policy.json',
    functionalProductionReadinessWorkflow: '.github/workflows/m54-functional-production-readiness.yml',
    functionalRegressionBaseline: 'instrumented-characterization-evidence-v1',
    functionalRegressionPolicy: 'config/functional-regression-baseline-policy.json',
    functionalRegressionInventory: 'regression-baseline/m37-functional-regression-inventory.json',
    functionalRegressionVerifier: 'verify-stage-g-m37-functional-regression-baseline.mjs',
    functionalRegressionBrowserRunner: 'scripts/run-functional-regression-browser.mjs',
    functionalRegressionEvidenceGenerator: 'scripts/generate-functional-regression-evidence.mjs',
    backendCapabilityPreflight: 'authenticated-runtime-capability-gate-v1',
    backendCapabilityManifest: 'config/backend-capability-manifest.ts',
    backendCapabilityRuntime: 'assets/js/platform/data/backend-capability-preflight.ts',
    backendCapabilityAuthority: 'public.wm_runtime_capabilities',
    authSessionAccessContext: 'restored-refresh-reconciled-rbac-v1',
    authSessionAccessContextContract: 'src/platform/contracts/auth-session-access-context.ts',
    authSessionAccessContextRuntime: 'assets/js/core/auth.ts',
    authSessionAccessContextAuthority: 'public.wm_auth_access_context',
    authSessionRouteAuthorization: 'central-route-policy-rbac-v1',
    routeOwnershipLifecycle: 'exclusive-generation-route-ownership-v1',
    routeLifecycleContract: 'src/platform/contracts/route-lifecycle.ts',
    routeLifecycleRuntime: 'assets/js/runtime/route-lifecycle.ts',
    routeLifecycleController: 'assets/js/runtime/route-controller.ts',
    routeTransitionCleanup: 'overlay-focus-module-teardown-v1',
    routeBackendCapabilityOwnership: 'precommit-capability-aware-v1',
    routePresentationReadiness: 'owner-acknowledged-focus-v1',
    routePresentationReadinessRuntime: 'src/app/composition/presentation-readiness-runtime.ts',
    accountFunctionalRecovery: 'authenticated-account-self-service-v1',
    accountFunctionalRecoveryService: 'assets/js/features/account/account-service.ts',
    accountFunctionalRecoveryRuntime: 'src/app/management/authenticated-management-ui-runtime.ts',
    usersRbacFunctionalRecovery: 'serialized-admin-user-management-v1',
    usersRbacAuthority: 'public.list_user_directory + public.admin_set_user_access',
    usersRbacUi: 'src/app/management/AuthenticatedManagementUI.tsx',
    settingsFunctionalRecovery: 'reload-resilient-settings-control-plane-v1',
    settingsFunctionalRecoveryRuntime: 'src/app/management/authenticated-management-ui-runtime.ts',
    settingsEvidencePersistence: 'browser-local-verification-evidence-v1',
    settingsBackupAuthority: 'assets/js/core/backup.ts',
    managementAuthorityConsolidation: 'single-react-management-runtime-v1',
    managementAuthorityFeature: 'management',
    managementAuthorityUi: 'src/app/management/AuthenticatedManagementUI.tsx',
    managementAuthorityRuntime: 'src/app/management/authenticated-management-ui-runtime.ts',
    managementLegacyControllers: 'retired-not-shipped-v1',
    boardCollectionRecovery: 'lifecycle-routed-collection-authority-v1',
    boardCollectionController: 'assets/js/boards-ui.ts',
    boardCollectionDataController: 'assets/js/features/boards/controllers/board-data-controller.ts',
    boardCollectionRepository: 'assets/js/features/boards/data/board-repository.ts',
    boardCollectionRoutePolicy: 'active-only-board-workspace-v1',
    boardCollectionBrowser: 'tests/modern/e2e/boards-collection-route-recovery.spec.mjs',
    boardBackendDataContractRecovery: 'catalog-attested-board-contract-v1',
    boardBackendContract: 'config/stage-g-m46-board-backend-contract.ts',
    boardBackendMigration: 'supabase/migrations/v1.43.2-stage-g-m46-boards-backend-data-contract-recovery.sql',
    boardBackendSchema: 'supabase/schema.sql',
    boardBackendContractAttestation: 'public.wm_board_contract_attestation',
    boardBackendCacheOwnership: 'board-query-prefix-scoped-v1',
    boardAttachmentDeletion: 'metadata-first-best-effort-object-cleanup-v1',
    boardBackendDatabaseTest: 'supabase/tests/m46/boards_backend_contract_recovery.test.sql',
    boardBackendProductionVerifier: 'scripts/verify-stage-g-m46-production-contract.mjs',
    boardTableGroupItemRecovery: 'transactional-table-group-item-recovery-v1',
    boardTableGroupItemTarget: 'config/stage-g-m47-boards-table-group-item-recovery-target.ts',
    boardTableGroupItemMigration: 'supabase/migrations/v1.43.2-stage-g-m47-boards-table-group-item-recovery.sql',
    boardTableGroupItemDatabaseTest: 'supabase/tests/m47/boards_table_group_item_recovery.test.sql',
    boardTableGroupItemBrowser: 'tests/modern/e2e/boards-table-group-item-recovery.spec.mjs',
    boardTableGroupItemPreferencePersistence: 'board-scoped-flush-on-deactivate-v1',
    boardTableGroupItemProductionVerifier: 'scripts/verify-stage-g-m47-production-invariants.mjs',
    boardColumnsCellsStatusRecovery: 'typed-columns-cells-status-recovery-v1',
    boardColumnsCellsStatusTarget: 'config/stage-g-m48-boards-columns-cells-status-recovery-target.ts',
    boardColumnsCellsStatusColumnWorkflows: 'assets/js/features/boards/controllers/column-workflows.ts',
    boardColumnsCellsStatusInlineEditor: 'assets/js/features/boards/controllers/inline-edit-controller.ts',
    boardColumnsCellsStatusSelectors: 'assets/js/features/boards/selectors/board-selectors.ts',
    boardColumnsCellsStatusStatusEditor: 'assets/js/features/boards/services/status-label-editor.ts',
    boardColumnsCellsStatusBrowser: 'tests/modern/e2e/boards-columns-cells-status-recovery.spec.mjs',
    boardColumnsCellsStatusBackendBoundary: 'retained-m46-m47-no-schema-change-v1',
    boardKanbanDragDropRecovery: 'canonical-kanban-drag-drop-recovery-v1',
    boardKanbanDragDropTarget: 'config/stage-g-m49-boards-kanban-drag-drop-recovery-target.ts',
    boardKanbanView: 'assets/js/features/boards/views/kanban-view.ts',
    boardItemDragController: 'assets/js/features/boards/controllers/drag-drop-controller.ts',
    boardStructureDragController: 'assets/js/features/boards/controllers/structure-drag-controller.ts',
    boardViewSwitchController: 'assets/js/features/boards/controllers/view-switch-controller.ts',
    boardMoveState: 'assets/js/features/boards/services/board-move-state.ts',
    boardKanbanDragDropBrowser: 'tests/modern/e2e/boards-kanban-drag-drop-recovery.spec.mjs',
    boardKanbanDragDropBackendBoundary: 'retained-m46-m47-no-schema-change-v1',
    boardRichItemWorkspaceFileRecovery: 'supabase-storage-authoritative-item-workspace-recovery-v1',
    boardRichItemWorkspaceTarget: 'config/stage-g-m50-rich-item-workspace-file-recovery-target.ts',
    boardRichItemWorkspaceRuntime: 'assets/js/features/boards/services/item-workspace-runtime.ts',
    boardRichItemWorkspaceView: 'assets/js/features/boards/views/item-workspace-view.ts',
    boardRichItemWorkspaceRepository: 'assets/js/features/boards/data/board-repository.ts',
    boardRichItemWorkspaceMigration: 'supabase/migrations/v1.43.2-stage-g-m50-rich-item-workspace-file-recovery.sql',
    boardRichItemWorkspaceDatabaseTest: 'supabase/tests/m50/rich_item_workspace_file_recovery.test.sql',
    boardRichItemWorkspaceBrowser: 'tests/modern/e2e/rich-item-workspace-file-recovery.spec.mjs',
    boardRichItemWorkspaceStorageLifecycle: 'storage-first-retryable-metadata-finalize-v1',
    boardRichItemWorkspaceAuthorization: 'edit-mutates-view-reads-v1',
    boardRichItemWorkspaceProductionVerifier: 'scripts/verify-stage-g-m50-production-invariants.mjs',
    serverState: 'assets/js/platform/data/query-client.ts',
    serverStateLibrary: 'tanstack-query-v5',
    clientState: 'assets/js/platform/state/client-state-store.ts',
    clientStateLibrary: 'zustand-v5',
    clientStateOwnership: 'scoped-client-state-v1',
    backendTransport: 'assets/js/platform/data/backend-client.ts',
    authorizationPolicy: 'assets/js/platform/auth/permissions.ts',
    overlayLifecycle: 'assets/js/platform/ui/global-overlay-runtime.ts',
    errorBoundary: 'assets/js/runtime/error-boundary.ts',
    moduleIsolation: 'hybrid-native-or-same-origin-iframe',
    buildPipeline: 'vite-8',
    sourceMaps: 'production-disabled-by-default',
    hardening: 'production-defense-in-depth',
    runtimeValidation: 'external-boundaries',
    runtimeSchemas: 'zod-4-work-management-authority',
    supabaseClientAdapter: 'work-management-supabase-client-adapter-v1',
    packageManager: 'npm',
    typeSystem: 'typescript-incremental',
    typecheck: 'strict-boundaries',
    runtimeInfrastructure: 'typescript-authoritative',
    orchestration: 'typescript-composition-controllers-services',
    featureRuntime: 'typescript-nonvisual-core',
    uiRuntime: 'typescript-authoritative',
  }),
  persistence: Object.freeze({
    identity: 'supabase-auth',
    operationalData: 'supabase-postgres',
    moduleState: 'supabase-rpc',
    shellPreferences: 'browser-local-preferences',
    files: 'supabase-storage-private',
  }),
  routes,
  features,
  modules: Object.freeze(modules),
} as const satisfies ApplicationManifest);

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

export function validateApplicationManifest(manifest: ApplicationManifest = applicationManifest): ManifestValidationResult {
  const schemaResult = applicationManifestSchema.safeParse(manifest);
  const errors: string[] = schemaResult.success ? [] : [firstSchemaIssue(schemaResult.error)];
  if (manifest.id !== 'work-management') errors.push('Application id is invalid.');
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) errors.push('Application version must be semantic.');
  if (manifest.runtime !== 'vite-esm') errors.push('The application runtime must use Vite ESM.');
  if (manifest.architectureVersion >= 12 && manifest.architecture.runtimeInfrastructure !== 'typescript-authoritative') {
    errors.push('Architecture v12+ requires authoritative TypeScript runtime infrastructure.');
  }
  if (manifest.architectureVersion >= 13 && manifest.architecture.orchestration !== 'typescript-composition-controllers-services') {
    errors.push('Architecture v13+ requires typed composition/controller/domain-service orchestration.');
  }
  if (manifest.architectureVersion >= 14 && manifest.architecture.featureRuntime !== 'typescript-nonvisual-core') {
    errors.push('Architecture v14+ requires the authoritative non-visual TypeScript feature runtime.');
  }
  if (manifest.architectureVersion >= 15 && manifest.architecture.uiRuntime !== 'typescript-authoritative') {
    errors.push('Architecture v15+ requires the authoritative TypeScript UI/rendering runtime.');
  }
  if (manifest.architectureVersion >= 16 && manifest.architecture.runtimeSchemas !== 'zod-4-work-management-authority') {
    errors.push('Architecture v16+ requires the Work Management Zod runtime schema authority.');
  }
  if (manifest.architectureVersion >= 17 && manifest.architecture.supabaseClientAdapter !== 'work-management-supabase-client-adapter-v1') {
    errors.push('Architecture v17+ requires the Work Management Supabase client adapter authority.');
  }
  if (manifest.architectureVersion >= 18 && manifest.architecture.serverStateLibrary !== 'tanstack-query-v5') {
    errors.push('Architecture v18+ requires TanStack Query v5 as the server-state authority.');
  }
  if (manifest.architectureVersion >= 19 && (manifest.architecture.clientStateLibrary !== 'zustand-v5' || manifest.architecture.clientStateOwnership !== 'scoped-client-state-v1' || !manifest.architecture.clientState)) {
    errors.push('Architecture v19+ requires the scoped Zustand v5 client-state ownership authority.');
  }
  if (manifest.architectureVersion >= 20 && manifest.architecture.hostShellOwnership !== 'react-shell-v1') {
    errors.push('Architecture v20+ requires React ownership of the persistent host shell.');
  }
  if (manifest.architectureVersion >= 20 && manifest.architectureVersion < 43 && (manifest.architecture.routeContentBoundary !== 'legacy-route-content-island-v1' || !manifest.architecture.hostShell)) {
    errors.push('Architecture v20-v42 requires the historical legacy route-content compatibility island.');
  }
  if (manifest.architectureVersion >= 43 && (manifest.architecture.routeContentBoundary !== 'runtime-route-content-island-v1' || !manifest.architecture.hostShell || manifest.architecture.finalLegacyDeletion !== 'expired-compatibility-retirement-v1' || !manifest.architecture.runtimeContentBoundary || manifest.architecture.legacyCompatibilityPolicy !== 'only-live-certified-boundaries-retained-v1')) {
    errors.push('Architecture v43+ requires the neutral runtime-content boundary and final legacy-deletion authority.');
  }
  if (manifest.architectureVersion >= 21 && (manifest.architecture.globalOverlayOwnership !== 'react-global-overlays-v1' || !manifest.architecture.globalOverlayHost || !manifest.architecture.globalOverlayRuntime || manifest.architecture.overlayLifecycle !== manifest.architecture.globalOverlayRuntime)) {
    errors.push('Architecture v21+ requires React-owned global overlay roots and one page-lifetime global overlay runtime authority.');
  }
  if (manifest.architectureVersion >= 22 && (manifest.architecture.authenticationUiOwnership !== 'react-authentication-ui-v1' || !manifest.architecture.authenticationUi || !manifest.architecture.authenticationUiRuntime)) {
    errors.push('Architecture v22+ requires React ownership of the Work Management authentication UI with a dedicated route/UI runtime bridge.');
  }
  if (manifest.architectureVersion >= 23 && manifest.architectureVersion < 52 && (manifest.architecture.authenticatedManagementUiOwnership !== 'react-account-settings-user-management-v1' || !manifest.architecture.authenticatedManagementUi || !manifest.architecture.authenticatedManagementUiRuntime)) {
    errors.push('Architecture v23-v51 requires the historical React Account/Settings/User Management ownership contract.');
  }
  if (manifest.architectureVersion >= 52 && (manifest.architecture.authenticatedManagementUiOwnership !== 'react-management-v1' || !manifest.architecture.authenticatedManagementUi || !manifest.architecture.authenticatedManagementUiRuntime)) {
    errors.push('Architecture v52+ requires the consolidated React management ownership contract.');
  }
  if (manifest.architectureVersion >= 24 && (manifest.architecture.sharedApplicationUiOwnership !== 'react-command-palette-shared-ui-v1' || !manifest.architecture.sharedApplicationUi || !manifest.architecture.sharedApplicationUiRuntime || !manifest.architecture.commandRegistry)) {
    errors.push('Architecture v24+ requires React ownership of the command palette and shared application UI while preserving the typed command registry authority.');
  }
  if (manifest.architectureVersion >= 25 && (manifest.architecture.boardPresentationOwnership !== 'react-board-presentation-facade-v1' || !manifest.architecture.boardPresentationFacade || !manifest.architecture.boardPresentationFacadeRuntime || manifest.architecture.boardPresentationEngine !== 'assets/js/boards-ui.ts')) {
    errors.push('Architecture v25+ requires React route-level Board presentation ownership while retaining the typed compatibility Board engine behind the dedicated facade host.');
  }
  if (manifest.architectureVersion >= 26 && (manifest.architecture.boardComponentDecomposition !== 'react-board-component-decomposition-v1' || !manifest.architecture.boardPresentationRouteBoundary || !manifest.architecture.boardPresentationSurface || !manifest.architecture.boardPresentationModel)) {
    errors.push('Architecture v26+ requires typed React Board component decomposition with dedicated route-boundary, presentation-surface, and derived presentation-model authorities.');
  }
  if (manifest.architectureVersion >= 27 && (manifest.architecture.boardTableVirtualization !== 'conditional-row-column-windowing-v1' || !manifest.architecture.boardTableVirtualizationPlanner || !manifest.architecture.boardTableVirtualizationController)) {
    errors.push('Architecture v27+ requires conditional Board Table row/column virtualization with dedicated planner and runtime controller authorities.');
  }
  if (manifest.architectureVersion >= 28 && (manifest.architecture.boardRealtime !== 'supabase-private-broadcast-presence-v1' || !manifest.architecture.boardRealtimeClient || !manifest.architecture.boardRealtimeService || !manifest.architecture.boardRealtimeController)) {
    errors.push('Architecture v28+ requires private Supabase Broadcast/Presence Board Realtime with dedicated transport, service, and controller authorities.');
  }
  if (manifest.architectureVersion >= 29 && (manifest.architecture.richItemWorkspace !== 'typed-rich-item-workspace-v1' || !manifest.architecture.richItemWorkspaceView || !manifest.architecture.richItemWorkspaceController || !manifest.architecture.richItemWorkspaceRuntime)) {
    errors.push('Architecture v29+ requires the typed Rich Item Workspace view/controller/runtime authorities.');
  }
  if (manifest.architectureVersion >= 30 && (manifest.architecture.normalizedModuleData !== 'canonical-module-state-foundation-v1' || !manifest.architecture.normalizedModuleDataRegistry || !manifest.architecture.normalizedModuleDataService)) {
    errors.push('Architecture v30+ requires canonical normalized module data registry/service authorities.');
  }
  if (manifest.architectureVersion >= 31 && (manifest.architecture.timeTrackerStabilization !== 'embedded-timetracker-stability-v1' || !manifest.architecture.timeTrackerStabilityRuntime || !manifest.architecture.timeTrackerRuntime)) {
    errors.push('Architecture v31+ requires TimeTracker stabilization authorities.');
  }
  if (manifest.architectureVersion >= 32 && (manifest.architecture.fuelTrackStabilization !== 'embedded-fueltrack-stability-v1' || !manifest.architecture.fuelTrackStabilityRuntime || !manifest.architecture.fuelTrackRuntime || manifest.architecture.fuelTrackAnalytics !== 'apache-echarts-6.1-route-lazy' || !manifest.architecture.fuelTrackAnalyticsRuntime)) {
    errors.push('Architecture v32+ requires FuelTrack+ stabilization and route-lazy Apache ECharts authorities.');
  }
  if (manifest.architectureVersion >= 33 && (manifest.architecture.tradeLinkStabilization !== 'embedded-tradelink-stability-v1' || !manifest.architecture.tradeLinkStabilityRuntime || !manifest.architecture.tradeLinkRuntime)) {
    errors.push('Architecture v33+ requires TradeLink stabilization authorities.');
  }

  if (manifest.architectureVersion >= 35 && (manifest.architecture.realtimePlatform !== 'authenticated-private-channel-platform-v1' || !manifest.architecture.realtimePlatformContract || !manifest.architecture.realtimePlatformRuntime || !manifest.architecture.realtimeTransport || manifest.architecture.realtimeTokenLifecycle !== 'platform-shared-refresh-v1')) {
    errors.push('Architecture v35+ requires the authenticated private-channel realtime platform authority and shared token lifecycle.');
  }
  if (manifest.architectureVersion >= 36 && (manifest.architecture.edgeFunctions !== 'authenticated-governed-edge-functions-v1' || !manifest.architecture.edgeFunctionClient || !manifest.architecture.edgeFunctionRoot || manifest.architecture.edgeFunctionAuthorization !== 'jwt-plus-live-admin-policy-v1' || manifest.architecture.edgeFunctionSecrets !== 'server-only-environment-v1')) {
    errors.push('Architecture v36+ requires the governed authenticated Edge Function authority with live administrator authorization and server-only secrets.');
  }

  if (manifest.architectureVersion >= 37 && (manifest.architecture.databaseRlsTests !== 'pgtap-supabase-cli-v1' || !manifest.architecture.databaseRlsTestRoot || !manifest.architecture.databaseRlsTestRunner || manifest.architecture.databaseAuthorizationHardening !== 'rpc-only-sensitive-mutations-v1')) {
    errors.push('Architecture v37+ requires the pgTAP/Supabase CLI database-RLS test authority and RPC-only sensitive mutation hardening.');
  }
  if (manifest.architectureVersion >= 38 && (manifest.architecture.modernTesting !== 'vitest-5-testing-library-playwright-v1' || !manifest.architecture.modernTestRoot || !manifest.architecture.modernTestConfig || !manifest.architecture.modernTestRunner || manifest.architecture.modernTestCoverage !== 'v8-threshold-gate-v1' || manifest.architecture.modernTestToolchain !== 'isolated-exact-bootstrap-v1' || manifest.architecture.modernE2e !== 'playwright-1.63-system-browser-v1' || !manifest.architecture.modernE2eConfig || !manifest.architecture.modernE2eRunner)) {
    errors.push('Architecture v38+ requires the governed Vitest 5 + Testing Library + Playwright modern test authority with V8 coverage thresholds.');
  }
  if (manifest.architectureVersion >= 39 && (manifest.architecture.performanceEngineering !== 'measured-budgets-hot-paths-v1' || !manifest.architecture.performanceBudgets || !manifest.architecture.performanceBenchmarkRunner || !manifest.architecture.performanceBundleVerifier || !manifest.architecture.performanceStartupInstrumentation)) {
    errors.push('Architecture v39+ requires the governed performance engineering budget, benchmark, bundle, and startup instrumentation authorities.');
  }
  if (manifest.architectureVersion >= 40 && (manifest.architecture.observability !== 'vendor-neutral-client-observability-v1' || !manifest.architecture.observabilityContract || !manifest.architecture.observabilityRuntime || !manifest.architecture.observabilityBrowserInstrumentation || manifest.architecture.observabilityExport !== 'optional-transport-disabled-by-default-v1' || manifest.architecture.observabilityPrivacy !== 'bounded-redacted-memory-first-v1')) {
    errors.push('Architecture v40+ requires the vendor-neutral bounded/redacted client observability authority with optional export transport.');
  }
  if (manifest.architectureVersion >= 41 && (manifest.architecture.serviceWorkerUpdates !== 'build-scoped-explicit-update-v1' || !manifest.architecture.serviceWorkerUpdateContract || !manifest.architecture.serviceWorkerUpdateCoordinator || !manifest.architecture.serviceWorkerRuntimeManifest || manifest.architecture.serviceWorkerActivation !== 'explicit-user-controlled-v1' || manifest.architecture.serviceWorkerCacheIdentity !== 'deterministic-build-scoped-v1')) {
    errors.push('Architecture v41+ requires the governed build-scoped explicit service-worker update authority.');
  }
  if (manifest.architectureVersion >= 42 && (manifest.architecture.backupDisasterRecovery !== 'integrity-preflight-checkpoint-dr-v1' || !manifest.architecture.backupDisasterRecoveryPolicy || !manifest.architecture.backupDisasterRecoveryContract || !manifest.architecture.backupDisasterRecoveryRuntime || !manifest.architecture.backupWorkspaceAuthority || manifest.architecture.backupRecoveryEnvelope !== 'wm-recovery-package-v1' || manifest.architecture.backupRecoveryIntegrity !== 'sha256-json-stable-v1')) {
    errors.push('Architecture v42+ requires the governed integrity-checked backup and disaster-recovery authority.');
  }
  if (manifest.architectureVersion >= 44 && (manifest.architecture.productionCutoverCertification !== 'governed-dist-provenance-cutover-v1' || !manifest.architecture.productionCutoverPolicy || !manifest.architecture.productionCutoverVerifier || !manifest.architecture.productionCutoverArtifactVerifier || manifest.architecture.productionCutoverDeployment !== 'github-pages-dist-only-live-smoke-v1')) {
    errors.push('Architecture v44+ requires governed production cutover policy, artifact verification, provenance, and dist-only deployment certification.');
  }
  if (manifest.architectureVersion >= 45 && (manifest.architecture.functionalRegressionBaseline !== 'instrumented-characterization-evidence-v1' || !manifest.architecture.functionalRegressionPolicy || !manifest.architecture.functionalRegressionInventory || !manifest.architecture.functionalRegressionVerifier || !manifest.architecture.functionalRegressionBrowserRunner || !manifest.architecture.functionalRegressionEvidenceGenerator)) {
    errors.push('Architecture v45+ requires the governed Stage G functional-regression inventory, deterministic browser characterization, and redacted evidence authority.');
  }
  if (manifest.architectureVersion >= 46 && (manifest.architecture.backendCapabilityPreflight !== 'authenticated-runtime-capability-gate-v1' || !manifest.architecture.backendCapabilityManifest || !manifest.architecture.backendCapabilityRuntime || !manifest.architecture.backendCapabilityAuthority)) {
    errors.push('Architecture v46+ requires the authenticated runtime backend-capability preflight authority.');
  }
  if (manifest.architectureVersion >= 47 && (manifest.architecture.authSessionAccessContext !== 'restored-refresh-reconciled-rbac-v1' || !manifest.architecture.authSessionAccessContextContract || !manifest.architecture.authSessionAccessContextRuntime || !manifest.architecture.authSessionAccessContextAuthority || manifest.architecture.authSessionRouteAuthorization !== 'central-route-policy-rbac-v1')) {
    errors.push('Architecture v47+ requires stabilized session restoration, atomic access-context hydration, and centralized RBAC route authorization.');
  }
  if (manifest.architectureVersion >= 48 && (manifest.architecture.routeOwnershipLifecycle !== 'exclusive-generation-route-ownership-v1' || !manifest.architecture.routeLifecycleContract || !manifest.architecture.routeLifecycleRuntime || !manifest.architecture.routeLifecycleController || manifest.architecture.routeTransitionCleanup !== 'overlay-focus-module-teardown-v1')) {
    errors.push('Architecture v48+ requires exclusive generation-based route ownership with deterministic transition cleanup, focus, and embedded-module teardown.');
  }
  if (manifest.architectureVersion >= 49 && (manifest.architecture.accountFunctionalRecovery !== 'authenticated-account-self-service-v1' || !manifest.architecture.accountFunctionalRecoveryService || !manifest.architecture.accountFunctionalRecoveryRuntime)) {
    errors.push('Architecture v49+ requires authenticated Account self-service with explicit session and failure recovery authority.');
  }
  if (manifest.architectureVersion >= 50 && (manifest.architecture.usersRbacFunctionalRecovery !== 'serialized-admin-user-management-v1' || !manifest.architecture.usersRbacAuthority || !manifest.architecture.usersRbacUi)) {
    throw new Error('Architecture Version 50 requires M42 Users/RBAC recovery authority.');
  }
  if (manifest.architectureVersion >= 51 && (manifest.architecture.settingsFunctionalRecovery !== 'reload-resilient-settings-control-plane-v1' || !manifest.architecture.settingsFunctionalRecoveryRuntime || manifest.architecture.settingsEvidencePersistence !== 'browser-local-verification-evidence-v1' || !manifest.architecture.settingsBackupAuthority)) {
    errors.push('Architecture v51+ requires reload-resilient Settings functional recovery with persisted verification evidence and governed backup authority.');
  }
  if (manifest.architectureVersion >= 52 && (manifest.architecture.managementAuthorityConsolidation !== 'single-react-management-runtime-v1' || manifest.architecture.managementAuthorityFeature !== 'management' || manifest.architecture.managementAuthorityUi !== 'src/app/management/AuthenticatedManagementUI.tsx' || manifest.architecture.managementAuthorityRuntime !== 'src/app/management/authenticated-management-ui-runtime.ts' || manifest.architecture.managementLegacyControllers !== 'retired-not-shipped-v1')) {
    errors.push('Architecture v52+ requires one consolidated React management feature/runtime authority with obsolete imperative management controllers retired from the shipped source tree.');
  }
  if (manifest.architectureVersion >= 53 && (manifest.architecture.boardCollectionRecovery !== 'lifecycle-routed-collection-authority-v1' || !manifest.architecture.boardCollectionController || !manifest.architecture.boardCollectionDataController || !manifest.architecture.boardCollectionRepository || manifest.architecture.boardCollectionRoutePolicy !== 'active-only-board-workspace-v1' || !manifest.architecture.boardCollectionBrowser)) {
    errors.push('Architecture v53+ requires lifecycle-routed Boards collection recovery with active-only workspace access and explicit collection/data/repository/browser authorities.');
  }

  if (manifest.architectureVersion >= 55 && (manifest.architecture.boardTableGroupItemRecovery !== 'transactional-table-group-item-recovery-v1' || manifest.architecture.boardTableGroupItemTarget !== 'config/stage-g-m47-boards-table-group-item-recovery-target.ts' || manifest.architecture.boardTableGroupItemMigration !== 'supabase/migrations/v1.43.2-stage-g-m47-boards-table-group-item-recovery.sql' || manifest.architecture.boardTableGroupItemDatabaseTest !== 'supabase/tests/m47/boards_table_group_item_recovery.test.sql' || manifest.architecture.boardTableGroupItemBrowser !== 'tests/modern/e2e/boards-table-group-item-recovery.spec.mjs' || manifest.architecture.boardTableGroupItemPreferencePersistence !== 'board-scoped-flush-on-deactivate-v1' || manifest.architecture.boardTableGroupItemProductionVerifier !== 'scripts/verify-stage-g-m47-production-invariants.mjs')) {
    errors.push('Architecture v55+ requires governed Boards table/group/item recovery with transactional ordering, database/browser validation, and route-safe preference persistence authorities.');
  }

  if (manifest.architectureVersion >= 56 && (manifest.architecture.boardColumnsCellsStatusRecovery !== 'typed-columns-cells-status-recovery-v1' || manifest.architecture.boardColumnsCellsStatusTarget !== 'config/stage-g-m48-boards-columns-cells-status-recovery-target.ts' || manifest.architecture.boardColumnsCellsStatusColumnWorkflows !== 'assets/js/features/boards/controllers/column-workflows.ts' || manifest.architecture.boardColumnsCellsStatusInlineEditor !== 'assets/js/features/boards/controllers/inline-edit-controller.ts' || manifest.architecture.boardColumnsCellsStatusSelectors !== 'assets/js/features/boards/selectors/board-selectors.ts' || manifest.architecture.boardColumnsCellsStatusStatusEditor !== 'assets/js/features/boards/services/status-label-editor.ts' || manifest.architecture.boardColumnsCellsStatusBrowser !== 'tests/modern/e2e/boards-columns-cells-status-recovery.spec.mjs' || manifest.architecture.boardColumnsCellsStatusBackendBoundary !== 'retained-m46-m47-no-schema-change-v1')) {
    errors.push('Architecture v56+ requires governed typed Board column/cell/status recovery with explicit workflow, editor, selector, status-lifecycle, browser, and retained-backend authorities.');
  }

  if (manifest.architectureVersion >= 57 && (manifest.architecture.boardKanbanDragDropRecovery !== 'canonical-kanban-drag-drop-recovery-v1' || manifest.architecture.boardKanbanDragDropTarget !== 'config/stage-g-m49-boards-kanban-drag-drop-recovery-target.ts' || manifest.architecture.boardKanbanView !== 'assets/js/features/boards/views/kanban-view.ts' || manifest.architecture.boardItemDragController !== 'assets/js/features/boards/controllers/drag-drop-controller.ts' || manifest.architecture.boardStructureDragController !== 'assets/js/features/boards/controllers/structure-drag-controller.ts' || manifest.architecture.boardViewSwitchController !== 'assets/js/features/boards/controllers/view-switch-controller.ts' || manifest.architecture.boardMoveState !== 'assets/js/features/boards/services/board-move-state.ts' || manifest.architecture.boardKanbanDragDropBrowser !== 'tests/modern/e2e/boards-kanban-drag-drop-recovery.spec.mjs' || manifest.architecture.boardKanbanDragDropBackendBoundary !== 'retained-m46-m47-no-schema-change-v1')) {
    errors.push('Architecture v57+ requires governed Boards Kanban and drag/drop recovery with canonical movement, serialized view switching, keyboard-accessible movement, browser authority, and retained-backend boundaries.');
  }

  if (manifest.architectureVersion >= 58 && (manifest.architecture.boardRichItemWorkspaceFileRecovery !== 'supabase-storage-authoritative-item-workspace-recovery-v1' || manifest.architecture.boardRichItemWorkspaceTarget !== 'config/stage-g-m50-rich-item-workspace-file-recovery-target.ts' || manifest.architecture.boardRichItemWorkspaceRuntime !== 'assets/js/features/boards/services/item-workspace-runtime.ts' || manifest.architecture.boardRichItemWorkspaceView !== 'assets/js/features/boards/views/item-workspace-view.ts' || manifest.architecture.boardRichItemWorkspaceRepository !== 'assets/js/features/boards/data/board-repository.ts' || manifest.architecture.boardRichItemWorkspaceMigration !== 'supabase/migrations/v1.43.2-stage-g-m50-rich-item-workspace-file-recovery.sql' || manifest.architecture.boardRichItemWorkspaceDatabaseTest !== 'supabase/tests/m50/rich_item_workspace_file_recovery.test.sql' || manifest.architecture.boardRichItemWorkspaceBrowser !== 'tests/modern/e2e/rich-item-workspace-file-recovery.spec.mjs' || manifest.architecture.boardRichItemWorkspaceStorageLifecycle !== 'storage-first-retryable-metadata-finalize-v1' || manifest.architecture.boardRichItemWorkspaceAuthorization !== 'edit-mutates-view-reads-v1' || manifest.architecture.boardRichItemWorkspaceProductionVerifier !== 'scripts/verify-stage-g-m50-production-invariants.mjs')) {
    errors.push('Architecture v58+ requires governed Rich Item Workspace and Supabase Storage recovery with edit-authorized mutation, explicit download, recoverable storage-first deletion, database authority, browser authority, and production attestation.');
  }

  if (manifest.architectureVersion >= 54 && (manifest.architecture.boardBackendDataContractRecovery !== 'catalog-attested-board-contract-v1' || manifest.architecture.boardBackendContract !== 'config/stage-g-m46-board-backend-contract.ts' || manifest.architecture.boardBackendMigration !== 'supabase/migrations/v1.43.2-stage-g-m46-boards-backend-data-contract-recovery.sql' || manifest.architecture.boardBackendSchema !== 'supabase/schema.sql' || manifest.architecture.boardBackendContractAttestation !== 'public.wm_board_contract_attestation' || manifest.architecture.boardBackendCacheOwnership !== 'board-query-prefix-scoped-v1' || manifest.architecture.boardAttachmentDeletion !== 'metadata-first-best-effort-object-cleanup-v1' || manifest.architecture.boardBackendDatabaseTest !== 'supabase/tests/m46/boards_backend_contract_recovery.test.sql' || manifest.architecture.boardBackendProductionVerifier !== 'scripts/verify-stage-g-m46-production-contract.mjs')) {
    errors.push('Architecture v54+ requires catalog-attested Boards backend/data-contract recovery with governed schema, migration, cache, attachment, database-test, and production-attestation authorities.');
  }


  if (!unique(manifest.routes.map((route) => route.id))) errors.push('Route identifiers must be unique.');
  if (!unique(manifest.features.map((feature) => feature.id))) errors.push('Feature identifiers must be unique.');
  if (!unique(manifest.modules.map((module) => module.id))) errors.push('Module identifiers must be unique.');

  const featureIds = new Set<FeatureId>(manifest.features.map((feature) => feature.id));
  for (const route of manifest.routes) {
    if (!route.id || !route.pattern || !route.owner) errors.push('A route entry is incomplete.');
    if (!featureIds.has(route.owner)) errors.push(`Route owner is not a declared feature: ${route.owner}`);
  }
  for (const feature of manifest.features) {
    if (!feature.id || !feature.boundary) errors.push('A feature entry is incomplete.');
  }
  for (const module of manifest.modules) {
    if (!module.id || !module.name || !module.route) errors.push('A module entry is incomplete.');
    if (manifest.architectureVersion >= 34) {
      const retired = module.iframeRetirement.decision === 'retire-iframe';
      if (retired && (module.presentationMode !== 'native-host' || module.iframeRetirement.blockers.length > 0 || !module.iframeRetirement.nativeBoundary)) errors.push(`${module.id} has an invalid iframe-retirement declaration.`);
      if (!retired && (module.presentationMode !== 'same-origin-iframe' || module.iframeRetirement.blockers.length === 0)) errors.push(`${module.id} retained iframe presentation without explicit blockers.`);
    }
  }

  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
