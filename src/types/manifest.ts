import type { WorkManagementModuleDefinition } from './modules.ts';

export type FeatureId =
  | 'shell'
  | 'home'
  | 'commands'
  | 'auth'
  | 'management'
  | 'boards'
  | 'modules'
  | 'module-host';

export interface RouteDefinition {
  readonly id: string;
  readonly pattern: string;
  readonly owner: FeatureId;
}

export interface FeatureDefinition {
  readonly id: FeatureId;
  readonly state: 'active' | 'disabled';
  readonly boundary: string;
  readonly dependencies: readonly string[];
}

export interface ArchitectureDefinition {
  readonly style: 'modular-platform';
  readonly compositionRoot: string;
  readonly serviceComposition?: string;
  readonly frontendPlatform?: 'react-19.2';
  readonly presentationBoundary?: 'react-composition-legacy-runtime' | 'react-composition-runtime-content';
  readonly hostShell?: string;
  readonly hostShellOwnership?: 'react-shell-v1';
  readonly routeContentBoundary?: 'legacy-route-content-island-v1' | 'runtime-route-content-island-v1';
  readonly globalOverlayHost?: string;
  readonly globalOverlayRuntime?: string;
  readonly globalOverlayOwnership?: 'react-global-overlays-v1';
  readonly authenticationUi?: string;
  readonly authenticationUiRuntime?: string;
  readonly authenticationUiOwnership?: 'react-authentication-ui-v1';
  readonly authenticatedManagementUi?: string;
  readonly authenticatedManagementUiRuntime?: string;
  readonly authenticatedManagementUiOwnership?: 'react-account-settings-user-management-v1' | 'react-management-v1';
  readonly sharedApplicationUi?: string;
  readonly sharedApplicationUiRuntime?: string;
  readonly sharedApplicationUiOwnership?: 'react-command-palette-shared-ui-v1';
  readonly commandRegistry?: string;
  readonly boardPresentationFacade?: string;
  readonly boardPresentationFacadeRuntime?: string;
  readonly boardPresentationOwnership?: 'react-board-presentation-facade-v1';
  readonly boardPresentationEngine?: 'assets/js/boards-ui.ts';
  readonly boardComponentDecomposition?: 'react-board-component-decomposition-v1';
  readonly boardPresentationRouteBoundary?: string;
  readonly boardPresentationSurface?: string;
  readonly boardPresentationModel?: string;
  readonly boardTableVirtualization?: 'conditional-row-column-windowing-v1';
  readonly boardTableVirtualizationPlanner?: string;
  readonly boardTableVirtualizationController?: string;
  readonly boardRealtime?: 'supabase-private-broadcast-presence-v1';
  readonly boardRealtimeClient?: string;
  readonly boardRealtimeService?: string;
  readonly boardRealtimeController?: string;
  readonly richItemWorkspace?: 'typed-rich-item-workspace-v1';
  readonly richItemWorkspaceView?: string;
  readonly richItemWorkspaceController?: string;
  readonly richItemWorkspaceRuntime?: string;
  readonly normalizedModuleData?: 'canonical-module-state-foundation-v1';
  readonly normalizedModuleDataRegistry?: string;
  readonly normalizedModuleDataService?: string;
  readonly timeTrackerStabilization?: 'embedded-timetracker-stability-v1';
  readonly timeTrackerStabilityRuntime?: string;
  readonly timeTrackerRuntime?: string;
  readonly fuelTrackStabilization?: 'embedded-fueltrack-stability-v1';
  readonly fuelTrackStabilityRuntime?: string;
  readonly fuelTrackRuntime?: string;
  readonly fuelTrackAnalytics?: 'apache-echarts-6.1-route-lazy';
  readonly fuelTrackAnalyticsRuntime?: string;
  readonly tradeLinkStabilization?: 'embedded-tradelink-stability-v1';
  readonly tradeLinkStabilityRuntime?: string;
  readonly tradeLinkRuntime?: string;
  readonly modulePresentation?: 'hybrid-native-retirement-gated-v1';
  readonly modulePresentationHost?: string;
  readonly moduleRetirementPolicy?: string;
  readonly realtimePlatform?: 'authenticated-private-channel-platform-v1';
  readonly realtimePlatformContract?: string;
  readonly realtimePlatformRuntime?: string;
  readonly realtimeTransport?: string;
  readonly realtimeTokenLifecycle?: 'platform-shared-refresh-v1';
  readonly edgeFunctions?: 'authenticated-governed-edge-functions-v1';
  readonly edgeFunctionClient?: string;
  readonly edgeFunctionRoot?: string;
  readonly edgeFunctionAuthorization?: 'jwt-plus-live-admin-policy-v1';
  readonly edgeFunctionSecrets?: 'server-only-environment-v1';
  readonly databaseRlsTests?: 'pgtap-supabase-cli-v1';
  readonly databaseRlsTestRoot?: string;
  readonly databaseRlsTestRunner?: string;
  readonly databaseAuthorizationHardening?: 'rpc-only-sensitive-mutations-v1';
  readonly modernTesting?: 'vitest-5-testing-library-playwright-v1';
  readonly modernTestRoot?: string;
  readonly modernTestConfig?: string;
  readonly modernTestRunner?: string;
  readonly modernTestCoverage?: 'v8-threshold-gate-v1';
  readonly modernTestToolchain?: 'isolated-exact-bootstrap-v1';
  readonly modernE2e?: 'playwright-1.63-system-browser-v1';
  readonly modernE2eConfig?: string;
  readonly modernE2eRunner?: string;
  readonly performanceEngineering?: 'measured-budgets-hot-paths-v1';
  readonly performanceBudgets?: string;
  readonly performanceBenchmarkRunner?: string;
  readonly performanceBundleVerifier?: string;
  readonly performanceStartupInstrumentation?: string;
  readonly observability?: 'vendor-neutral-client-observability-v1';
  readonly observabilityContract?: string;
  readonly observabilityRuntime?: string;
  readonly observabilityBrowserInstrumentation?: string;
  readonly observabilityExport?: 'optional-transport-disabled-by-default-v1';
  readonly observabilityPrivacy?: 'bounded-redacted-memory-first-v1';
  readonly serviceWorkerUpdates?: 'build-scoped-explicit-update-v1';
  readonly serviceWorkerUpdateContract?: string;
  readonly serviceWorkerUpdateCoordinator?: string;
  readonly serviceWorkerRuntimeManifest?: string;
  readonly serviceWorkerActivation?: 'explicit-user-controlled-v1';
  readonly serviceWorkerCacheIdentity?: 'deterministic-build-scoped-v1';
  readonly backupDisasterRecovery?: 'integrity-preflight-checkpoint-dr-v1';
  readonly backupDisasterRecoveryPolicy?: string;
  readonly backupDisasterRecoveryContract?: string;
  readonly backupDisasterRecoveryRuntime?: string;
  readonly backupWorkspaceAuthority?: string;
  readonly backupRecoveryEnvelope?: 'wm-recovery-package-v1';
  readonly backupRecoveryIntegrity?: 'sha256-json-stable-v1';
  readonly finalLegacyDeletion?: 'expired-compatibility-retirement-v1';
  readonly runtimeContentBoundary?: string;
  readonly legacyCompatibilityPolicy?: 'only-live-certified-boundaries-retained-v1';
  readonly productionCutoverCertification?: 'governed-dist-provenance-cutover-v1';
  readonly productionCutoverPolicy?: string;
  readonly productionCutoverVerifier?: string;
  readonly productionCutoverArtifactVerifier?: string;
  readonly productionCutoverDeployment?: 'github-pages-dist-only-live-smoke-v1';
  readonly functionalRegressionBaseline?: 'instrumented-characterization-evidence-v1';
  readonly functionalRegressionPolicy?: string;
  readonly functionalRegressionInventory?: string;
  readonly functionalRegressionVerifier?: string;
  readonly functionalRegressionBrowserRunner?: string;
  readonly functionalRegressionEvidenceGenerator?: string;
  readonly backendCapabilityPreflight?: 'authenticated-runtime-capability-gate-v1';
  readonly backendCapabilityManifest?: string;
  readonly backendCapabilityRuntime?: string;
  readonly backendCapabilityAuthority?: string;
  readonly authSessionAccessContext?: 'restored-refresh-reconciled-rbac-v1';
  readonly authSessionAccessContextContract?: string;
  readonly authSessionAccessContextRuntime?: string;
  readonly authSessionAccessContextAuthority?: string;
  readonly authSessionRouteAuthorization?: 'central-route-policy-rbac-v1';
  readonly routeOwnershipLifecycle?: 'exclusive-generation-route-ownership-v1';
  readonly routeLifecycleContract?: string;
  readonly routeLifecycleRuntime?: string;
  readonly routeLifecycleController?: string;
  readonly routeTransitionCleanup?: 'overlay-focus-module-teardown-v1';
  readonly routeBackendCapabilityOwnership?: 'precommit-capability-aware-v1';
  readonly routePresentationReadiness?: 'owner-acknowledged-focus-v1';
  readonly routePresentationReadinessRuntime?: string;
  readonly accountFunctionalRecovery?: 'authenticated-account-self-service-v1';
  readonly accountFunctionalRecoveryService?: string;
  readonly accountFunctionalRecoveryRuntime?: string;
  readonly usersRbacFunctionalRecovery?: 'serialized-admin-user-management-v1';
  readonly usersRbacAuthority?: string;
  readonly usersRbacUi?: string;
  readonly settingsFunctionalRecovery?: 'reload-resilient-settings-control-plane-v1';
  readonly settingsFunctionalRecoveryRuntime?: string;
  readonly settingsEvidencePersistence?: 'browser-local-verification-evidence-v1';
  readonly settingsBackupAuthority?: string;
  readonly managementAuthorityConsolidation?: 'single-react-management-runtime-v1';
  readonly managementAuthorityFeature?: 'management';
  readonly managementAuthorityUi?: string;
  readonly managementAuthorityRuntime?: string;
  readonly managementLegacyControllers?: 'retired-not-shipped-v1';
  readonly boardCollectionRecovery?: 'lifecycle-routed-collection-authority-v1';
  readonly boardCollectionController?: string;
  readonly boardCollectionDataController?: string;
  readonly boardCollectionRepository?: string;
  readonly boardCollectionRoutePolicy?: 'active-only-board-workspace-v1';
  readonly boardCollectionBrowser?: string;
  readonly boardBackendDataContractRecovery?: 'catalog-attested-board-contract-v1';
  readonly boardBackendContract?: string;
  readonly boardBackendMigration?: string;
  readonly boardBackendSchema?: string;
  readonly boardBackendContractAttestation?: string;
  readonly boardBackendCacheOwnership?: 'board-query-prefix-scoped-v1';
  readonly boardAttachmentDeletion?: 'metadata-first-best-effort-object-cleanup-v1';
  readonly boardBackendDatabaseTest?: string;
  readonly boardBackendProductionVerifier?: string;
  readonly boardTableGroupItemRecovery?: 'transactional-table-group-item-recovery-v1';
  readonly boardTableGroupItemTarget?: string;
  readonly boardTableGroupItemMigration?: string;
  readonly boardTableGroupItemDatabaseTest?: string;
  readonly boardTableGroupItemBrowser?: string;
  readonly boardTableGroupItemPreferencePersistence?: 'board-scoped-flush-on-deactivate-v1';
  readonly boardTableGroupItemProductionVerifier?: string;
  readonly boardColumnsCellsStatusRecovery?: 'typed-columns-cells-status-recovery-v1';
  readonly boardColumnsCellsStatusTarget?: string;
  readonly boardColumnsCellsStatusColumnWorkflows?: string;
  readonly boardColumnsCellsStatusInlineEditor?: string;
  readonly boardColumnsCellsStatusSelectors?: string;
  readonly boardColumnsCellsStatusStatusEditor?: string;
  readonly boardColumnsCellsStatusBrowser?: string;
  readonly boardColumnsCellsStatusBackendBoundary?: 'retained-m46-m47-no-schema-change-v1';
  readonly serverState: string;
  readonly serverStateLibrary?: 'tanstack-query-v5';
  readonly clientState?: string;
  readonly clientStateLibrary?: 'zustand-v5';
  readonly clientStateOwnership?: 'scoped-client-state-v1';
  readonly backendTransport: string;
  readonly authorizationPolicy: string;
  readonly overlayLifecycle: string;
  readonly errorBoundary: string;
  readonly moduleIsolation: 'same-origin-iframe' | 'hybrid-native-or-same-origin-iframe';
  readonly buildPipeline: 'vite-8';
  readonly sourceMaps: 'production-disabled-by-default' | 'production-hidden';
  readonly hardening?: 'production-defense-in-depth';
  readonly runtimeValidation?: 'external-boundaries';
  readonly runtimeSchemas?: 'zod-4-work-management-authority';
  readonly supabaseClientAdapter?: 'work-management-supabase-client-adapter-v1';
  readonly packageManager: 'npm';
  readonly typeSystem: 'typescript-incremental';
  readonly typecheck: 'strict-boundaries';
  readonly runtimeInfrastructure?: 'typescript-authoritative';
  readonly orchestration?: 'typescript-composition-controllers-services';
  readonly featureRuntime?: 'typescript-nonvisual-core';
  readonly uiRuntime?: 'typescript-authoritative';
}

export interface ApplicationManifest {
  readonly id: 'work-management';
  readonly name: string;
  readonly version: string;
  readonly architectureVersion: number;
  readonly runtime: 'vite-esm';
  readonly architecture: ArchitectureDefinition;
  readonly persistence: Readonly<Record<string, string>>;
  readonly routes: readonly RouteDefinition[];
  readonly features: readonly FeatureDefinition[];
  readonly modules: readonly WorkManagementModuleDefinition[];
}

export interface ManifestValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}
