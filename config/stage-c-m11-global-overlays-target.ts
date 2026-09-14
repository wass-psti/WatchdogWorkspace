export type StageCM11ActivationState =
  | 'blocked-pending-m10-certification'
  | 'implementation-complete-pending-certification'
  | 'active-pending-release-certification'
  | 'active-certified';

export const STAGE_C_M11_GLOBAL_OVERLAYS_TARGET = Object.freeze({
  milestone: 'Stage C Milestone 11 — Global overlays',
  prerequisite: 'stage-c-m10:active-certified',
  reactHost: 'src/app/overlays/GlobalOverlayHost.tsx',
  runtimeAuthority: 'assets/js/platform/ui/global-overlay-runtime.ts',
  managerAdapter: 'assets/js/platform/ui/overlay-manager.ts',
  contractAuthority: 'src/platform/contracts/overlay.ts',
  architectureVersion: 21,
  activationState: 'active-certified' as StageCM11ActivationState,
  boundaries: Object.freeze([
    'react-owns-page-lifetime-global-overlay-and-toast-roots',
    'one-global-root-overlay-branch-is-authoritative-across-feature-managers',
    'command-palette-participates-in-global-overlay-lifecycle',
    'account-menus-board-popovers-and-shell-tooltips-portal-through-global-overlay-root',
    'toasts-use-react-owned-toast-root-without-secondary-body-root',
    'focus-restoration-and-click-through-suppression-remain-platform-managed',
    'newest-global-overlay-claim-wins-under-synchronous-reentrant-replacement',
    'feature-specific-overlay-content-remains-imperative-compatibility-content',
    'event-delegated-board-floating-menus-remain-route-mounted-but-share-global-lifecycle-authority',
    'embedded-module-overlays-remain-contained-inside-module-iframes',
  ]),
});
