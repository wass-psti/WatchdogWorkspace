export type StageCM14ActivationState =
  | 'blocked-pending-m13-certification'
  | 'implementation-complete-pending-certification'
  | 'active-pending-release-certification'
  | 'active-certified';

export const STAGE_C_M14_COMMAND_SHARED_UI_TARGET = Object.freeze({
  milestone: 'Stage C Milestone 14 — Command Palette and Shared Application UI',
  prerequisite: 'stage-c-m13:active-certified',
  reactUiAuthority: 'src/app/shared-ui/SharedApplicationUI.tsx',
  runtimeBridge: 'src/app/shared-ui/shared-application-ui-runtime.ts',
  commandRegistryAuthority: 'assets/js/features/commands/command-registry.ts',
  commandFeatureAdapter: 'assets/js/features/commands/index.ts',
  globalOverlayAuthority: 'assets/js/platform/ui/global-overlay-runtime.ts',
  overlayManagerAdapter: 'assets/js/platform/ui/overlay-manager.ts',
  toastAndUpdateAuthority: 'src/app/shared-ui/shared-application-ui-runtime.ts',
  architectureVersion: 24,
  activationState: 'active-certified' as StageCM14ActivationState,
  boundaries: Object.freeze([
    'react-owns-command-palette-global-toast-and-service-worker-update-presentation',
    'typed-command-registry-remains-command-definition-filtering-and-execution-authority',
    'imperative-command-feature-remains-a-thin-trigger-and-registry-adapter-without-dom-rendering-authority',
    'm11-global-overlay-runtime-remains-cross-feature-root-overlay-exclusivity-authority',
    'command-palette-focus-keyboard-and-result-presentation-are-react-owned',
    'global-toast-queue-and-update-banner-state-are-owned-by-the-shared-application-ui-runtime',
    'supabase-auth-rpc-rls-and-m13-management-authorities-remain-unchanged',
    'home-boards-and-other-unmigrated-route-content-remain-in-the-m10-legacy-route-content-island',
    'account-profile-menu-shell-tooltip-and-board-feature-overlays-remain-m11-imperative-compatibility-content',
    'embedded-module-runtimes-remain-same-origin-iframe-compatibility-islands',
    'no-supabase-schema-migration-is-required',
  ]),
});
