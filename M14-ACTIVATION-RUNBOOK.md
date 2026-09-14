# Stage C M14 Activation Runbook

M14 requires the certified M13 baseline and the governed Node/npm toolchain.

## Certification

```bash
bash scripts/certify-stage-c-m14.sh --toolchain-check
bash scripts/certify-stage-c-m14.sh
npm run shared-app-ui:status
```

The certification entrypoint installs the exact lockfile, validates M10–M14 architecture, runs strict TypeScript and M14 execution vectors, exercises the browser ownership contract, builds/verifies production output, and runs full Stage C release certification.

Expected final state: `active-certified`.
