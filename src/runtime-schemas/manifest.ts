import * as z from 'zod';
import { workManagementModuleDefinitionSchema } from './modules.ts';
import { nonEmptyStringSchema } from './primitives.ts';

export const featureIdSchema = z.enum([
  'shell', 'home', 'commands', 'auth', 'management', 'boards', 'modules', 'module-host',
]);

export const routeDefinitionSchema = z.object({
  id: nonEmptyStringSchema,
  pattern: nonEmptyStringSchema,
  owner: featureIdSchema,
}).strict();

export const featureDefinitionSchema = z.object({
  id: featureIdSchema,
  state: z.enum(['active', 'disabled']),
  boundary: nonEmptyStringSchema,
  dependencies: z.array(nonEmptyStringSchema),
}).strict();

export const architectureDefinitionSchema = z.object({
  style: z.literal('modular-platform'),
  compositionRoot: nonEmptyStringSchema,
  serviceComposition: z.string().optional(),
  frontendPlatform: z.literal('react-19.2').optional(),
  presentationBoundary: z.enum(['react-composition-legacy-runtime', 'react-composition-runtime-content']).optional(),
  hostShell: nonEmptyStringSchema.optional(),
  hostShellOwnership: z.literal('react-shell-v1').optional(),
  routeContentBoundary: z.enum(['legacy-route-content-island-v1', 'runtime-route-content-island-v1']).optional(),
  globalOverlayHost: nonEmptyStringSchema.optional(),
  globalOverlayRuntime: nonEmptyStringSchema.optional(),
  globalOverlayOwnership: z.literal('react-global-overlays-v1').optional(),
  authenticationUi: nonEmptyStringSchema.optional(),
  authenticationUiRuntime: nonEmptyStringSchema.optional(),
  authenticationUiOwnership: z.literal('react-authentication-ui-v1').optional(),
  authenticatedManagementUi: nonEmptyStringSchema.optional(),
  authenticatedManagementUiRuntime: nonEmptyStringSchema.optional(),
  authenticatedManagementUiOwnership: z.enum(['react-account-settings-user-management-v1', 'react-management-v1']).optional(),
  sharedApplicationUi: nonEmptyStringSchema.optional(),
  sharedApplicationUiRuntime: nonEmptyStringSchema.optional(),
  sharedApplicationUiOwnership: z.literal('react-command-palette-shared-ui-v1').optional(),
  commandRegistry: nonEmptyStringSchema.optional(),
  boardPresentationFacade: nonEmptyStringSchema.optional(),
  boardPresentationFacadeRuntime: nonEmptyStringSchema.optional(),
  boardPresentationOwnership: z.literal('react-board-presentation-facade-v1').optional(),
  boardPresentationEngine: z.literal('assets/js/boards-ui.ts').optional(),
  boardComponentDecomposition: z.literal('react-board-component-decomposition-v1').optional(),
  boardPresentationRouteBoundary: nonEmptyStringSchema.optional(),
  boardPresentationSurface: nonEmptyStringSchema.optional(),
  boardPresentationModel: nonEmptyStringSchema.optional(),
  boardTableVirtualization: z.literal('conditional-row-column-windowing-v1').optional(),
  boardTableVirtualizationPlanner: nonEmptyStringSchema.optional(),
  boardTableVirtualizationController: nonEmptyStringSchema.optional(),
  boardRealtime: z.literal('supabase-private-broadcast-presence-v1').optional(),
  boardRealtimeClient: nonEmptyStringSchema.optional(),
  boardRealtimeService: nonEmptyStringSchema.optional(),
  boardRealtimeController: nonEmptyStringSchema.optional(),
  richItemWorkspace: z.literal('typed-rich-item-workspace-v1').optional(),
  richItemWorkspaceView: nonEmptyStringSchema.optional(),
  richItemWorkspaceController: nonEmptyStringSchema.optional(),
  richItemWorkspaceRuntime: nonEmptyStringSchema.optional(),
  normalizedModuleData: z.literal('canonical-module-state-foundation-v1').optional(),
  normalizedModuleDataRegistry: nonEmptyStringSchema.optional(),
  normalizedModuleDataService: nonEmptyStringSchema.optional(),
  timeTrackerStabilization: z.literal('embedded-timetracker-stability-v1').optional(),
  timeTrackerStabilityRuntime: nonEmptyStringSchema.optional(),
  timeTrackerRuntime: nonEmptyStringSchema.optional(),
  fuelTrackStabilization: z.literal('embedded-fueltrack-stability-v1').optional(),
  fuelTrackStabilityRuntime: nonEmptyStringSchema.optional(),
  fuelTrackRuntime: nonEmptyStringSchema.optional(),
  fuelTrackAnalytics: z.literal('apache-echarts-6.1-route-lazy').optional(),
  fuelTrackAnalyticsRuntime: nonEmptyStringSchema.optional(),
  tradeLinkStabilization: z.literal('embedded-tradelink-stability-v1').optional(),
  tradeLinkStabilityRuntime: nonEmptyStringSchema.optional(),
  tradeLinkRuntime: nonEmptyStringSchema.optional(),
  modulePresentation: z.literal('hybrid-native-retirement-gated-v1').optional(),
  modulePresentationHost: nonEmptyStringSchema.optional(),
  moduleRetirementPolicy: nonEmptyStringSchema.optional(),
  realtimePlatform: z.literal('authenticated-private-channel-platform-v1').optional(),
  realtimePlatformContract: nonEmptyStringSchema.optional(),
  realtimePlatformRuntime: nonEmptyStringSchema.optional(),
  realtimeTransport: nonEmptyStringSchema.optional(),
  realtimeTokenLifecycle: z.literal('platform-shared-refresh-v1').optional(),
  edgeFunctions: z.literal('authenticated-governed-edge-functions-v1').optional(),
  edgeFunctionClient: nonEmptyStringSchema.optional(),
  edgeFunctionRoot: nonEmptyStringSchema.optional(),
  edgeFunctionAuthorization: z.literal('jwt-plus-live-admin-policy-v1').optional(),
  edgeFunctionSecrets: z.literal('server-only-environment-v1').optional(),
  databaseRlsTests: z.literal('pgtap-supabase-cli-v1').optional(),
  databaseRlsTestRoot: nonEmptyStringSchema.optional(),
  databaseRlsTestRunner: nonEmptyStringSchema.optional(),
  databaseAuthorizationHardening: z.literal('rpc-only-sensitive-mutations-v1').optional(),
  modernTesting: z.literal('vitest-5-testing-library-playwright-v1').optional(),
  modernTestRoot: nonEmptyStringSchema.optional(),
  modernTestConfig: nonEmptyStringSchema.optional(),
  modernTestRunner: nonEmptyStringSchema.optional(),
  modernTestCoverage: z.literal('v8-threshold-gate-v1').optional(),
  modernTestToolchain: z.literal('isolated-exact-bootstrap-v1').optional(),
  modernE2e: z.literal('playwright-1.63-system-browser-v1').optional(),
  modernE2eConfig: nonEmptyStringSchema.optional(),
  modernE2eRunner: nonEmptyStringSchema.optional(),
  performanceEngineering: z.literal('measured-budgets-hot-paths-v1').optional(),
  performanceBudgets: nonEmptyStringSchema.optional(),
  performanceBenchmarkRunner: nonEmptyStringSchema.optional(),
  performanceBundleVerifier: nonEmptyStringSchema.optional(),
  performanceStartupInstrumentation: nonEmptyStringSchema.optional(),
  observability: z.literal('vendor-neutral-client-observability-v1').optional(),
  observabilityContract: nonEmptyStringSchema.optional(),
  observabilityRuntime: nonEmptyStringSchema.optional(),
  observabilityBrowserInstrumentation: nonEmptyStringSchema.optional(),
  observabilityExport: z.literal('optional-transport-disabled-by-default-v1').optional(),
  observabilityPrivacy: z.literal('bounded-redacted-memory-first-v1').optional(),
  serviceWorkerUpdates: z.literal('build-scoped-explicit-update-v1').optional(),
  serviceWorkerUpdateContract: nonEmptyStringSchema.optional(),
  serviceWorkerUpdateCoordinator: nonEmptyStringSchema.optional(),
  serviceWorkerRuntimeManifest: nonEmptyStringSchema.optional(),
  serviceWorkerActivation: z.literal('explicit-user-controlled-v1').optional(),
  serviceWorkerCacheIdentity: z.literal('deterministic-build-scoped-v1').optional(),
  backupDisasterRecovery: z.literal('integrity-preflight-checkpoint-dr-v1').optional(),
  backupDisasterRecoveryPolicy: nonEmptyStringSchema.optional(),
  backupDisasterRecoveryContract: nonEmptyStringSchema.optional(),
  backupDisasterRecoveryRuntime: nonEmptyStringSchema.optional(),
  backupWorkspaceAuthority: nonEmptyStringSchema.optional(),
  backupRecoveryEnvelope: z.literal('wm-recovery-package-v1').optional(),
  backupRecoveryIntegrity: z.literal('sha256-json-stable-v1').optional(),
  finalLegacyDeletion: z.literal('expired-compatibility-retirement-v1').optional(),
  runtimeContentBoundary: nonEmptyStringSchema.optional(),
  legacyCompatibilityPolicy: z.literal('only-live-certified-boundaries-retained-v1').optional(),
  productionCutoverCertification: z.literal('governed-dist-provenance-cutover-v1').optional(),
  productionCutoverPolicy: nonEmptyStringSchema.optional(),
  productionCutoverVerifier: nonEmptyStringSchema.optional(),
  productionCutoverArtifactVerifier: nonEmptyStringSchema.optional(),
  productionCutoverDeployment: z.literal('github-pages-dist-only-live-smoke-v1').optional(),
  functionalRegressionBaseline: z.literal('instrumented-characterization-evidence-v1').optional(),
  functionalRegressionPolicy: nonEmptyStringSchema.optional(),
  functionalRegressionInventory: nonEmptyStringSchema.optional(),
  functionalRegressionVerifier: nonEmptyStringSchema.optional(),
  functionalRegressionBrowserRunner: nonEmptyStringSchema.optional(),
  functionalRegressionEvidenceGenerator: nonEmptyStringSchema.optional(),
  backendCapabilityPreflight: z.literal('authenticated-runtime-capability-gate-v1').optional(),
  backendCapabilityManifest: nonEmptyStringSchema.optional(),
  backendCapabilityRuntime: nonEmptyStringSchema.optional(),
  backendCapabilityAuthority: nonEmptyStringSchema.optional(),
  authSessionAccessContext: z.literal('restored-refresh-reconciled-rbac-v1').optional(),
  authSessionAccessContextContract: nonEmptyStringSchema.optional(),
  authSessionAccessContextRuntime: nonEmptyStringSchema.optional(),
  authSessionAccessContextAuthority: nonEmptyStringSchema.optional(),
  authSessionRouteAuthorization: z.literal('central-route-policy-rbac-v1').optional(),
  routeOwnershipLifecycle: z.literal('exclusive-generation-route-ownership-v1').optional(),
  routeLifecycleContract: nonEmptyStringSchema.optional(),
  routeLifecycleRuntime: nonEmptyStringSchema.optional(),
  routeLifecycleController: nonEmptyStringSchema.optional(),
  routeTransitionCleanup: z.literal('overlay-focus-module-teardown-v1').optional(),
  routeBackendCapabilityOwnership: z.literal('precommit-capability-aware-v1').optional(),
  routePresentationReadiness: z.literal('owner-acknowledged-focus-v1').optional(),
  routePresentationReadinessRuntime: nonEmptyStringSchema.optional(),
  accountFunctionalRecovery: z.literal('authenticated-account-self-service-v1').optional(),
  accountFunctionalRecoveryService: nonEmptyStringSchema.optional(),
  accountFunctionalRecoveryRuntime: nonEmptyStringSchema.optional(),
  usersRbacFunctionalRecovery: z.literal('serialized-admin-user-management-v1').optional(),
  usersRbacAuthority: nonEmptyStringSchema.optional(),
  usersRbacUi: nonEmptyStringSchema.optional(),
  settingsFunctionalRecovery: z.literal('reload-resilient-settings-control-plane-v1').optional(),
  settingsFunctionalRecoveryRuntime: nonEmptyStringSchema.optional(),
  settingsEvidencePersistence: z.literal('browser-local-verification-evidence-v1').optional(),
  settingsBackupAuthority: nonEmptyStringSchema.optional(),
  managementAuthorityConsolidation: z.literal('single-react-management-runtime-v1').optional(),
  managementAuthorityFeature: z.literal('management').optional(),
  managementAuthorityUi: nonEmptyStringSchema.optional(),
  managementAuthorityRuntime: nonEmptyStringSchema.optional(),
  managementLegacyControllers: z.literal('retired-not-shipped-v1').optional(),
  serverState: nonEmptyStringSchema,
  serverStateLibrary: z.literal('tanstack-query-v5').optional(),
  clientState: nonEmptyStringSchema.optional(),
  clientStateLibrary: z.literal('zustand-v5').optional(),
  clientStateOwnership: z.literal('scoped-client-state-v1').optional(),
  backendTransport: nonEmptyStringSchema,
  authorizationPolicy: nonEmptyStringSchema,
  overlayLifecycle: nonEmptyStringSchema,
  errorBoundary: nonEmptyStringSchema,
  moduleIsolation: z.enum(['same-origin-iframe', 'hybrid-native-or-same-origin-iframe']),
  buildPipeline: z.literal('vite-8'),
  sourceMaps: z.enum(['production-disabled-by-default', 'production-hidden']),
  hardening: z.literal('production-defense-in-depth').optional(),
  runtimeValidation: z.literal('external-boundaries').optional(),
  runtimeSchemas: z.literal('zod-4-work-management-authority').optional(),
  supabaseClientAdapter: z.literal('work-management-supabase-client-adapter-v1').optional(),
  packageManager: z.literal('npm'),
  typeSystem: z.literal('typescript-incremental'),
  typecheck: z.literal('strict-boundaries'),
  runtimeInfrastructure: z.literal('typescript-authoritative').optional(),
  orchestration: z.literal('typescript-composition-controllers-services').optional(),
  featureRuntime: z.literal('typescript-nonvisual-core').optional(),
  uiRuntime: z.literal('typescript-authoritative').optional(),
}).strict();

export const applicationManifestSchema = z.object({
  id: z.literal('work-management'),
  name: nonEmptyStringSchema,
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  architectureVersion: z.number().int().positive(),
  runtime: z.literal('vite-esm'),
  architecture: architectureDefinitionSchema,
  persistence: z.record(z.string(), z.string()),
  routes: z.array(routeDefinitionSchema),
  features: z.array(featureDefinitionSchema),
  modules: z.array(workManagementModuleDefinitionSchema),
}).strict().superRefine((manifest, context) => {
  const unique = (values: readonly string[]) => new Set(values).size === values.length;
  if (!unique(manifest.routes.map((route) => route.id))) context.addIssue({ code: 'custom', message: 'Route identifiers must be unique.' });
  if (!unique(manifest.features.map((feature) => feature.id))) context.addIssue({ code: 'custom', message: 'Feature identifiers must be unique.' });
  if (!unique(manifest.modules.map((module) => module.id))) context.addIssue({ code: 'custom', message: 'Module identifiers must be unique.' });
  const featureIds = new Set(manifest.features.map((feature) => feature.id));
  for (const route of manifest.routes) {
    if (!featureIds.has(route.owner)) context.addIssue({ code: 'custom', message: `Route owner is not declared: ${route.owner}` });
  }
  if (manifest.architectureVersion >= 16 && manifest.architecture.runtimeSchemas !== 'zod-4-work-management-authority') {
    context.addIssue({ code: 'custom', message: 'Architecture v16+ requires the Work Management Zod runtime schema authority.' });
  }
  if (manifest.architectureVersion >= 17 && manifest.architecture.supabaseClientAdapter !== 'work-management-supabase-client-adapter-v1') {
    context.addIssue({ code: 'custom', message: 'Architecture v17+ requires the Work Management Supabase client adapter authority.' });
  }
  if (manifest.architectureVersion >= 18 && manifest.architecture.serverStateLibrary !== 'tanstack-query-v5') {
    context.addIssue({ code: 'custom', message: 'Architecture v18+ requires TanStack Query v5 as the server-state authority.' });
  }
  if (manifest.architectureVersion >= 19 && (manifest.architecture.clientStateLibrary !== 'zustand-v5' || manifest.architecture.clientStateOwnership !== 'scoped-client-state-v1' || !manifest.architecture.clientState)) {
    context.addIssue({ code: 'custom', message: 'Architecture v19+ requires the scoped Zustand v5 client-state ownership authority.' });
  }
  if (manifest.architectureVersion >= 20 && manifest.architecture.hostShellOwnership !== 'react-shell-v1') {
    context.addIssue({ code: 'custom', message: 'Architecture v20+ requires React ownership of the persistent host shell.' });
  }
  if (manifest.architectureVersion >= 20 && manifest.architectureVersion < 43 && (manifest.architecture.routeContentBoundary !== 'legacy-route-content-island-v1' || !manifest.architecture.hostShell)) {
    context.addIssue({ code: 'custom', message: 'Architecture v20-v42 requires the historical legacy route-content compatibility island.' });
  }
  if (manifest.architectureVersion >= 43 && (manifest.architecture.routeContentBoundary !== 'runtime-route-content-island-v1' || !manifest.architecture.hostShell || manifest.architecture.finalLegacyDeletion !== 'expired-compatibility-retirement-v1' || !manifest.architecture.runtimeContentBoundary || manifest.architecture.legacyCompatibilityPolicy !== 'only-live-certified-boundaries-retained-v1')) {
    context.addIssue({ code: 'custom', message: 'Architecture v43+ requires the neutral runtime-content boundary and final legacy-deletion authority.' });
  }
  if (manifest.architectureVersion >= 21 && (manifest.architecture.globalOverlayOwnership !== 'react-global-overlays-v1' || !manifest.architecture.globalOverlayHost || !manifest.architecture.globalOverlayRuntime || manifest.architecture.overlayLifecycle !== manifest.architecture.globalOverlayRuntime)) {
    context.addIssue({ code: 'custom', message: 'Architecture v21+ requires React-owned global overlay roots and one page-lifetime global overlay runtime authority.' });
  }
  if (manifest.architectureVersion >= 22 && (manifest.architecture.authenticationUiOwnership !== 'react-authentication-ui-v1' || !manifest.architecture.authenticationUi || !manifest.architecture.authenticationUiRuntime)) {
    context.addIssue({ code: 'custom', message: 'Architecture v22+ requires React ownership of the Work Management authentication UI with a dedicated route/UI runtime bridge.' });
  }
  if (manifest.architectureVersion >= 23 && manifest.architectureVersion < 52 && (manifest.architecture.authenticatedManagementUiOwnership !== 'react-account-settings-user-management-v1' || !manifest.architecture.authenticatedManagementUi || !manifest.architecture.authenticatedManagementUiRuntime)) {
    context.addIssue({ code: 'custom', message: 'Architecture v23-v51 requires the historical React Account/Settings/User Management ownership contract.' });
  }
  if (manifest.architectureVersion >= 52 && (manifest.architecture.authenticatedManagementUiOwnership !== 'react-management-v1' || !manifest.architecture.authenticatedManagementUi || !manifest.architecture.authenticatedManagementUiRuntime)) {
    context.addIssue({ code: 'custom', message: 'Architecture v52+ requires the consolidated React management ownership contract.' });
  }
  if (manifest.architectureVersion >= 24 && (manifest.architecture.sharedApplicationUiOwnership !== 'react-command-palette-shared-ui-v1' || !manifest.architecture.sharedApplicationUi || !manifest.architecture.sharedApplicationUiRuntime || !manifest.architecture.commandRegistry)) {
    context.addIssue({ code: 'custom', message: 'Architecture v24+ requires React ownership of the command palette and shared application UI while preserving the typed command registry authority.' });
  }
  if (manifest.architectureVersion >= 25 && (manifest.architecture.boardPresentationOwnership !== 'react-board-presentation-facade-v1' || !manifest.architecture.boardPresentationFacade || !manifest.architecture.boardPresentationFacadeRuntime || manifest.architecture.boardPresentationEngine !== 'assets/js/boards-ui.ts')) {
    context.addIssue({ code: 'custom', message: 'Architecture v25+ requires React route-level Board presentation ownership while retaining the typed compatibility Board engine behind the dedicated facade host.' });
  }
  if (manifest.architectureVersion >= 26 && (manifest.architecture.boardComponentDecomposition !== 'react-board-component-decomposition-v1' || !manifest.architecture.boardPresentationRouteBoundary || !manifest.architecture.boardPresentationSurface || !manifest.architecture.boardPresentationModel)) {
    context.addIssue({ code: 'custom', message: 'Architecture v26+ requires typed React Board component decomposition with dedicated route-boundary, presentation-surface, and derived presentation-model authorities.' });
  }
  if (manifest.architectureVersion >= 27 && (manifest.architecture.boardTableVirtualization !== 'conditional-row-column-windowing-v1' || !manifest.architecture.boardTableVirtualizationPlanner || !manifest.architecture.boardTableVirtualizationController)) {
    context.addIssue({ code: 'custom', message: 'Architecture v27+ requires conditional Board Table row/column virtualization with dedicated planner and runtime controller authorities.' });
  }
  if (manifest.architectureVersion >= 28 && (manifest.architecture.boardRealtime !== 'supabase-private-broadcast-presence-v1' || !manifest.architecture.boardRealtimeClient || !manifest.architecture.boardRealtimeService || !manifest.architecture.boardRealtimeController)) {
    context.addIssue({ code: 'custom', message: 'Architecture v28+ requires private Supabase Broadcast/Presence Board Realtime with dedicated transport, service, and controller authorities.' });
  }
  if (manifest.architectureVersion >= 29 && (manifest.architecture.richItemWorkspace !== 'typed-rich-item-workspace-v1' || !manifest.architecture.richItemWorkspaceView || !manifest.architecture.richItemWorkspaceController || !manifest.architecture.richItemWorkspaceRuntime)) {
    context.addIssue({ code: 'custom', message: 'Architecture v29+ requires the typed Rich Item Workspace view/controller/runtime authorities.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 30 && (manifest.architecture.normalizedModuleData !== 'canonical-module-state-foundation-v1' || !manifest.architecture.normalizedModuleDataRegistry || !manifest.architecture.normalizedModuleDataService)) {
    context.addIssue({ code: 'custom', message: 'Architecture v30+ requires the canonical normalized module data registry and service authorities.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 31 && (manifest.architecture.timeTrackerStabilization !== 'embedded-timetracker-stability-v1' || !manifest.architecture.timeTrackerStabilityRuntime || !manifest.architecture.timeTrackerRuntime)) {
    context.addIssue({ code: 'custom', message: 'Architecture v31+ requires the certified TimeTracker stabilization runtime and embedded application authorities.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 32 && (manifest.architecture.fuelTrackStabilization !== 'embedded-fueltrack-stability-v1' || !manifest.architecture.fuelTrackStabilityRuntime || !manifest.architecture.fuelTrackRuntime || manifest.architecture.fuelTrackAnalytics !== 'apache-echarts-6.1-route-lazy' || !manifest.architecture.fuelTrackAnalyticsRuntime)) {
    context.addIssue({ code: 'custom', message: 'Architecture v32+ requires the certified FuelTrack+ stabilization runtime, production wm6 authority, and route-lazy Apache ECharts analytics boundary.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 33 && (manifest.architecture.tradeLinkStabilization !== 'embedded-tradelink-stability-v1' || !manifest.architecture.tradeLinkStabilityRuntime || !manifest.architecture.tradeLinkRuntime)) {
    context.addIssue({ code: 'custom', message: 'Architecture v33+ requires the certified TradeLink stabilization runtime and production application authority.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 34 && (manifest.architecture.modulePresentation !== 'hybrid-native-retirement-gated-v1' || !manifest.architecture.modulePresentationHost || !manifest.architecture.moduleRetirementPolicy || manifest.architecture.moduleIsolation !== 'hybrid-native-or-same-origin-iframe')) {
    context.addIssue({ code: 'custom', message: 'Architecture v34+ requires the hybrid module-presentation host and explicit iframe-retirement policy.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 35 && (manifest.architecture.realtimePlatform !== 'authenticated-private-channel-platform-v1' || !manifest.architecture.realtimePlatformContract || !manifest.architecture.realtimePlatformRuntime || !manifest.architecture.realtimeTransport || manifest.architecture.realtimeTokenLifecycle !== 'platform-shared-refresh-v1')) {
    context.addIssue({ code: 'custom', message: 'Architecture v35+ requires the authenticated private-channel realtime platform authority and shared token lifecycle.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 36 && (manifest.architecture.edgeFunctions !== 'authenticated-governed-edge-functions-v1' || !manifest.architecture.edgeFunctionClient || !manifest.architecture.edgeFunctionRoot || manifest.architecture.edgeFunctionAuthorization !== 'jwt-plus-live-admin-policy-v1' || manifest.architecture.edgeFunctionSecrets !== 'server-only-environment-v1')) {
    context.addIssue({ code: 'custom', message: 'Architecture v36+ requires the governed authenticated Edge Function authority with live administrator authorization and server-only secrets.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 37 && (manifest.architecture.databaseRlsTests !== 'pgtap-supabase-cli-v1' || !manifest.architecture.databaseRlsTestRoot || !manifest.architecture.databaseRlsTestRunner || manifest.architecture.databaseAuthorizationHardening !== 'rpc-only-sensitive-mutations-v1')) {
    context.addIssue({ code: 'custom', message: 'Architecture v37+ requires the pgTAP/Supabase CLI database-RLS test authority and RPC-only sensitive mutation hardening.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 38 && (manifest.architecture.modernTesting !== 'vitest-5-testing-library-playwright-v1' || !manifest.architecture.modernTestRoot || !manifest.architecture.modernTestConfig || !manifest.architecture.modernTestRunner || manifest.architecture.modernTestCoverage !== 'v8-threshold-gate-v1' || manifest.architecture.modernTestToolchain !== 'isolated-exact-bootstrap-v1' || manifest.architecture.modernE2e !== 'playwright-1.63-system-browser-v1' || !manifest.architecture.modernE2eConfig || !manifest.architecture.modernE2eRunner)) {
    context.addIssue({ code: 'custom', message: 'Architecture v38+ requires the governed Vitest 5 + Testing Library + Playwright modern test authority with V8 coverage thresholds.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 39 && (manifest.architecture.performanceEngineering !== 'measured-budgets-hot-paths-v1' || !manifest.architecture.performanceBudgets || !manifest.architecture.performanceBenchmarkRunner || !manifest.architecture.performanceBundleVerifier || !manifest.architecture.performanceStartupInstrumentation)) {
    context.addIssue({ code: 'custom', message: 'Architecture v39+ requires measured performance budgets, hot-path benchmarks, production bundle verification, and startup instrumentation.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 40 && (manifest.architecture.observability !== 'vendor-neutral-client-observability-v1' || !manifest.architecture.observabilityContract || !manifest.architecture.observabilityRuntime || !manifest.architecture.observabilityBrowserInstrumentation || manifest.architecture.observabilityExport !== 'optional-transport-disabled-by-default-v1' || manifest.architecture.observabilityPrivacy !== 'bounded-redacted-memory-first-v1')) {
    context.addIssue({ code: 'custom', message: 'Architecture v40+ requires vendor-neutral bounded/redacted client observability with optional export transport.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 41 && (manifest.architecture.serviceWorkerUpdates !== 'build-scoped-explicit-update-v1' || !manifest.architecture.serviceWorkerUpdateContract || !manifest.architecture.serviceWorkerUpdateCoordinator || !manifest.architecture.serviceWorkerRuntimeManifest || manifest.architecture.serviceWorkerActivation !== 'explicit-user-controlled-v1' || manifest.architecture.serviceWorkerCacheIdentity !== 'deterministic-build-scoped-v1')) {
    context.addIssue({ code: 'custom', message: 'Architecture v41+ requires the governed build-scoped explicit service-worker update authority.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 42 && (manifest.architecture.backupDisasterRecovery !== 'integrity-preflight-checkpoint-dr-v1' || !manifest.architecture.backupDisasterRecoveryPolicy || !manifest.architecture.backupDisasterRecoveryContract || !manifest.architecture.backupDisasterRecoveryRuntime || !manifest.architecture.backupWorkspaceAuthority || manifest.architecture.backupRecoveryEnvelope !== 'wm-recovery-package-v1' || manifest.architecture.backupRecoveryIntegrity !== 'sha256-json-stable-v1')) {
    context.addIssue({ code: 'custom', message: 'Architecture v42+ requires the governed integrity-checked backup and disaster-recovery authority.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 44 && (manifest.architecture.productionCutoverCertification !== 'governed-dist-provenance-cutover-v1' || !manifest.architecture.productionCutoverPolicy || !manifest.architecture.productionCutoverVerifier || !manifest.architecture.productionCutoverArtifactVerifier || manifest.architecture.productionCutoverDeployment !== 'github-pages-dist-only-live-smoke-v1')) {
    context.addIssue({ code: 'custom', message: 'Architecture v44+ requires governed production cutover policy, artifact verification, provenance, and dist-only deployment certification.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 45 && (manifest.architecture.functionalRegressionBaseline !== 'instrumented-characterization-evidence-v1' || !manifest.architecture.functionalRegressionPolicy || !manifest.architecture.functionalRegressionInventory || !manifest.architecture.functionalRegressionVerifier || !manifest.architecture.functionalRegressionBrowserRunner || !manifest.architecture.functionalRegressionEvidenceGenerator)) {
    context.addIssue({ code: 'custom', message: 'Architecture v45+ requires the governed Stage G functional-regression inventory, deterministic browser characterization, and redacted evidence authority.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 46 && (manifest.architecture.backendCapabilityPreflight !== 'authenticated-runtime-capability-gate-v1' || !manifest.architecture.backendCapabilityManifest || !manifest.architecture.backendCapabilityRuntime || !manifest.architecture.backendCapabilityAuthority)) {
    context.addIssue({ code: 'custom', message: 'Architecture v46+ requires the authenticated runtime backend-capability preflight, manifest, client runtime, and database authority.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 47 && (manifest.architecture.authSessionAccessContext !== 'restored-refresh-reconciled-rbac-v1' || !manifest.architecture.authSessionAccessContextContract || !manifest.architecture.authSessionAccessContextRuntime || !manifest.architecture.authSessionAccessContextAuthority || manifest.architecture.authSessionRouteAuthorization !== 'central-route-policy-rbac-v1')) {
    context.addIssue({ code: 'custom', message: 'Architecture v47+ requires stabilized session restoration, atomic authenticated access-context hydration, and centralized RBAC route authorization.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 48 && (manifest.architecture.routeOwnershipLifecycle !== 'exclusive-generation-route-ownership-v1' || !manifest.architecture.routeLifecycleContract || !manifest.architecture.routeLifecycleRuntime || !manifest.architecture.routeLifecycleController || manifest.architecture.routeTransitionCleanup !== 'overlay-focus-module-teardown-v1' || manifest.architecture.routeBackendCapabilityOwnership !== 'precommit-capability-aware-v1' || manifest.architecture.routePresentationReadiness !== 'owner-acknowledged-focus-v1' || !manifest.architecture.routePresentationReadinessRuntime)) {
    context.addIssue({ code: 'custom', message: 'Architecture v48+ requires exclusive generation-based route ownership, capability-aware precommit presentation ownership, explicit owner readiness focus acknowledgement, deterministic transition cleanup, and embedded-module teardown.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 49 && (manifest.architecture.accountFunctionalRecovery !== 'authenticated-account-self-service-v1' || !manifest.architecture.accountFunctionalRecoveryService || !manifest.architecture.accountFunctionalRecoveryRuntime)) {
    context.addIssue({ code: 'custom', message: 'Architecture v49+ requires authenticated Account functional recovery.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 50 && (manifest.architecture.usersRbacFunctionalRecovery !== 'serialized-admin-user-management-v1' || !manifest.architecture.usersRbacAuthority || !manifest.architecture.usersRbacUi)) {
    context.addIssue({ code: 'custom', message: 'Architecture v50+ requires serialized server-authoritative Users/RBAC functional recovery.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 51 && (manifest.architecture.settingsFunctionalRecovery !== 'reload-resilient-settings-control-plane-v1' || !manifest.architecture.settingsFunctionalRecoveryRuntime || manifest.architecture.settingsEvidencePersistence !== 'browser-local-verification-evidence-v1' || !manifest.architecture.settingsBackupAuthority)) {
    context.addIssue({ code: 'custom', message: 'Architecture v51+ requires reload-resilient Settings functional recovery with persisted verification evidence and governed backup authority.', path: ['architecture'] });
  }
  if (manifest.architectureVersion >= 52 && (manifest.architecture.managementAuthorityConsolidation !== 'single-react-management-runtime-v1' || manifest.architecture.managementAuthorityFeature !== 'management' || manifest.architecture.managementAuthorityUi !== 'src/app/management/AuthenticatedManagementUI.tsx' || manifest.architecture.managementAuthorityRuntime !== 'src/app/management/authenticated-management-ui-runtime.ts' || manifest.architecture.managementLegacyControllers !== 'retired-not-shipped-v1')) {
    context.addIssue({ code: 'custom', message: 'Architecture v52+ requires one consolidated React management feature/runtime authority with obsolete imperative management controllers retired from the shipped source tree.', path: ['architecture'] });
  }
});
