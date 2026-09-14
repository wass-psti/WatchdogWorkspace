export type StageBM5ActivationState =
  | 'blocked-pending-m4-certification'
  | 'blocked-pending-registry-access'
  | 'dependencies-installed-pending-certification'
  | 'active-pending-release-certification'
  | 'active-certified';

/** Governed dependency and activation target for Stage B Milestone 5. */
export const stageBM5InteractionTarget = Object.freeze({
  arkReact: '5.39.1',
  floatingReact: '0.27.20',
  lucideReact: '1.41.0',
  activationState: 'active-certified' as StageBM5ActivationState,
  prerequisite: 'stage-b-m4:active-certified',
  vendorTypePolicy: 'stage-b-m4:skipLibCheck',
  dependencyOwnership: 'direct-root-only',
  publicBoundary: 'src/design-system/index.ts',
  interactionBoundary: 'src/design-system/interactions/index.ts',
  iconBoundary: 'src/design-system/icons/index.ts',
  stagedCompilerExcludes: Object.freeze([
    'src/design-system/interactions/**/*',
    'src/design-system/icons/**/*',
  ]),
} as const);
