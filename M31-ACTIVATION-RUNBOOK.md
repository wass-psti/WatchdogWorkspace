# M31 Activation Runbook
Run performance static check, microbenchmarks, production build bundle budgets, modern coverage/E2E, lint, typecheck, audit, and prerequisite regressions. The governed microbenchmark command must execute Node 22.16.0 with `--experimental-strip-types` because the runner imports authoritative `.ts` hot-path modules directly. Activation must roll back to pending on any failed release gate.

## Consolidated performance-budget corrective continuation

The production bundle gate now uses `dist/.vite/manifest.json` rather than walking every JS/CSS file as if it were initial-route code. Certification must build first, then run `npm run performance:bundle`. The verifier reports the `index.html` static-import closure, initial JS/CSS bytes, largest initial chunk, total manifest JS, largest emitted JS chunk, and whole-dist bytes.

Corrective ceilings:

- initial JS raw: 650,000 bytes
- initial CSS raw: 590,000 bytes (observed pre-corrective CSS baseline: ~566,180 bytes)
- largest initial JS chunk raw: 420,000 bytes
- total manifest JS raw: 1,800,000 bytes
- largest emitted JS chunk raw: 600,000 bytes
- total dist raw: 6,500,000 bytes

The pre-corrective ~1,246,390-byte `platform` chunk is not grandfathered. FuelTrack analytics now uses ECharts' tree-shakeable API and Vite/Rolldown uses an entry-aware analytics vendor group plus entry-aware platform splitting. If the new Mac build still exceeds 600,000 bytes for any emitted JS chunk, M31 remains incomplete and that chunk must be profiled before certification.
