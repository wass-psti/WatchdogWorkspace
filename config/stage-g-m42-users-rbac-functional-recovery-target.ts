export type M42ActivationState = 'implementation-complete-pending-certification' | 'active-pending-browser-certification' | 'active-certified';
export const stageGM42UsersRbacFunctionalRecoveryTarget = Object.freeze({
  milestone:42, stage:'G', name:'Users / RBAC Functional Recovery',
  activationState:'implementation-complete-pending-certification' as M42ActivationState,
  prerequisite:Object.freeze({ milestone:41, requiredState:'active-certified' as const }),
  architectureVersion:50,
  authority:Object.freeze({
    userUi:'src/app/management/AuthenticatedManagementUI.tsx', authRuntime:'assets/js/core/auth.ts',
    directoryRpc:'public.list_user_directory', mutationRpc:'public.admin_set_user_access',
    migration:'supabase/migrations/v1.43.2-stage-g-m42-users-rbac-functional-recovery.sql',
    databaseTests:'supabase/tests/database/40_users_rbac_functional_recovery.test.sql',
    browser:'tests/modern/e2e/users-rbac-functional-recovery.spec.mjs',
  }),
  completionCriteria:Object.freeze([
    'Admin user directory loads from the authenticated backend and supports search, refresh, loading, empty, error, and retry states.',
    'Role and account-status mutations execute through one serialized security-definer transaction and synchronize derived module roles before commit.',
    'Bootstrap administrator protection is server authoritative and represented by server-supplied directory policy flags rather than client hard-coding.',
    'Last-active-admin protection remains correct under concurrent administrative mutation attempts.',
    'Self-disable is rejected; self-role demotion is allowed only when another active Admin/General Manager remains and immediately reconciles the caller access context.',
    'Unauthorized roles cannot load the administrative directory or mutate user access even if client controls are bypassed.',
    'Mutation success is not falsely reported as failure when only the subsequent directory refresh fails.',
    'Browser verification covers directory/search/refresh, mutations, safeguards, self-role transitions, unauthorized access, and failure recovery.',
  ]),
  knownBoundaries:Object.freeze([
    'M26 same-origin iframe compatibility remains for embedded applications that have not met native-retirement criteria.',
    'M43 remains responsible for Settings Functional Recovery.',
    'M54 remains responsible for final production-readiness certification.',
  ]),
});
