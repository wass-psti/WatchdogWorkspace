export type M41ActivationState = 'implementation-complete-pending-certification' | 'active-pending-browser-certification' | 'active-certified';

export const stageGM41AccountFunctionalRecoveryTarget = Object.freeze({
  milestone: 41,
  stage: 'G',
  name: 'Account Functional Recovery',
  activationState: 'active-certified' as M41ActivationState,
  prerequisite: Object.freeze({ milestone: 40, requiredState: 'active-certified' as const }),
  architectureVersion: 49,
  authority: Object.freeze({
    accountUi: 'src/app/management/AuthenticatedManagementUI.tsx',
    accountRuntime: 'src/app/management/authenticated-management-ui-runtime.ts',
    accountService: 'assets/js/features/account/account-service.ts',
    authRuntime: 'assets/js/core/auth.ts',
    accessContextAuthority: 'public.wm_auth_access_context',
    profileAuthority: 'public.update_own_profile',
    passwordAuthority: 'Supabase Auth /auth/v1/user',
    sessionRevocationAuthority: 'Supabase Auth /auth/v1/logout',
    browser: 'tests/modern/e2e/account-functional-recovery.spec.mjs',
  }),
  completionCriteria: Object.freeze([
    'Profile editing uses authenticated backend authority and refreshes visible identity without client-only persistence.',
    'Access refresh validates the live session before reloading authoritative profile and module-role assignments.',
    'Password updates distinguish password mutation success from global-session revocation failure and preserve a retryable authenticated state when revocation cannot be confirmed.',
    'Local sign-out destroys the browser session even when best-effort remote local revocation fails.',
    'Global sign-out does not clear the current browser session until Supabase confirms global revocation.',
    'Account displays authoritative module roles and access states for every registered module.',
    'Session lifecycle states and backend failures are visible and recoverable without stale Account UI ownership.',
    'Browser verification covers normal, failure, and retry paths for profile, access refresh, password, local sign-out, and global sign-out.',
  ]),
  knownBoundaries: Object.freeze([
    'M26 same-origin iframe compatibility remains for embedded applications that have not met native-retirement criteria.',
    'M42 remains responsible for Users/RBAC functional recovery beyond Account self-service operations.',
    'M43 remains responsible for Settings functional recovery.',
  ]),
});
