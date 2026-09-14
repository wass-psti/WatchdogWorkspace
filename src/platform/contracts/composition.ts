import type { ApplicationManifest, ManifestValidationResult } from '../../types/manifest.ts';
import type { Capability, PlatformRole } from '../../types/auth.ts';
import type { ErrorNormalizationContext } from '../../types/errors.ts';
import type { AuthTransportPort, BackendClient } from './transport.ts';
import type { SupabaseClientAdapter } from './supabase-client.ts';
import type { DiagnosticsService } from './diagnostics.ts';
import type { ObservabilityService, ObservabilityTransport } from './observability.ts';
import type { QueryClient } from './query.ts';
import type { WorkManagementClientStateService } from './client-state.ts';
import type { BoardRepository } from '../../features/boards/contracts/repository.ts';
import type { BoardDomainService } from '../../features/boards/contracts/service.ts';
import type { BoardCommandService } from '../../features/boards/contracts/commands.ts';
import type { BoardRealtimeService } from '../../features/boards/contracts/realtime.ts';
import type { RoutePolicyService } from './routing.ts';
import type { WorkManagementError } from '../../../assets/js/platform/errors/app-error.ts';
import type { NormalizedModuleDataService } from './normalized-module-data.ts';
import type { RealtimePlatform } from './realtime-platform.ts';
import type { EdgeFunctionClient } from './edge-functions.ts';
export interface PlatformServices {
  readonly auth: AuthTransportPort;
  readonly diagnostics: DiagnosticsService;
  readonly observability: ObservabilityService;
  readonly serverState: QueryClient;
  readonly clientState: WorkManagementClientStateService;
  readonly backend: BackendClient;
  readonly supabase: SupabaseClientAdapter;
  readonly realtime: RealtimePlatform;
  readonly edgeFunctions: EdgeFunctionClient;
  readonly boards: Readonly<{ readonly repository: BoardRepository; readonly service: BoardDomainService; readonly commands: BoardCommandService; readonly realtime: BoardRealtimeService }>;
  readonly modules: Readonly<{ readonly normalizedData: NormalizedModuleDataService }>;
  readonly routing: RoutePolicyService;
  readonly manifest: Readonly<{ readonly value: ApplicationManifest; validate(): ManifestValidationResult }>;
  readonly authorization: Readonly<{ hasPlatformCapability(role: PlatformRole|string|null|undefined, capability: Capability): boolean }>;
  readonly errors: Readonly<{ normalize(error: unknown, context?: ErrorNormalizationContext): WorkManagementError }>;
}
export interface PlatformServiceOptions { readonly auth: AuthTransportPort; readonly diagnosticLimit?: number; readonly queryStaleTime?: number; readonly observabilityLimit?: number; readonly observabilityExportSampleRate?: number; readonly observabilityTransport?: ObservabilityTransport | null; }
