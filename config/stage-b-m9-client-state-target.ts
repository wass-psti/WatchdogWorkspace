export type StageBM9ActivationState =
  | 'blocked-pending-m8-certification'
  | 'implementation-complete-pending-certification'
  | 'active-pending-release-certification'
  | 'active-certified';

export const STAGE_B_M9_CLIENT_STATE_TARGET = Object.freeze({
  milestone: 'Stage B Milestone 9 — Client-state ownership model',
  prerequisite: 'stage-b-m8:active-certified',
  package: 'zustand',
  version: '5.0.15',
  storeAuthority: 'assets/js/platform/state/client-state-store.ts',
  contractAuthority: 'src/platform/contracts/client-state.ts',
  reactBridge: 'src/app/composition/useWorkManagementClientState.ts',
  architectureVersion: 19,
  activationState: 'active-certified' as StageBM9ActivationState,
  boundaries: Object.freeze([
    'zustand-shared-client-state-only',
    'tanstack-query-remains-server-state-authority',
    'supabase-auth-remains-session-authority',
    'supabase-remains-domain-persistence-authority',
    'persistent-preferences-hydrate-client-state',
    'feature-local-state-remains-feature-owned',
    'form-state-remains-workflow-owned',
    'derived-state-remains-computed',
    'page-lifetime-shell-client-state-service',
    'react-and-imperative-consumers-share-one-client-state-service',
  ]),
});
