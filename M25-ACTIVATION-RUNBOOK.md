# Stage E M25 activation runbook

Prerequisite: Stage E M24 FuelTrack+ stabilization must be `active-certified`.

1. Run `npm run tradelink-stabilization:check`.
2. Run `npm run lint:eslint` and `npm run typecheck`.
3. Run `npm run tradelink-stabilization:activate` for the active pending-release state.
4. Run `npm run tradelink-stabilization:activate:release` only through the governed release workflow.
5. Final state must be `active-certified` at Architecture Version 33.

M25 does not require a database migration or a new dependency.
