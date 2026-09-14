# Stage D M18 Activation Runbook

Use the governed certification entrypoint only after verifying the M18 RC archive and its checksum manifest.

```bash
bash scripts/certify-stage-d-m18.sh --toolchain-check
bash scripts/certify-stage-d-m18.sh
npm run board-virtualization:status
```

Certification must finish with M17 and M18 both `active-certified`, complete release verification passing, and Architecture Version 27.
