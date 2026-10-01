export const workManagementUsersAdministrationVisualMigrationSystem = Object.freeze({
  milestone: 88,
  scope: 'users-roles-administration-surfaces',
  ownership: 'presentation-only-users-administration-successor',
  surfaces: Object.freeze([
    'users-directory',
    'global-role-policy',
    'administration-table',
    'user-access-form',
    'role-and-status-actions',
    'protected-admin-states',
    'access-denied-state',
    'role-boundary-explanation',
    'responsive-administration',
  ] as const),
  invariants: Object.freeze({
    workManagementGlobalRbacRemainsAuthoritative: true,
    m42SerializedAdminMutationRemainsAuthoritative: true,
    m44ManagementRuntimeRemainsAuthoritative: true,
    bootstrapAdminProtectionPreserved: true,
    lastAdminProtectionPreserved: true,
    selfDisableProtectionPreserved: true,
    protectedSupabaseRpcAuthorityPreserved: true,
    platformRolesRemainAdminGeneralManagerHrSupervisorEmployee: true,
    timeTrackerRoleModelRemainsApplicationScoped: true,
    fuelTrackRoleModelRemainsApplicationScoped: true,
    tradeLinkDocumentWorkflowAuthorityUnaffected: true,
    noApplicationRoleFlatteningIntoGlobalRbac: true,
    noSchemaMigrationRequired: true,
    noBackendMutationRequired: true,
  }),
});

export type WorkManagementM88AdministrationSurface = typeof workManagementUsersAdministrationVisualMigrationSystem.surfaces[number];
