# Stage D M15 Activation Runbook

Use the governed fail-fast certification entrypoint:

```bash
bash scripts/certify-stage-d-m15.sh --toolchain-check
bash scripts/certify-stage-d-m15.sh
npm run board-presentation:status
```

Expected final state: `active-certified`, followed by `Stage D platform certification: PASS`.
