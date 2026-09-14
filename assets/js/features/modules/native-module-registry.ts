import type { ModuleId } from '../../../../src/types/identifiers.ts';
import type { NativeModuleAdapter, NativeModuleRegistry } from '../../../../src/platform/contracts/module-presentation.ts';

const adapters = new Map<ModuleId, NativeModuleAdapter>();

export function registerNativeModuleAdapter(adapter: NativeModuleAdapter): () => void {
  if (adapters.has(adapter.moduleId)) throw new Error(`Native module adapter already registered: ${adapter.moduleId}`);
  adapters.set(adapter.moduleId, adapter);
  return () => { if (adapters.get(adapter.moduleId) === adapter) adapters.delete(adapter.moduleId); };
}

export const nativeModuleRegistry: NativeModuleRegistry = Object.freeze({
  get(moduleId: ModuleId) { return adapters.get(moduleId) ?? null; },
  has(moduleId: ModuleId) { return adapters.has(moduleId); },
  list() { return Object.freeze([...adapters.values()]); },
});
