export const stageIM94Target = Object.freeze({
  milestone: 94,
  stage: 'I',
  baseline: Object.freeze({
    certifiedZipSha256: '6abbbb68f882c354590b041abda867dc0f9bbf06611f7b6d9435d66bfe89b63a',
    certifiedSourceSha256: '2942d8a85503e98a1d500e73c9c0a4ea71e952cccf6643d76bd84ecd09362f0f',
  }),
  activationState: 'active-certified',
  semanticsVersion: '1.43.2-m94-v1',
  requiredDomains: Object.freeze(['orchestration','route-transitions','state-transitions','reduced-motion','interaction-feedback','shell-stability','cancellation']),
  requiredAuthorities: Object.freeze([63,71,81,91,93]),
  persistentShellTransformsForbidden: true,
  disruptiveShellGeometryMotionForbidden: true,
  routeMotionBoundary: 'replaceable-content-only',
  schemaMigrationRequired: false,
  backendMutationRequired: false,
  authorizationSemanticChange: false,
  persistenceSemanticChange: false,
});
