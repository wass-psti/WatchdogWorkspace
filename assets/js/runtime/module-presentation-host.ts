import type { ModuleId } from '../../../src/types/identifiers.ts';
import type { WorkManagementModuleDefinition } from '../../../src/types/modules.ts';
import type { ModuleHost, ModuleHostAuthPort, ModuleHostEvent, ModuleHostEventHandler } from '../../../src/platform/contracts/module-host.ts';
import type { NativeModuleDataPort, NativeModuleMountHandle, NativeModuleRegistry } from '../../../src/platform/contracts/module-presentation.ts';
import type { NormalizedModuleDataService } from '../../../src/platform/contracts/normalized-module-data.ts';
import { assessIframeRetirement } from '../../../src/platform/contracts/module-presentation.ts';

export interface ModulePresentationHostOptions {
  readonly auth: ModuleHostAuthPort;
  readonly iframeHost: ModuleHost;
  readonly nativeRegistry: NativeModuleRegistry;
  readonly normalizedData: NormalizedModuleDataService;
  readonly onEvent?: ModuleHostEventHandler | null;
}

export interface ModulePresentationHost {
  readonly moduleId: ModuleId | null;
  readonly mode: 'same-origin-iframe' | 'native-host' | null;
  attachIframe(frame: HTMLIFrameElement, module: WorkManagementModuleDefinition): void;
  mountNative(container: HTMLElement, module: WorkManagementModuleDefinition): Promise<boolean>;
  invalidate(reason?: 'backup-restore' | 'host-refresh'): boolean | Promise<boolean>;
  detach(): void;
}

function bindNormalizedData(service: NormalizedModuleDataService, moduleId: ModuleId): NativeModuleDataPort {
  const port: NativeModuleDataPort = {
    moduleId,
    load(options) { return service.load(moduleId, options); },
    get(canonicalKey, options) { return service.get(moduleId, canonicalKey, options); },
    put(input) { return service.put(Object.freeze({ ...input, moduleId })); },
    delete(input) { return service.delete(Object.freeze({ ...input, moduleId })); },
    invalidate() { return service.invalidate(moduleId); },
  };
  return Object.freeze(port);
}

export function createModulePresentationHost({ auth, iframeHost, nativeRegistry, normalizedData, onEvent = null }: ModulePresentationHostOptions): ModulePresentationHost {
  let activeModule: WorkManagementModuleDefinition | null = null;
  let activeMode: 'same-origin-iframe' | 'native-host' | null = null;
  let nativeHandle: NativeModuleMountHandle | null = null;
  let lifecycleEpoch = 0;

  const emit = (event: ModuleHostEvent): void => {
    try { onEvent?.(event); } catch { /* Presentation observers cannot break module lifecycle. */ }
  };

  const detachNative = (): void => {
    const moduleId = activeMode === 'native-host' ? activeModule?.id ?? null : null;
    try { nativeHandle?.dispose(); } finally { nativeHandle = null; }
    if (moduleId) emit(Object.freeze({ type: 'module:disposed', moduleId, detail: null }));
  };

  const detach = (): void => {
    lifecycleEpoch += 1;
    if (activeMode === 'native-host') detachNative();
    iframeHost.detach();
    activeModule = null;
    activeMode = null;
  };

  const attachIframe = (frame: HTMLIFrameElement, module: WorkManagementModuleDefinition): void => {
    detach();
    const assessment = assessIframeRetirement(module);
    if (assessment.decision !== 'retain-iframe' || module.presentationMode !== 'same-origin-iframe') {
      throw new Error(`${module.id} is not governed for iframe presentation.`);
    }
    activeModule = module;
    activeMode = 'same-origin-iframe';
    iframeHost.attach(frame, module);
  };

  const mountNative = async (container: HTMLElement, module: WorkManagementModuleDefinition): Promise<boolean> => {
    detach();
    const assessment = assessIframeRetirement(module);
    if (!assessment.ready) throw new Error(`${module.id} has not satisfied the iframe-retirement contract.`);
    const adapter = nativeRegistry.get(module.id);
    if (!adapter || adapter.boundary !== assessment.nativeBoundary) throw new Error(`${module.id} has no matching registered native adapter.`);
    const identity = auth.moduleIdentityContext(module.id);
    if (!identity) throw new Error(`No authorized identity context is available for ${module.id}.`);
    const mountEpoch = ++lifecycleEpoch;
    activeModule = module;
    activeMode = 'native-host';
    emit(Object.freeze({ type: 'module:attached', moduleId: module.id, detail: null }));
    emit(Object.freeze({ type: 'module:identity-published', moduleId: module.id, detail: null }));
    try {
      const mountedHandle = await adapter.mount(Object.freeze({ container, module, identity, normalizedData: bindNormalizedData(normalizedData, module.id) }));
      if (mountEpoch !== lifecycleEpoch || activeMode !== 'native-host' || activeModule?.id !== module.id) {
        mountedHandle.dispose();
        return false;
      }
      nativeHandle = mountedHandle;
      emit(Object.freeze({ type: 'module:ready', moduleId: module.id, detail: Object.freeze({ moduleId: module.id, name: module.name }) }));
      return true;
    } catch (error) {
      if (mountEpoch !== lifecycleEpoch || activeMode !== 'native-host' || activeModule?.id !== module.id) return false;
      const message = error instanceof Error ? error.message : 'Native module mount failed.';
      emit(Object.freeze({ type: 'module:error', moduleId: module.id, detail: Object.freeze({ moduleId: module.id, name: module.name, message }) }));
      activeModule = null;
      activeMode = null;
      emit(Object.freeze({ type: 'module:disposed', moduleId: module.id, detail: null }));
      throw error;
    }
  };

  const invalidate = async (reason: 'backup-restore' | 'host-refresh' = 'host-refresh'): Promise<boolean> => {
    if (activeMode === 'same-origin-iframe') return iframeHost.invalidate(reason);
    if (activeMode !== 'native-host' || !nativeHandle?.invalidate) return false;
    await nativeHandle.invalidate(reason);
    return true;
  };

  return Object.freeze({
    attachIframe,
    mountNative,
    invalidate,
    detach,
    get moduleId() { return activeModule?.id ?? null; },
    get mode() { return activeMode; },
  });
}
