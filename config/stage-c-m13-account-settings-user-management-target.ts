export type StageCM13ActivationState =
  | 'blocked-pending-m12-certification'
  | 'implementation-complete-pending-certification'
  | 'active-pending-release-certification'
  | 'active-certified';

export const STAGE_C_M13_ACCOUNT_SETTINGS_USER_MANAGEMENT_TARGET = Object.freeze({
  milestone: 'Stage C Milestone 13 — Account / Settings / User Management',
  prerequisite: 'stage-c-m12:active-certified',
  reactUiAuthority: 'src/app/management/AuthenticatedManagementUI.tsx',
  runtimeBridge: 'src/app/management/authenticated-management-ui-runtime.ts',
  authServiceAuthority: 'assets/js/core/auth.ts',
  preferencesAuthority: 'assets/js/core/platform.ts',
  backupAuthority: 'assets/js/core/backup.ts',
  userDirectoryServerState: '@tanstack/react-query@5.102.8',
  userDirectoryMutationAuthority: 'assets/js/core/auth.ts protected Supabase RPC',
  routeBridge: 'assets/js/app.ts',
  architectureVersion: 23,
  activationState: 'active-certified' as StageCM13ActivationState,
  boundaries: Object.freeze([
    'react-owns-account-settings-and-user-management-route-presentation',
    'supabase-auth-core-remains-session-profile-password-and-role-mutation-authority',
    'password-and-password-confirmation-values-remain-form-local-and-never-enter-shared-management-runtime-state',
    'tanstack-query-remains-user-directory-server-state-authority',
    'browser-local-platform-preferences-remain-owned-by-core-platform-services',
    'workspace-backup-validation-and-restore-remain-owned-by-core-backup-services',
    'protected-user-directory-and-role-status-mutations-remain-supabase-rpc-and-rls-authoritative',
    'legacy-account-settings-user-management-controller-files-remain-inert-compatibility-artifacts-without-active-route-wiring',
    'm11-global-account-profile-menu-remains-imperative-overlay-compatibility-content',
    'home-boards-and-other-unmigrated-route-content-remain-in-the-m10-legacy-route-content-island',
    'embedded-module-runtimes-remain-same-origin-iframe-compatibility-islands',
    'no-supabase-schema-migration-is-required',
  ]),
});
