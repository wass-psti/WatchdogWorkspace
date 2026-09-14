# M33 Activation Runbook — Service worker / update strategy

Prerequisite: M32 must be `active-certified`, Node must be `22.16.0`, and npm must be `10.9.2`.

1. Run `npm run service-worker-update:check`.
2. Run `npm run service-worker-update:test`.
3. Build production output and run `npm run service-worker-update:dist`.
4. Re-run M32 observability and M31 performance authorities.
5. Execute the full release gate.
6. Run `npm run service-worker-update:activate:release`.
7. Confirm `config/stage-f-m33-service-worker-update-strategy-target.ts` is `active-certified`.

Activation is transactional. Any failed release command restores the previous M33 activation state.
