import type { ModuleId } from '../src/types/identifiers.ts';
import type { WorkManagementModuleDefinition } from '../src/types/modules.ts';
import type { NormalizedModuleDataDescriptor, NormalizedModuleDataRegistry } from '../src/platform/contracts/normalized-module-data.ts';
import { normalizedModuleDataDescriptorSchema } from '../src/runtime-schemas/normalized-module-data.ts';
import { workManagementModulesSchema } from '../src/runtime-schemas/index.ts';

// M145: no standalone applications are installed. This is an intentional empty
// catalogue; the generic host, schema, and future registration contracts remain.
const moduleDefinitions: Readonly<Partial<Record<ModuleId, WorkManagementModuleDefinition>>> = Object.freeze({});

// Validate the untrusted/runtime shape without making Zod's mutable output the
// compile-time authority for the readonly application manifest types.
workManagementModulesSchema.parse(Object.values(moduleDefinitions));

export const modules: readonly WorkManagementModuleDefinition[] = Object.freeze(Object.values(moduleDefinitions));
export const moduleDefinitionsById: Readonly<Partial<Record<ModuleId, WorkManagementModuleDefinition>>> = moduleDefinitions;


// Retired application state stays in Supabase for recovery; no old module
// descriptors may be resolved by this runtime until explicitly re-integrated.
const normalizedModuleDataDescriptors = Object.freeze([] as NormalizedModuleDataDescriptor[]);
for (const descriptor of normalizedModuleDataDescriptors) normalizedModuleDataDescriptorSchema.parse(descriptor);
const canonicalIds = new Set<string>(); const legacyIds = new Set<string>();
for (const descriptor of normalizedModuleDataDescriptors) { const canonicalId = `${descriptor.moduleId}:${descriptor.canonicalKey}`; const legacyId = `${descriptor.moduleId}:${descriptor.legacyKey}`; if (canonicalIds.has(canonicalId)) throw new Error(`Duplicate normalized module canonical key: ${canonicalId}`); if (legacyIds.has(legacyId)) throw new Error(`Duplicate normalized module legacy key: ${legacyId}`); canonicalIds.add(canonicalId); legacyIds.add(legacyId); }
export const normalizedModuleDataRegistry: NormalizedModuleDataRegistry = Object.freeze({
  descriptors: normalizedModuleDataDescriptors,
  list(moduleId: ModuleId) { return normalizedModuleDataDescriptors.filter((descriptor) => descriptor.moduleId === moduleId); },
  resolve(moduleId: ModuleId, canonicalKey: string) { return normalizedModuleDataDescriptors.find((descriptor) => descriptor.moduleId === moduleId && descriptor.canonicalKey === canonicalKey) ?? null; },
  resolveLegacy(moduleId: ModuleId, legacyKey: string) { return normalizedModuleDataDescriptors.find((descriptor) => descriptor.moduleId === moduleId && descriptor.legacyKey === legacyKey) ?? null; },
});
