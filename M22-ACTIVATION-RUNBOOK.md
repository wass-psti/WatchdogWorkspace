# M22 Activation Runbook

Run `scripts/certify-stage-e-m22.sh`. It revalidates M21/Stage D, M22, lint, TypeScript, browser contracts, build/dist/preview and the full release gate, then promotes M22 only after every gate passes. Final status: `npm run normalized-module-data:status`.
