# Work Management v1.43.2 — Stage D M20 Board Collaborative Realtime

**Implementation state:** implementation-complete-pending-certification  
**Architecture Version:** 28  
**Prerequisite:** M19 active-certified

## Implemented

- private Board Realtime topics: `board:<uuid>`
- database-originated metadata-only `board-change` Broadcast
- authenticated Presence
- dedicated native Supabase Realtime transport
- in-band JWT refresh and reconnect backoff
- Board-scoped remote-change coalescing
- interaction-safe remote convergence that defers refetch during active inline editing/drag operations
- TanStack Query invalidation plus authoritative Board RPC refetch
- Item Workspace refresh for relevant collaborative changes
- degraded 30-second fallback polling
- deterministic route disposal
- accessible Board live-status indicator
- Supabase Realtime Authorization policies and Board mutation triggers

## Preserved boundaries

M18 virtualization and M19 drag/drop remain authoritative. Direct Postgres Changes are not enabled, no external Realtime dependency is installed, and canonical Board data remains RPC/repository-owned.

## Pending certification

The target must not be promoted to `active-certified` until `scripts/certify-stage-d-m20.sh` completes successfully and the production Supabase migration/live two-session smoke test is accepted.


## M12 dev-browser CDP corrective boundary

During M20 release certification, the historical M12 Vite browser smoke exposed an unbounded Chromium `--dump-dom` lifecycle. M20 now carries a verifier-only corrective boundary: `scripts/lib/browser-cdp-smoke.mjs` drives Chromium through the DevTools Protocol, waits for explicit DOM readiness under a real wall-clock deadline, kills a wedged browser deterministically, isolates browser profile state, and forces deterministic anonymous public-client configuration for the dev login contract. Production authentication behavior is unchanged.
