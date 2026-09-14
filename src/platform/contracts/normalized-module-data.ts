import type { ModuleId } from '../../types/identifiers.ts';
import type { ModuleStateScope } from './module-data.ts';

export type NormalizedModuleDataEncoding = 'json' | 'data-url' | 'text';
export type NormalizedModuleDataStatus = 'valid' | 'invalid' | 'unmapped';
export interface NormalizedModuleDataDescriptor { readonly moduleId: ModuleId; readonly canonicalKey: string; readonly legacyKey: string; readonly scope: ModuleStateScope; readonly encoding: NormalizedModuleDataEncoding; readonly pattern?: string; }
export interface NormalizedModuleDataEntry { readonly moduleId: ModuleId; readonly canonicalKey: string | null; readonly legacyKey: string; readonly scope: ModuleStateScope; readonly revision: number; readonly status: NormalizedModuleDataStatus; readonly value: unknown; readonly rawValue: string; readonly validationError: string | null; }
export interface NormalizedModuleDataSnapshot { readonly moduleId: ModuleId; readonly entries: readonly NormalizedModuleDataEntry[]; readonly unmappedLegacyKeys: readonly string[]; }
export interface NormalizedModuleDataPutInput { readonly moduleId: ModuleId; readonly canonicalKey: string; readonly value: unknown; readonly expectedRevision?: number | null; }
export interface NormalizedModuleDataDeleteInput { readonly moduleId: ModuleId; readonly canonicalKey: string; readonly expectedRevision?: number | null; }
export interface NormalizedModuleDataMutationResult { readonly moduleId: ModuleId; readonly canonicalKey: string; readonly legacyKey: string; readonly revision: number | null; readonly deleted: boolean; }
export interface NormalizedModuleDataRegistry { readonly descriptors: readonly NormalizedModuleDataDescriptor[]; list(moduleId: ModuleId): readonly NormalizedModuleDataDescriptor[]; resolve(moduleId: ModuleId, canonicalKey: string): NormalizedModuleDataDescriptor | null; resolveLegacy(moduleId: ModuleId, legacyKey: string): NormalizedModuleDataDescriptor | null; }
export interface NormalizedModuleDataService { readonly registry: NormalizedModuleDataRegistry; load(moduleId: ModuleId, options?: Readonly<{ force?: boolean }>): Promise<NormalizedModuleDataSnapshot>; get(moduleId: ModuleId, canonicalKey: string, options?: Readonly<{ force?: boolean }>): Promise<NormalizedModuleDataEntry | null>; put(input: NormalizedModuleDataPutInput): Promise<NormalizedModuleDataMutationResult>; delete(input: NormalizedModuleDataDeleteInput): Promise<NormalizedModuleDataMutationResult>; invalidate(moduleId: ModuleId): number; }
