# Stage D M20 — Board Collaborative Realtime Activation Runbook

## Prerequisite

M19 must be `active-certified`.

## Local governed certification

```bash
bash scripts/certify-stage-d-m20.sh --toolchain-check
bash scripts/certify-stage-d-m20.sh
npm run board-realtime:status
grep -F "activationState: 'active-certified'" config/stage-d-m20-board-collaborative-realtime-target.ts
```

The activation script first promotes M20 to `active-pending-release-certification`, executes the complete production release gate, and only then writes `active-certified`.

## Supabase deployment

Apply:

```text
supabase/migrations/v1.43.2-stage-d-m20-board-collaborative-realtime.sql
```

Do not enable direct Board table reads or replace the existing Board RPC/RLS boundary.

## Production collaborative smoke

Use two authenticated users with access to the same Board and verify:

1. Both sessions join the private `board:<uuid>` channel.
2. Presence indicates both sessions online.
3. A Board mutation in session A generates a database `board-change` Broadcast.
4. Session B invalidates and refetches canonical Board state and converges without reload.
5. Item updates/files refresh an already-open matching Item Workspace.
6. Disconnecting Realtime moves the UI to a degraded state and enables 30-second fallback polling.
7. Reconnection restores live state and stops fallback polling.
8. A user without Board access cannot join the private Board channel.

M20 is production-accepted only after the governed certification and this live Supabase smoke both pass.
