# Stage B M9 Activation Runbook — Client-state Ownership Model

Prerequisite: Stage B M8 must be `active-certified`.

1. `npm run client-state:check`
2. `npm run client-state:activate:release`
3. `npm run client-state:status`
4. `npm run stage-b:certify`

The release workflow first validates the scoped Zustand ownership contract, then promotes M9 to `active-pending-release-certification`, revalidates TypeScript, executes the complete production release gate, and finally records `active-certified`.

M9 requires no Supabase schema migration.
