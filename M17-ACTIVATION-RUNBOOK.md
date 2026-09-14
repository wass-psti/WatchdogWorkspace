# Stage D M17 — TanStack Table Evaluation Activation Runbook

## Purpose
Certify the M17 evaluation boundary without installing TanStack Table into the production dependency graph or changing the certified Board runtime.

## Governed certification
```bash
bash scripts/certify-stage-d-m17.sh
```

## Toolchain-only check
```bash
bash scripts/certify-stage-d-m17.sh --toolchain-check
```

## Focused status
```bash
npm run board-components:status
npm run tanstack-table-evaluation:check
npm run tanstack-table-evaluation:status
```

## Expected result
M16 remains `active-certified`; M17 advances from `implementation-complete-pending-certification` to `active-certified` only after the complete Stage D and production release gates pass. Runtime Architecture remains 26 because M17 is evaluation-only.
