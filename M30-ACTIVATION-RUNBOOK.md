# M30 Activation Runbook — Modern Testing Stack

Prerequisite: the M29 Database/RLS test suite must remain `active-certified` and Node/npm must resolve to v22.16.0 / 10.9.2 through the governed toolchain. The corrective M30 toolchain pins jsdom 27.4.0, whose published Node engine contract includes Node 22.16.0; the bootstrap validates that contract.

## Preflight

```bash
npm ci
npm run database-rls:check
npm run modern-tests:check
```

## Execute the modern test layer

```bash
npm run modern-tests:test
npm run modern-tests:coverage
npm run modern-tests:e2e
```

The runner may install the exact M30 test-only toolchain into `node_modules` with `--no-save --package-lock=false`. It verifies that `package.json` and `package-lock.json` remain byte-identical.

## Certification

```bash
bash scripts/certify-stage-f-m30.sh
```

The certification revalidates M29/M28/M27/M20, reruns the M29 local pgTAP suite, retains the bounded-CDP real-browser regression, validates dev/build/dist/preview behavior, and finishes through:

```bash
npm run stage-f:certify
```

M30 may be frozen only after `config/stage-f-m30-modern-testing-stack-target.ts` reports `active-certified`.
