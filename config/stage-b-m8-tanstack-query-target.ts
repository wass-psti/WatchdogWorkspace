export type StageBM8ActivationState =
  | 'blocked-pending-m7-certification'
  | 'implementation-complete-pending-certification'
  | 'active-pending-release-certification'
  | 'active-certified';

export const STAGE_B_M8_TANSTACK_QUERY_TARGET = Object.freeze({
  milestone: 'Stage B Milestone 8 — TanStack Query migration',
  prerequisite: 'stage-b-m7:active-certified',
  package: '@tanstack/react-query',
  version: '5.102.8',
  nativeClientAuthority: 'assets/js/platform/data/tanstack-query-client.ts',
  compatibilityFacade: 'assets/js/platform/data/query-client.ts',
  reactProvider: 'src/app/composition/WorkManagementQueryProvider.tsx',
  architectureVersion: 18,
  activationState: 'active-certified' as StageBM8ActivationState,
  boundaries: Object.freeze([
    'single-page-lifetime-query-client',
    'react-query-client-provider',
    'legacy-query-contract-facade',
    'deterministic-query-key-hashing',
    'in-flight-request-deduplication',
    'stale-time-cache-reuse',
    'prefix-invalidation',
    'mutation-cache-lifecycle',
    'session-boundary-cache-clear',
    'repository-owned-query-functions',
  ]),
});
