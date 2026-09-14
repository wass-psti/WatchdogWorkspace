export type StageBM7ActivationState =
  | 'blocked-pending-m6-certification'
  | 'implementation-complete-pending-certification'
  | 'active-pending-release-certification'
  | 'active-certified';

export const STAGE_B_M7_SUPABASE_CLIENT_TARGET = Object.freeze({
  milestone: 'Stage B Milestone 7 — Supabase client adapter',
  prerequisite: 'stage-b-m6:active-certified',
  adapterAuthority: 'assets/js/platform/data/supabase-client-adapter.ts',
  contractAuthority: 'src/platform/contracts/supabase-client.ts',
  architectureVersion: 17,
  activationState: 'active-certified' as StageBM7ActivationState,
  boundaries: Object.freeze([
    'project-url-validation',
    'publishable-key-headers',
    'authenticated-rest',
    'postgres-rpc',
    'private-storage-upload',
    'private-storage-delete',
    'private-storage-signing',
    'signed-url-origin-validation',
    'timeout-and-cancellation',
    'provider-error-normalization',
  ]),
});
