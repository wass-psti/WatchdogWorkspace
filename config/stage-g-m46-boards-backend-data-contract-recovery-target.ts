export type M46ActivationState = 'implementation-complete-pending-certification' | 'active-certified';

export const stageGM46BoardsBackendDataContractRecoveryTarget = Object.freeze({
  milestone: 46,
  stage: 'G',
  name: 'Boards Backend & Data Contract Recovery',
  activationState: 'implementation-complete-pending-certification' as M46ActivationState,
  prerequisite: Object.freeze({ milestone: 45, requiredState: 'active-certified' as const }),
  architectureVersion: 54,
  authority: Object.freeze({
    contract: 'config/stage-g-m46-board-backend-contract.ts',
    migration: 'supabase/migrations/v1.43.2-stage-g-m46-boards-backend-data-contract-recovery.sql',
    schema: 'supabase/schema.sql',
    repository: 'assets/js/features/boards/data/board-repository.ts',
    dtoBoundary: 'assets/js/features/boards/data/board-contracts.ts',
    backendPreflight: 'assets/js/platform/data/backend-capability-preflight.ts',
    retainedBackendPreflightVerifier: 'scripts/verify-runtime-backend-preflight-execution.mjs',
    databaseTest: 'supabase/tests/m46/boards_backend_contract_recovery.test.sql',
  }),
  completionCriteria: Object.freeze([
    'Every frontend Board RPC is bound to an exact deployed PostgreSQL input signature, default-argument count, return contract, authenticated execution boundary, SECURITY DEFINER authority, and pinned public search_path.',
    'The nine Board tables match the governed column/type/nullability contract, have RLS enabled, and expose no direct anon/authenticated table privileges.',
    'The private Board storage bucket, storage RLS policies, Board Realtime authorization policies, and Board change triggers are present and contract-attested.',
    'Board DTO mapping rejects malformed required names/titles and preserves canonical author_id/actor_id identity while temporarily accepting created_by from pre-M46 item-workspace payloads.',
    'Board query-cache invalidation is scoped to Boards, structural mutations invalidate preference data, and Board cache clearing never clears unrelated shared server state.',
    'Attachment deletion commits authoritative metadata deletion before best-effort private-object cleanup and validates the canonical storage path returned by the backend.',
    'Runtime Boards readiness requires the M46 live catalog attestation version/digest to match and report compatible=true.',
    'The retained M38 deterministic backend-preflight fixture models M46 Board attestation success, digest mismatch, and compatible=false without weakening non-Board module readiness.',
    'The authoritative schema snapshot and forward M46 migration are synchronized and pass deterministic plus local Database/RLS verification.',
    'Production certification proves the deployed Supabase catalog returns the exact M46 contract version/digest with compatible=true before M46 can become active-certified.',
  ]),
  knownBoundaries: Object.freeze([
    'The historical semantic migration archive remains preserved; production application uses an isolated timestamped M46 forward-migration workdir rather than replaying pre-CLI migration history.',
    'The DTO mapper retains created_by as a temporary read-only compatibility alias until all environments are confirmed on the M46 item-workspace payload.',
    'M47-M51 remain responsible for Board table/cell, Kanban, item-workspace UX, realtime/collaboration, and advanced formula/relationship behavior beyond M46 contract recovery.',
    'M54 remains responsible for final production-readiness certification.',
  ]),
});
