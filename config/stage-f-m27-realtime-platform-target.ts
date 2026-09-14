export type M27ActivationState =
  | 'implementation-complete-pending-certification'
  | 'active-pending-release-certification'
  | 'active-certified';

export const stageFM27RealtimePlatformTarget = Object.freeze({
  milestone: 27,
  name: 'Realtime platform architecture',
  activationState: 'active-certified' as M27ActivationState,
  prerequisite: Object.freeze({ milestone: 26, requiredState: 'active-certified' }),
  architectureVersion: 35,
  authority: Object.freeze({
    contract: 'src/platform/contracts/realtime-platform.ts',
    runtime: 'assets/js/platform/realtime/realtime-platform.ts',
    transport: 'assets/js/platform/data/supabase-realtime-client.ts',
    composition: 'assets/js/runtime/platform-services.ts',
    model: 'authenticated-private-channel-platform-v1',
  }),
  lifecyclePolicy: Object.freeze({
    authenticatedPrivateChannelsOnly: true,
    centralizedAccessTokenRefresh: true,
    oneRefreshTimerPerPlatform: true,
    referenceCountSharedTopics: true,
    boundedActiveChannels: true,
    defaultActiveChannelLimit: 24,
    lazyTransportCreation: true,
    releaseUnusedChannels: true,
    disposeAllOnPlatformDispose: true,
  }),
  topicPolicy: Object.freeze({
    activeNamespaces: Object.freeze(['board'] as const),
    reservedNamespaces: Object.freeze(['module', 'platform'] as const),
    boardTopicRequiresUuid: true,
    moduleTopicsRequireFutureServerAuthorization: true,
    platformTopicsRequireFutureServerAuthorization: true,
    arbitraryRawTopicsAllowed: false,
  }),
  migratedConsumers: Object.freeze([
    Object.freeze({
      id: 'boards',
      adapter: 'assets/js/features/boards/services/board-realtime-service.ts',
      transportOwnership: 'platform-owned',
      serverAuthority: 'supabase/migrations/v1.43.2-stage-d-m20-board-collaborative-realtime.sql',
    }),
  ]),
  compatibilityBoundaries: Object.freeze([
    Object.freeze({ moduleId: 'time-tracker', realtimeMode: 'embedded-module-local', reason: 'iframe compatibility boundary; no module realtime server topic authorized yet' }),
    Object.freeze({ moduleId: 'fueltrack-plus', realtimeMode: 'embedded-module-local', reason: 'iframe compatibility boundary; no module realtime server topic authorized yet' }),
    Object.freeze({ moduleId: 'tradelink', realtimeMode: 'embedded-module-local', reason: 'iframe compatibility boundary; no module realtime server topic authorized yet' }),
  ]),
  outcome: Object.freeze({
    boardRealtimeSemanticsPreserved: true,
    boardFeatureNoLongerOwnsRealtimeTransport: true,
    platformRealtimeAvailableThroughServiceComposition: true,
    duplicateSameTopicSubscriptionsShareChannel: true,
    sharedAccessTokenRefreshAcrossChannels: true,
    moduleRealtimeActivationDeferred: true,
  }),
  newExternalDependency: null,
  supabaseMigrationRequired: false,
});
