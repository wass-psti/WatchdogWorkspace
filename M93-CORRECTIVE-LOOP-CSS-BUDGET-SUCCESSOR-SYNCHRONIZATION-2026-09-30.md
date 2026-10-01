# M93 Corrective Loop — CSS Budget Successor Synchronization

## Origin

The full local certification run on macOS passed environment preparation, repository ZIP/source identity validation, secret scanning, clean dependency materialization/certification, M93 source/static prerequisite checks, ESLint, TypeScript, and the production Vite build. The first failing required gate was `performance:bundle`.

## Failure condition

The measured M93 production build emitted `initialCssRawBytes = 622184`, exceeding the inherited M92 successor ceiling of `621000` by `1184` bytes.

## Root cause classification

Implementation/governance synchronization. M93 intentionally adds accessibility and interaction-state presentation for focus-visible, hover, active, disabled, validation, keyboard, forced-colors/contrast, and reduced-motion behavior. The M93 adaptive-budget authority document had deliberately deferred the final successor ceiling until a real production build supplied measurement evidence.

## Corrective delta

- Preserve all required M93 accessibility/interaction-state CSS without reduction.
- Record the measured M93 initial CSS value: `622184` bytes.
- Govern the M93 successor ceiling at `624000` bytes, leaving `1816` bytes of bounded headroom.
- Leave JavaScript, largest-chunk, total-manifest-JS, total-build, and benchmark budgets unchanged.
- Synchronize M31 and Stage-I historical verifiers that resolve the active successor CSS ceiling so M93 (`624000`) is preferred when the M93 authority is present.
- Extend the M93 M92-certified source guard only for the exact historical verifier files required by this successor-governance synchronization.

## Verification completed in the implementation environment

The following corrected repository-level checks pass:

- M93 M92-certified source guard.
- M93 static harmonization verifier.
- M93 deterministic interaction-state verifier.
- M31 performance engineering architecture verifier.
- M79 static and deterministic token/theme verifiers.
- M83, M84, M88, M89, M90, M91, and M92 successor-aware static/deterministic verifiers affected by CSS-budget governance.

## Exit criterion

Rerun the complete fail-closed local certification pipeline from the corrected canonical ZIP. The corrective loop exits only after the real production build reports the same M93 CSS measurement within the governed `624000` ceiling and all remaining deterministic, browser/E2E, certification, historical regression, package-hygiene, final checkpoint, and artifact-integrity gates pass.
