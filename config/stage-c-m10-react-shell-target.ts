export type StageCM10ActivationState =
  | 'blocked-pending-m9-certification'
  | 'implementation-complete-pending-certification'
  | 'active-pending-release-certification'
  | 'active-certified';

export const STAGE_C_M10_REACT_SHELL_TARGET = Object.freeze({
  milestone: 'Stage C Milestone 10 — React shell',
  prerequisite: 'stage-b-m9:active-certified',
  shellAuthority: 'src/app/shell/WorkManagementShell.tsx',
  runtimeBridge: 'src/app/shell/shell-runtime-bridge.ts',
  reactBridge: 'src/app/shell/useReactShellRuntime.ts',
  routeContentBoundary: 'src/app/composition/RuntimeApplicationBoundary.tsx',
  routeContentRuntime: 'assets/js/app.ts',
  architectureVersion: 20,
  activationState: 'active-certified' as StageCM10ActivationState,
  boundaries: Object.freeze([
    'react-owns-persistent-shell-frame',
    'react-owns-sidebar-structure-and-workspace-host',
    'zustand-remains-shared-client-state-authority',
    'tanstack-query-remains-server-state-authority',
    'supabase-auth-remains-session-authority',
    'runtime-route-content-is-page-lifetime-stable-island',
    'runtime-content-host-does-not-create-persistent-shell',
    'dynamic-resource-navigation-markup-temporarily-bridged',
    'embedded-modules-remain-isolated-same-origin-runtimes',
  ]),
});
