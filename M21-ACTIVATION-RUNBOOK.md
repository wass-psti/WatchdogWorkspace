# M21 Activation Runbook — Rich Item Workspace

Use `bash scripts/certify-stage-d-m21.sh` as the authoritative certification entrypoint.

The workflow verifies the governed Node/npm toolchain, exact lockfile install, M20 prerequisite, M21 execution/static contracts, ESLint, strict TypeScript, UI/browser regression, production build/dist/preview, complete Stage D release certification, and final `rich-item-workspace:status`.

M21 requires no Supabase migration. M20's Realtime migration remains the production prerequisite for collaborative convergence.
