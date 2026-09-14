import type { ModuleId } from '../src/types/identifiers.ts';
import type { IframeRetirementBlocker } from '../src/platform/contracts/module-presentation.ts';

export type M26ActivationState =
  | 'implementation-complete-pending-certification'
  | 'active-pending-release-certification'
  | 'active-certified';

export interface M26ModuleAssessment {
  readonly moduleId: ModuleId;
  readonly decision: 'retain-iframe' | 'retire-iframe';
  readonly presentationMode: 'same-origin-iframe' | 'native-host';
  readonly blockers: readonly IframeRetirementBlocker[];
  readonly productionRuntime: string;
  readonly nativeBoundary: string | null;
}

const commonCompatibilityBlockers = Object.freeze([
  'native-mount-contract',
  'root-scoped-dom-ownership',
  'scoped-style-ownership',
  'global-runtime-isolation',
  'direct-host-identity-consumption',
  'direct-normalized-data-consumption',
  'host-browser-permission-integration',
  'lifecycle-disposal-parity',
  'native-regression-parity',
] as const satisfies readonly IframeRetirementBlocker[]);

export const stageEM26IframeRetirementTarget = Object.freeze({
  milestone: 26,
  name: 'Retire iframe compatibility where justified',
  activationState: 'active-certified' as M26ActivationState,
  prerequisite: Object.freeze({ milestone: 25, requiredState: 'active-certified' }),
  architectureVersion: 34,
  hostAuthority: Object.freeze({
    mode: 'hybrid-native-or-same-origin-iframe',
    presentationContract: 'hybrid-native-retirement-gated-v1',
    presentationHost: 'assets/js/runtime/module-presentation-host.ts',
    nativeRegistry: 'assets/js/features/modules/native-module-registry.ts',
    retirementContract: 'src/platform/contracts/module-presentation.ts',
  }),
  retirementPolicy: Object.freeze({
    retireOnlyWhenAllGatesPass: true,
    noDomInjectionOfFullDocumentApps: true,
    noGlobalScriptReexecutionInHostDocument: true,
    requireNativeMountContract: true,
    requireRootScopedDomOwnership: true,
    requireScopedStyleOwnership: true,
    requireNoGlobalRuntimeCollision: true,
    requireDirectHostIdentityConsumption: true,
    requireDirectNormalizedDataConsumption: true,
    requireModuleScopedNormalizedDataPort: true,
    requireHostBrowserPermissionIntegration: true,
    requireLifecycleDisposalParity: true,
    requireNativeRegressionParity: true,
  }),
  retiredModuleIds: Object.freeze([] as ModuleId[]),
  retainedModuleIds: Object.freeze(['time-tracker', 'fueltrack-plus', 'tradelink'] as ModuleId[]),
  assessments: Object.freeze([
    Object.freeze({
      moduleId: 'time-tracker',
      decision: 'retain-iframe',
      presentationMode: 'same-origin-iframe',
      blockers: commonCompatibilityBlockers,
      productionRuntime: 'apps/time-tracker/app.js',
      nativeBoundary: null,
    }),
    Object.freeze({
      moduleId: 'fueltrack-plus',
      decision: 'retain-iframe',
      presentationMode: 'same-origin-iframe',
      blockers: commonCompatibilityBlockers,
      productionRuntime: 'apps/fueltrack-plus/app.v3.17.0-wm6.js',
      nativeBoundary: null,
    }),
    Object.freeze({
      moduleId: 'tradelink',
      decision: 'retain-iframe',
      presentationMode: 'same-origin-iframe',
      blockers: commonCompatibilityBlockers,
      productionRuntime: 'apps/tradelink/app.v1.42.0-wm1.js',
      nativeBoundary: null,
    }),
  ] as const satisfies readonly M26ModuleAssessment[]),
  outcome: Object.freeze({
    justifiedRetirementCount: 0,
    unsafeIframeRetirementAttempted: false,
    hostReadyForFutureNativeAdapters: true,
    nativeDataPortModuleScoped: true,
    nativeMountFailureLifecycleParity: true,
    iframeIsPlatformDefault: false,
    iframeIsPerModuleCompatibilityDecision: true,
  }),
  newExternalDependency: null,
  supabaseMigrationRequired: false,
});
