export type M39ActivationState = 'implementation-complete-pending-certification' | 'active-pending-browser-certification' | 'active-certified';

export const stageGM39AuthSessionAccessContextTarget = Object.freeze({
  milestone: 39,
  stage: 'G',
  name: 'Authentication, Session & Access Context Stabilization',
  activationState: 'active-certified' as M39ActivationState,
  prerequisite: Object.freeze({ milestone: 38, requiredState: 'active-certified' as const }),
  architectureVersion: 47,
  authority: Object.freeze({
    auth: 'assets/js/core/auth.ts',
    lifecycle: 'assets/js/core/auth-state.ts',
    routePolicy: 'assets/js/runtime/services/route-policy.ts',
    authorizationReconciliation: 'assets/js/runtime/authorization-context.ts',
    accessContextRpc: 'public.wm_auth_access_context',
    migration: 'supabase/migrations/v1.43.2-stage-g-m39-auth-session-access-context.sql',
    contract: 'src/platform/contracts/auth-session-access-context.ts',
    browser: 'tests/modern/e2e/auth-session-access-context.spec.mjs',
  }),
  completionCriteria: Object.freeze([
    'Stored sessions restore through an explicit restoring lifecycle and never authorize before profile hydration completes.',
    'Access-token refresh does not invalidate same-session access-context hydration or RBAC reconciliation.',
    'Admin and non-admin identities persist across page reload and same-browser application restart.',
    'Profile, account status, platform role, and module assignments hydrate atomically from the authenticated database authority.',
    'Disabled accounts and unauthorized Users/module routes fail closed before dependent UI is exposed.',
    'Authorization changes clear server/transient state and revoke active module presentation when access is removed.',
    'Transient access-context failures preserve the refresh session for retry instead of silently destroying authentication state.',
  ]),
  knownBoundaries: Object.freeze([
    'M38 runtime/backend capability preflight remains the environment/backend readiness gate.',
    'M26 same-origin iframe compatibility remains for embedded modules.',
    'M28 protected-RPC/Edge Function cutover boundary remains.',
    'Boards retain the React-host/imperative-engine presentation boundary pending M40/M45+ recovery.',
  ]),
});
