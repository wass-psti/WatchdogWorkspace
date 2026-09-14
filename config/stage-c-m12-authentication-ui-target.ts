export type StageCM12ActivationState =
  | 'blocked-pending-m11-certification'
  | 'implementation-complete-pending-certification'
  | 'active-pending-release-certification'
  | 'active-certified';

export const STAGE_C_M12_AUTHENTICATION_UI_TARGET = Object.freeze({
  milestone: 'Stage C Milestone 12 — Authentication UI',
  prerequisite: 'stage-c-m11:active-certified',
  reactUiAuthority: 'src/app/auth/AuthenticationUI.tsx',
  runtimeBridge: 'src/app/auth/authentication-ui-runtime.ts',
  authServiceAuthority: 'assets/js/core/auth.ts',
  routeBridge: 'assets/js/app.ts',
  architectureVersion: 22,
  activationState: 'active-certified' as StageCM12ActivationState,
  boundaries: Object.freeze([
    'react-owns-boot-login-register-verify-and-disabled-account-presentation',
    'supabase-auth-core-remains-session-token-and-profile-authority',
    'password-and-password-confirmation-values-never-enter-shared-auth-ui-runtime-state',
    'safe-display-name-and-email-drafts-may-cross-react-route-rerenders',
    'registration-resend-and-verification-cooldowns-remain-core-auth-policy',
    'verification-token-and-session-callback-processing-remain-core-auth-policy',
    'legacy-route-content-host-remains-page-lifetime-mounted-but-hidden-and-inert-on-authentication-routes',
    'm11-global-overlay-roots-remain-page-lifetime-react-siblings-on-authentication-routes',
    'authenticated-account-profile-and-user-management-screens-remain-existing-feature-compatibility-content',
    'embedded-module-authentication-remains-host-identity-bridged-without-independent-login-flows',
    'no-supabase-schema-migration-is-required',
  ]),
});
