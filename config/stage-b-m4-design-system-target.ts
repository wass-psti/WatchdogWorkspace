export type StageBM4ActivationState =
  | 'blocked-pending-registry-access'
  | 'dependencies-installed-pending-certification'
  | 'active-pending-release-certification'
  | 'active-certified';

/** Governed dependency and activation target for Stage B Milestone 4. */
export const stageBM4DesignSystemTarget = Object.freeze({
  chakraReact: '3.36.1',
  emotionReact: '11.14.0',
  activationState: 'active-certified' as StageBM4ActivationState,
  providerBoundary: 'src/design-system/WorkManagementDesignSystemProvider.tsx',
  publicBoundary: 'src/design-system/index.ts',
  compositionRoot: 'src/app/composition/ApplicationCompositionRoot.tsx',
} as const);
