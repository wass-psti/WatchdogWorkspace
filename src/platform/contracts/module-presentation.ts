import type { ModuleId } from '../../types/identifiers.ts';
import type { IframeRetirementBlocker, IframeRetirementDecision, ModulePresentationMode, WorkManagementModuleDefinition } from '../../types/modules.ts';
export type { IframeRetirementBlocker, IframeRetirementDecision, IframeRetirementProfile, ModulePresentationMode } from '../../types/modules.ts';
import type { EmbeddedModuleIdentityContext } from './embedded-module.ts';
import type {
  NormalizedModuleDataDeleteInput,
  NormalizedModuleDataEntry,
  NormalizedModuleDataMutationResult,
  NormalizedModuleDataPutInput,
  NormalizedModuleDataSnapshot,
} from './normalized-module-data.ts';

export interface IframeRetirementAssessment {
  readonly moduleId: ModuleId;
  readonly presentationMode: ModulePresentationMode;
  readonly decision: IframeRetirementDecision;
  readonly ready: boolean;
  readonly blockers: readonly IframeRetirementBlocker[];
  readonly nativeBoundary: string | null;
}

export interface NativeModuleDataPort {
  readonly moduleId: ModuleId;
  load(options?: Readonly<{ force?: boolean }>): Promise<NormalizedModuleDataSnapshot>;
  get(canonicalKey: string, options?: Readonly<{ force?: boolean }>): Promise<NormalizedModuleDataEntry | null>;
  put(input: Omit<NormalizedModuleDataPutInput, 'moduleId'>): Promise<NormalizedModuleDataMutationResult>;
  delete(input: Omit<NormalizedModuleDataDeleteInput, 'moduleId'>): Promise<NormalizedModuleDataMutationResult>;
  invalidate(): number;
}

export interface NativeModuleMountContext {
  readonly container: HTMLElement;
  readonly module: WorkManagementModuleDefinition;
  readonly identity: EmbeddedModuleIdentityContext;
  readonly normalizedData: NativeModuleDataPort;
}

export interface NativeModuleMountHandle {
  dispose(): void;
  invalidate?(reason: 'backup-restore' | 'host-refresh'): void | Promise<void>;
}

export interface NativeModuleAdapter {
  readonly moduleId: ModuleId;
  readonly boundary: string;
  mount(context: NativeModuleMountContext): NativeModuleMountHandle | Promise<NativeModuleMountHandle>;
}

export interface NativeModuleRegistry {
  get(moduleId: ModuleId): NativeModuleAdapter | null;
  has(moduleId: ModuleId): boolean;
  list(): readonly NativeModuleAdapter[];
}

export function assessIframeRetirement(module: WorkManagementModuleDefinition): IframeRetirementAssessment {
  const blockers = Object.freeze([...module.iframeRetirement.blockers]);
  const nativeBoundary = module.iframeRetirement.nativeBoundary?.trim() || null;
  const retired = module.iframeRetirement.decision === 'retire-iframe';
  const ready = retired
    && module.presentationMode === 'native-host'
    && blockers.length === 0
    && nativeBoundary !== null;
  return Object.freeze({
    moduleId: module.id,
    presentationMode: module.presentationMode,
    decision: module.iframeRetirement.decision,
    ready,
    blockers,
    nativeBoundary,
  });
}
