# M26 activation runbook — Retire iframe compatibility where justified

## Prerequisite

M25 TradeLink stabilization must be `active-certified`.

## Governed commands

```bash
npm run iframe-retirement:check
npm run iframe-retirement:status
npm run iframe-retirement:activate
npm run iframe-retirement:activate:release
npm run stage-e:certify
```

## Expected Architecture 34 outcome

- hybrid module-presentation host is active;
- iframe isolation is selected per module rather than hard-coded as the only host model;
- TimeTracker, FuelTrack+, and TradeLink remain iframe compatibility islands because each still has explicit native-retirement blockers;
- no module is marked retired simply because normalized data and stabilization are complete;
- no new dependency or Supabase migration is introduced.

## Retirement rule

Do not change a module to `native-host` until its module definition has `decision: 'retire-iframe'`, `blockers: []`, a concrete `nativeBoundary`, a matching registered native adapter, and native regression parity.


## Final native-host hardening

- Future native adapters receive a module-scoped normalized-data port; they cannot select another module ID through the host service.
- Native mount failures publish the existing `module:error` lifecycle event and release presentation ownership with `module:disposed`.
