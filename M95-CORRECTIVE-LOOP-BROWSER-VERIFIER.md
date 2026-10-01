# M95 Corrective Loop — Browser Verifier

**Classification:** CORRECTIVE LOOP  
**Origin:** Browser/E2E gate  
**Failed checkpoint:** `npm run responsive-harmonization:browser`  
**Failure result:** 12 passed / 4 failed.

## Exact failure condition
All four failures were the host surface at mobile, tablet, laptop, and wide viewports. The failed assertion required `document.styleSheets[].href` to contain `cross-module-responsive-harmonization`. The three embedded application surfaces passed the same gate.

## Root-cause classification
**Verification implementation.** The host loads M95 CSS through the `src/main.ts` Vite CSS import pipeline. Vite does not guarantee that the original source filename is retained in `document.styleSheets[].href` during dev/runtime injection. Embedded application HTML loads the stylesheet directly through `<link>`, which is why those twelve cases passed.

## Corrective delta
The Playwright audit now verifies the loaded M95 runtime contract through computed `:root` custom properties:
- `--wm-m95-breakpoint-narrow: 40rem`
- `--wm-m95-breakpoint-tablet: 52.5rem`
- `--wm-m95-breakpoint-laptop: 70rem`
- `--wm-m95-breakpoint-wide: 90rem`

Page-width overflow validation remains unchanged.

## New forward-progress evidence
The local certification attempt already passed dependency installation/integrity, typecheck, ESLint, production build, and deterministic M95 verification before reaching browser/E2E. The browser run additionally showed 12/16 cases passing; only the host filename-provenance assertion failed.

## Exit criterion
Rerun the complete fail-closed certification pipeline from the corrected continuation artifact. The loop exits only if the corrected 16-case browser audit and every downstream certification, historical-regression, package-hygiene, final-checkpoint, and artifact-integrity gate pass.
