# Stage F M36 — Production Cutover Certification Activation

1. Verify the M35 certified baseline SHA-256, run `shasum -a 256 -c CHECKSUMS.sha256`, and confirm M35 is `active-certified`.
2. Run `npm ci`, `npm run dependencies:ensure`, `npm run governance:check`, and `npm run security:check` under Node 22.16.0 / npm 10.9.2.
3. Run `npm run verify:historical-all`, `npm run cutover:check`, and `npm run cutover:test`.
4. Run the complete `npm run release:check`. This must execute the database/RLS, modern tests/coverage/Playwright, bounded-CDP, performance, service-worker, backup/recovery, build/dist/preview, audit, and M36 production-artifact gates.
5. Run `npm run cutover:evidence` and retain `cutover-evidence/` together with the exact production `dist/` artifact.
6. Activate/certify with `bash scripts/certify-stage-f-m36.sh`. The M36 state must roll back if any gate fails.
7. Deploy only the certified `dist/` through `.github/workflows/deploy-pages.yml`. Require the workflow's post-deploy HTTPS entrypoint and `service-worker.js` smoke checks to pass.
8. Record external operational evidence: production GitHub Pages URL, Supabase Auth Site/Redirect URL alignment, provider backup/PITR status, encrypted recovery retention, previous certified source ZIP SHA-256, and previous certified dist artifact identifier.
9. Re-run `npm run cutover:status` and archive the production workflow/run identifiers and cutover evidence.
10. Only after all source, artifact, deployment, rollback, and external operational evidence is present may M36 be formally recorded as production cutover complete.
