import type { M38CapabilityModule } from '../../../config/backend-capability-manifest.ts';
import type { BackendConfigurationSource, WorkManagementRuntimeEnvironment } from '../../../config/vite-runtime-config.ts';
export type BackendPreflightState='idle'|'checking'|'ready'|'blocked';
export interface BackendModuleCapabilityStatus { readonly ready:boolean; readonly missing:readonly string[]; }
export interface BackendCapabilitySnapshot {
  readonly state:BackendPreflightState;
  readonly checkedAt:string|null;
  readonly code:string|null;
  readonly message:string;
  readonly schemaVersion:string|null;
  readonly environment:WorkManagementRuntimeEnvironment;
  readonly configurationSource:BackendConfigurationSource;
  readonly projectHost:string|null;
  readonly missing:Readonly<{tables:readonly string[];rpcs:readonly string[];storage:readonly string[];realtime:readonly string[]}>;
  readonly modules:Readonly<Record<M38CapabilityModule,BackendModuleCapabilityStatus>>;
}
