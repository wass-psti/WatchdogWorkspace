export type M28ActivationState =
  | 'implementation-complete-pending-certification'
  | 'active-pending-release-certification'
  | 'active-certified';

export const stageFM28EdgeFunctionsTarget = Object.freeze({
  milestone: 28,
  stage: 'F',
  name: 'Edge Functions',
  activationState: 'active-certified' as M28ActivationState,
  prerequisite: Object.freeze({ milestone: 27, requiredState: 'active-certified' as const }),
  architectureVersion: 36,
  authority: Object.freeze({
    contract: 'src/platform/contracts/edge-functions.ts',
    client: 'assets/js/platform/data/edge-function-client.ts',
    functionRoot: 'supabase/functions',
    supabaseConfig: 'supabase/config.toml',
    authorization: 'jwt-plus-live-admin-policy-v1' as const,
    secrets: 'server-only-environment-v1' as const,
  }),
  functions: Object.freeze([
    Object.freeze({
      name: 'admin-sync-auth-access' as const,
      entrypoint: 'supabase/functions/admin-sync-auth-access/index.ts',
      handler: 'supabase/functions/admin-sync-auth-access/handler.ts',
      verifyJwt: true,
      method: 'POST' as const,
      callerPolicy: 'active-admin-general-manager' as const,
      serverPrivilege: 'supabase-auth-admin-update-user' as const,
      purpose: 'Synchronize Work Management disabled/active account status with Supabase Auth ban/unban state.',
    }),
  ]),
  security: Object.freeze({
    browserSecretsAllowed: false,
    arbitraryFunctionInvocationAllowed: false,
    exactOriginAllowlistRequired: true,
    userJwtRequired: true,
    liveAdminProfileCheckRequired: true,
    serverSecretRequiredForAuthAdmin: true,
    responseCache: 'no-store' as const,
  }),
  rollout: Object.freeze({
    externalDeploymentRequired: true,
    clientAuthorityComposed: true,
    automaticUserManagementCutover: false,
    reason: 'The Edge Function must be deployed with server-only secrets and an exact origin allowlist before browser workflows may depend on it.',
  }),
  compatibilityBoundaries: Object.freeze([
    Object.freeze({ id: 'user-management-rpc', status: 'retained' as const, reason: 'Existing protected RPC remains authoritative for profile role/status mutation until the Edge Function is deployed and production cutover is explicitly certified.' }),
    Object.freeze({ id: 'auth-access-jwt-window', status: 'platform-limitation' as const, reason: 'Supabase access JWTs are stateless and remain valid until expiry; profiles.status plus RLS remains the immediate Work Management data-access denial authority.' }),
    Object.freeze({ id: 'module-edge-functions', status: 'deferred' as const, reason: 'TimeTracker, FuelTrack+, and TradeLink have no approved M28 server-only function use case and remain compatibility modules.' }),
  ]),
  dependencyChanges: Object.freeze({ externalRuntimeDependencyAdded: false, packageLockChangeRequired: false }),
  databaseChanges: Object.freeze({ migrationRequired: false, schemaChangeRequired: false }),
});
