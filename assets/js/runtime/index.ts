/* Public dependency gateway for the Work Management shell. */
export { modules, moduleRegistry, nativeModuleRegistry, registerNativeModuleAdapter } from '../features/modules/index.ts';
export { auth, AUTH_EVENT, AUTH_FEATURE } from '../features/auth/index.ts';
export { createHomeFeature } from '../features/home/index.ts';
export { createCommandPaletteFeature, createCommandRegistry } from '../features/commands/index.ts';
export { createBoardsFeature } from '../features/boards/index.ts';
export { parseRoute, navigate } from '../core/router.ts';
export {
  PLATFORM_VERSION,
  DEFAULT_PREFERENCES,
  applyTheme,
  applyDensity,
  getPreferences,
  savePreferences,
  safeModuleStatus,
  readTimeTrackerSnapshot,
  readFuelTrackSnapshot,
  readTradeLinkSnapshot,
  markRecent,
  toggleFavorite,
  getStorageHealth,
  requestPersistentStorage,
  runPlatformDiagnostics,
  verifyModuleCompatibility,
  registerServiceWorker,
  activateServiceWorkerUpdate,
} from '../core/platform.ts';
export { downloadWorkspaceBackup, inspectBackupFile, parseBackupFile, restoreWorkspaceBackup, restoreWorkspaceBackupGuarded } from '../core/backup.ts';
export { createRecoveryPackage, verifyRecoveryPackage, assessRecoveryPackage, assessLegacyBackup } from '../platform/recovery/backup-disaster-recovery.ts';
export { installCloudModuleDataBridge } from '../core/cloud-module-data.ts';
export { createWorkManagementClient } from './work-management-client.ts';
export { createModuleHost } from './module-host.ts';
export { createModulePresentationHost } from './module-presentation-host.ts';
export { createFeatureRegistry } from './feature-registry.ts';
export { createRouteController } from './route-controller.ts';
export { createRouteLifecycleCoordinator } from './route-lifecycle.ts';
export { presentationReadinessRuntime } from '../../../src/app/composition/presentation-readiness-runtime.ts';
export { createRoutePolicyService } from './services/route-policy.ts';
export { installApplicationLifecycle } from './application-lifecycle.ts';
export { applicationManifest, validateApplicationManifest } from '../../../config/application-manifest.ts';
export { icons } from '../ui/icons.ts';
export { escapeHtml, formatBytes } from '../ui/format.ts';

export { createDiagnostics } from '../platform/observability/diagnostics.ts';
export { createObservability } from '../platform/observability/observability.ts';
export { installBrowserObservability } from '../platform/observability/browser-observer.ts';
export { createBeaconObservabilityTransport } from '../platform/observability/beacon-transport.ts';
export { createRuntimeErrorBoundary } from './error-boundary.ts';
export { createQueryClient, queryKey } from '../platform/data/query-client.ts';
export { createTanStackQueryClient, workManagementTanStackQueryClient, TANSTACK_QUERY_VERSION } from '../platform/data/tanstack-query-client.ts';
export { createWorkManagementClientStateService, workManagementClientState, ZUSTAND_VERSION } from '../platform/state/client-state-store.ts';
export { createBackendClient } from '../platform/data/backend-client.ts';
export { createSupabaseClientAdapter, SupabaseClientAdapterError } from '../platform/data/supabase-client-adapter.ts';
export { createOverlayManager } from '../platform/ui/overlay-manager.ts';
export { globalOverlayRuntime, resolveGlobalOverlayRoot, resolveGlobalToastRoot, GLOBAL_OVERLAY_OPEN_EVENT } from '../platform/ui/global-overlay-runtime.ts';
export { authenticatedManagementUiRuntime } from '../../../src/app/management/authenticated-management-ui-runtime.ts';
export { sharedApplicationUiRuntime } from '../../../src/app/shared-ui/shared-application-ui-runtime.ts';
export { positionAnchoredSurface, cssPixelValue, menuItemElements, focusMenuItem, focusMenuItemByTypeahead } from '../platform/ui/floating-surface.ts';
export { CAPABILITIES, hasPlatformCapability, hasBoardCapability, canAccessModuleByPolicy } from '../platform/auth/permissions.ts';
export { createPlatformServices } from './platform-services.ts';
