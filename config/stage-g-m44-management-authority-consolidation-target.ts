export type M44ActivationState = 'implementation-complete-pending-certification' | 'active-certified';

export const stageGM44ManagementAuthorityConsolidationTarget = Object.freeze({
  milestone: 44,
  stage: 'G',
  name: 'Management Authority Consolidation',
  activationState: 'active-certified' as M44ActivationState,
  prerequisite: Object.freeze({ milestone: 43, requiredState: 'active-certified' as const }),
  architectureVersion: 52,
  authority: Object.freeze({
    featureOwner: 'management',
    managementUi: 'src/app/management/AuthenticatedManagementUI.tsx',
    managementRuntime: 'src/app/management/authenticated-management-ui-runtime.ts',
    accountDomainService: 'assets/js/features/account/account-service.ts',
    settingsEvidence: 'assets/js/features/settings/settings-recovery.ts',
    userDirectoryAuthority: 'assets/js/core/auth.ts + TanStack Query',
    routeLifecycle: 'assets/js/runtime/route-controller.ts + assets/js/runtime/route-lifecycle.ts',
    browser: 'tests/modern/e2e/management-authority-consolidation.spec.mjs',
  }),
  retiredControllers: Object.freeze([
    'assets/js/features/account/index.ts',
    'assets/js/features/settings/index.ts',
    'assets/js/features/user-management/index.ts',
  ]),
  completionCriteria: Object.freeze([
    'Account, Settings, and Users routes declare one management feature owner and one registered runtime implementation.',
    'The obsolete imperative Account, Settings, and User Management controller implementations are absent from shipped source, public runtime exports, runtime cache manifests, and aggregate project requirements.',
    'React AuthenticatedManagementUI is the only management presentation boundary and uses one presentation-readiness owner across all three management views.',
    'Account mutation behavior remains delegated to the Account domain service and core authentication authority without reintroducing presentation-controller state.',
    'Settings behavior remains delegated to platform, backup, authentication, and bounded settings-evidence authorities without an imperative Settings controller.',
    'Users server state remains TanStack Query-backed and role/status mutations remain protected backend operations; Users authorization remains route-policy enforced.',
    'Repeated Account/Settings/Users transitions retain a single React management host and one lifecycle owner without duplicate activation/deactivation ownership.',
    'Historical verification is synchronized so M37 duplicate-management debt is explicitly resolved rather than silently deleted from the regression record.',
  ]),
  knownBoundaries: Object.freeze([
    'The account/profile dropdown remains a shell overlay authority and is not an Account route controller.',
    'The M41 Account service, M42 protected Users/RBAC backend authority, and M43 Settings evidence helper remain domain/service authorities behind the consolidated runtime; they are not competing presentation owners.',
    'M26 same-origin iframe compatibility remains for embedded modules that have not met native-retirement criteria.',
    'M54 remains responsible for final production-readiness certification.',
  ]),
});
