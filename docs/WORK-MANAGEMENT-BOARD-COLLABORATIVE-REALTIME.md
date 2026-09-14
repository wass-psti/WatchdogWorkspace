# Work Management — Stage D Milestone 20 Board Collaborative Realtime

## Scope

M20 adds Board-scoped collaborative synchronization while preserving the certified Board repository/RPC authority, M18 virtualization, and M19 drag/drop behavior.

## Architecture

Architecture Version 28 introduces a private Supabase Realtime boundary:

- transport: `assets/js/platform/data/supabase-realtime-client.ts`
- Board service: `assets/js/features/boards/services/board-realtime-service.ts`
- Board controller: `assets/js/features/boards/controllers/board-realtime-controller.ts`
- database migration: `supabase/migrations/v1.43.2-stage-d-m20-board-collaborative-realtime.sql`

Channels use `board:<uuid>`, are private, and subscribe to database-originated `board-change` Broadcast messages plus Presence. This is the M20 private Broadcast collaboration path; canonical convergence remains an authorized RPC refetch.

## Canonical state and security

Realtime is an invalidation signal, not a second Board state store. Broadcast payloads contain mutation metadata only. After a valid signal, the Board controller invalidates TanStack Query-backed Board state and performs an authorized RPC refetch through the existing typed Board repository. Item Workspace data is refreshed through its existing RPC path when relevant updates/files change.

Board tables remain denied to direct authenticated client reads. M20 does not use direct Postgres Changes. Realtime Authorization is enforced with RLS policies on `realtime.messages`, whose topic access delegates to the existing `public.work_board_access(...)` Board authorization function.

Authenticated browsers can receive Broadcast and Presence and can write Presence only. They are intentionally not granted Broadcast insertion authority; authoritative `board-change` messages are emitted by database triggers using `realtime.send(...)`.

## Reliability

- heartbeat: 20 seconds
- reconnect backoff: 1s, 2s, 5s, 10s capped
- JWT refresh: 4 minutes using the Realtime `access_token` event
- remote change coalescing: 100ms
- interaction safety: authoritative remote refetch is deferred in 250ms checks while an explicit inline editor or Board drag operation is active; the queued change batch is retained and converges when the interaction ends
- degraded fallback: authoritative Board polling every 30 seconds while Realtime is reconnecting/offline/error
- route lifecycle: channel, timers, pending change batches, and fallback polling are disposed when Board ownership changes

## Presence

Presence is ephemeral collaboration state only. It is not persisted into Board domain records. The Board header exposes an accessible live/syncing/reconnecting/offline state and online collaborator count.

## Compatibility boundaries

The React Board presentation facade remains the route-level owner while `assets/js/boards-ui.ts` remains the typed compatibility Board engine. M20 injects Realtime at the feature/composition boundary; virtualization, drag/drop, history, selection, inline editing, and server persistence retain their existing authorities.

## Supabase deployment requirement

M20 requires applying `supabase/migrations/v1.43.2-stage-d-m20-board-collaborative-realtime.sql` to the production Supabase project before production collaborative Realtime can be accepted.

## Acceptance

M20 can be release-certified only after the governed M20 verifier, strict TypeScript/ESLint gates, browser regression suite, production build/dist/preview verification, aggregate historical verifier suite, and complete Stage D certification all pass. Production acceptance additionally requires a two-session live Supabase smoke test proving Broadcast convergence, Presence, reconnect, and authorization behavior.
