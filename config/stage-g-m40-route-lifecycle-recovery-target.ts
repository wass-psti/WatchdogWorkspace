export type M40ActivationState = 'implementation-complete-pending-certification' | 'active-pending-browser-certification' | 'active-certified';

export const stageGM40RouteLifecycleRecoveryTarget = Object.freeze({
  milestone: 40,
  stage: 'G',
  name: 'React/Runtime Route Ownership & Lifecycle Recovery',
  activationState: 'active-certified' as M40ActivationState,
  prerequisite: Object.freeze({ milestone: 39, requiredState: 'active-certified' as const }),
  architectureVersion: 48,
  authority: Object.freeze({
    routeController: 'assets/js/runtime/route-controller.ts',
    lifecycleRuntime: 'assets/js/runtime/route-lifecycle.ts',
    lifecycleContract: 'src/platform/contracts/route-lifecycle.ts',
    shell: 'src/app/shell/WorkManagementShell.tsx',
    managementRuntime: 'src/app/management/authenticated-management-ui-runtime.ts',
    boardRuntime: 'src/app/boards/board-presentation-facade-runtime.ts',
    modulePresentationHost: 'assets/js/runtime/module-presentation-host.ts',
    browser: 'tests/modern/e2e/route-lifecycle-recovery.spec.mjs',
  }),
  completionCriteria: Object.freeze([
    'Home, Boards, Users, Settings, Account, authentication states, and embedded applications have exactly one authoritative route presentation owner.',
    'Leaving a route deactivates its owner before the next owner activates, including Account/Settings/Users transitions that share one React management runtime.',
    'Recovery, disabled, forbidden, and redirect transitions cannot leave an embedded application host attached behind another surface.',
    'Route transitions close transient overlays, account menus, tooltips, and mobile navigation without retaining stale focus ownership.',
    'Committed route transitions focus the active route main region and stale transition generations cannot steal focus after a later navigation.',
    'Board route teardown cancels realtime, drag/drop, resize, editing, overlay, dialog, and pending-load state before another route owns presentation.',
    'Embedded-module teardown cancels load watchdogs and presentation handles so repeated app switching never creates duplicate hosts.',
    'Repeated cross-route navigation does not produce blank, stale, duplicated, hidden-but-interactive, or unresponsive active surfaces.',
  ]),
  knownBoundaries: Object.freeze([
    'M26 same-origin iframe compatibility remains for embedded applications that have not met native-retirement criteria.',
    'Boards retain the React presentation-host / imperative Board engine boundary pending M45+ functional recovery.',
    'M41-M43 remain responsible for Account, Users, and Settings feature correctness beyond route ownership/lifecycle.',
  ]),
});
