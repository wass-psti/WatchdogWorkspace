export type StageBM6ActivationState =
  | 'blocked-pending-m5-certification'
  | 'dependencies-installed-pending-certification'
  | 'active-pending-release-certification'
  | 'active-certified';

export const STAGE_B_M6_RUNTIME_SCHEMA_TARGET = Object.freeze({
  milestone: 'Stage B Milestone 6 — Runtime schemas',
  prerequisite: 'stage-b-m5:active-certified',
  zod: '4.5.4',
  schemaAuthority: 'src/runtime-schemas/index.ts',
  architectureVersion: 16,
  activationState: 'active-certified' as StageBM6ActivationState,
  boundaries: Object.freeze([
    'application-manifest',
    'module-manifest',
    'module-data-protocol',
    'module-data-responses',
    'module-identity-context',
    'module-host-messages',
    'authorization-inputs',
    'persistence-envelopes',
    'application-routes',
    'embedded-lifecycle',
    'runtime-context',
  ]),
});
