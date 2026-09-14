# RELEASE STATUS — Stage F M33 Service worker / update strategy

**Implementation:** complete

**Activation state:** `implementation-complete-pending-certification`

**Architecture:** 41

M33 introduces deterministic build-scoped service-worker caches, explicit user-controlled activation, `updateViaCache: none`, throttled foreground/online update checks, Navigation Preload, current-cache-only reads, stale-cache cleanup, controller-change multi-tab convergence, and M32-compatible `SKIP_WAITING` activation bridging.

No npm dependency, Supabase schema, migration, or embedded application business-runtime change is required by M33.
