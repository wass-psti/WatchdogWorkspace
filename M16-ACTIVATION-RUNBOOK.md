# Stage D M16 Activation Runbook

Use the governed fail-fast certification entrypoint:

```bash
bash scripts/certify-stage-d-m16.sh --toolchain-check
bash scripts/certify-stage-d-m16.sh
npm run board-components:status
```

Expected final state: `active-certified`, followed by `Stage D platform certification: PASS` with M15 and M16 both certified.
