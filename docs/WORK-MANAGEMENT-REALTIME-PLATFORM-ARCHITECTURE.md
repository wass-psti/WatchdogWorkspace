# Work Management — Realtime Platform Architecture

Stage F Milestone 27 promotes realtime from a Board-specific transport concern into a Work Management platform service.

## Authority

The architecture is split into three layers:

1. `assets/js/platform/data/supabase-realtime-client.ts` remains the low-level Supabase private-channel transport.
2. `assets/js/platform/realtime/realtime-platform.ts` owns authenticated channel acquisition, topic policy, shared token refresh, reference counting, health snapshots, and disposal.
3. Feature adapters such as `assets/js/features/boards/services/board-realtime-service.ts` translate platform events into domain-specific contracts.

`assets/js/runtime/platform-services.ts` constructs the realtime platform once and supplies it to feature services.

## Production invariants

- Private authenticated channels only.
- Features cannot choose arbitrary raw topic strings through the platform contract.
- Board topics require canonical UUID identifiers.
- Same-topic subscribers share one platform channel record and release it only after the final subscription disposes.
- Access-token refresh is platform-owned rather than timer-per-feature.
- The number of simultaneously active platform channels is bounded.
- Supabase transport construction is lazy so an unconfigured application does not fail during platform composition before realtime is used.
- Board authoritative state remains RPC/RLS-owned; realtime signals trigger synchronization rather than becoming a second source of truth.

## M27 active server namespace

Only the `board` namespace is production-enabled in M27 because its private-channel RLS and database-trigger broadcast authority were already certified in Stage D M20.

`module` and `platform` namespaces are reserved by the type/topic contract but deliberately disabled until a future milestone introduces explicit server authorization and authoritative event producers for those namespaces.

## Compatibility boundaries

TimeTracker, FuelTrack+, and TradeLink remain iframe compatibility islands after M26. M27 does not inject the new platform realtime service into those full-document runtimes and does not create speculative server topics for them. Their future realtime migration must preserve module RBAC, normalized-data ownership, and lifecycle isolation.

## Database impact

M27 requires no Supabase migration. It reuses the certified M20 Board realtime policies/triggers and changes client-side ownership only.
