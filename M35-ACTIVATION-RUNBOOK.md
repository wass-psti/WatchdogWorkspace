# M35 Activation Runbook

1. Verify M34 is `active-certified`, M35 is `implementation-complete-pending-certification`, Architecture is 43, the RC SHA matches the release candidate authority, and every `CHECKSUMS.sha256` entry passes.
2. Verify the three M35 historical-verifier synchronization authorities before the expensive release chain: M24/M31 tree-shaken ECharts, React-owned Shell presentation, and M34 guarded Settings/backup restore wiring.
3. Run `node --experimental-strip-types --disable-warning=ExperimentalWarning verify-settings.mjs`, then `npm run legacy-deletion:check`, `npm run legacy-deletion:test`, `npm run fueltrack-stabilization:check`, and `npm run verify:ui`.
4. Run the complete `npm run check` historical regression and do not activate M35 unless it reaches the literal terminal authority `Work Management project verification: PASS` without an earlier verifier failure.
5. Run retained Stage F, production build/dist, modern tests/coverage/Playwright, M29 pgTAP, bounded-CDP, dev/preview, governance, security, audit, performance, service-worker, and provenance gates.
6. Activate with `bash scripts/certify-stage-f-m35.sh`; activation is transactional and the M35 target must roll back to `implementation-complete-pending-certification` if any downstream certification gate fails.
7. After activation, re-run M35, Shell/UI, M34/M33/M32, M24, production dist/preview, and provenance authorities.
8. Freeze a clean certified source tree only after `active-certified` is observed, regenerate source checksums from that tree, verify them, package the certified ZIP, run `unzip -t`, and record the final SHA-256.

Historical-verifier synchronization is verifier-only. It must never restore M35-deleted production code or weaken M31/M34/M35 runtime authorities merely to satisfy an old source-string assertion.


## Corrective-4 certification harness hardening
M35 now requires `npm run verify:historical-all` before fail-fast release certification. This collect-all preflight executes every root historical verifier and reports all failures together. `verify-settings.mjs` also supplies a complete event-dispatch browser stub and verifies the M34 `wm:backup-dr` import-preflight event. See `M35-CERTIFICATION-HARNESS-COLLECT-ALL-HOTFIX.md`.
