# Stage D M19 — Drag-and-Drop Evaluation Activation Runbook

## Purpose
Certify the M19 dnd-kit evaluation boundary without installing dnd-kit into the production dependency graph or changing the certified Board drag/drop runtime.

## Governed certification
```bash
bash scripts/certify-stage-d-m19.sh
```

## Toolchain-only check
```bash
bash scripts/certify-stage-d-m19.sh --toolchain-check
```

## Focused status
```bash
npm run board-virtualization:status
npm run drag-drop-evaluation:check
npm run drag-drop-evaluation:status
```

## Expected result
M18 remains `active-certified`; M19 advances from `implementation-complete-pending-certification` to `active-certified` only after the complete Stage D and production release gates pass. Runtime Architecture remains 27 because M19 is evaluation-only.
