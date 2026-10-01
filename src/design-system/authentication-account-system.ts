export const workManagementAuthenticationAccountSystem = Object.freeze({
  milestone: 'M83',
  semanticsVersion: '1.43.2-m83-v1',
  scope: 'authentication-account-surfaces',
  surfaces: Object.freeze(['boot','login','register','recovery','disabled','verification','account']),
  ownership: Object.freeze({
    authenticationOperations: 'M12',
    accountOperations: 'M13',
    sessionAndAccessContext: 'M39',
    accountRecovery: 'M41',
    managementAuthority: 'M44',
    visualComposition: 'M83',
  }),
  invariants: Object.freeze({
    preservesAuthenticationSemantics: true,
    preservesSessionLifecycle: true,
    preservesAuthorizationSemantics: true,
    preservesSupabaseAuthority: true,
    presentationOnlySuccessor: true,
    confirmationErrorSuccessStatesExplicit: true,
    responsiveCompositionRequired: true,
  }),
});

export type WorkManagementIdentitySurface = typeof workManagementAuthenticationAccountSystem.surfaces[number];
