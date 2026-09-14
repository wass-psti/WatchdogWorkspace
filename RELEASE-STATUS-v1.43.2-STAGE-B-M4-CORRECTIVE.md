# Work Management v1.43.2 — Stage B M4 Corrective RC

## Status

**CORRECTIVE SOURCE COMPLETE — M4 runtime/provider release certification remains pending on a dependency-enabled machine.**

## Corrections implemented

1. Restored and packaged the complete repository governance tree, including `.nvmrc`, `.npmrc`, `.github/workflows/ci.yml`, `.github/workflows/codeql.yml`, `.github/workflows/dependency-review.yml`, `.github/workflows/deploy-pages.yml`, and `.github/dependabot.yml`.
2. Added a visible `governance-artifacts/` recovery bundle so hidden files/directories can be recreated after lossy extraction or wildcard-copy operations.
3. Added `npm run governance:restore` and `npm run governance:artifacts`.
4. M4 activation now auto-restores missing hidden governance artifacts before any dependency/provider mutation.
5. Corrected Stage A package-governance handling for npm 10 lockfiles that omit root `packages[""] .packageManager` metadata.
6. Corrected the same lockfile assumption in the Stage A M1 milestone verifier.
7. Deployment now explicitly executes governance, security, React M3, M4 design-system, corrective integrity, ESLint, dependency audit, and release gates before uploading `dist`.
8. Corrected all five reported ESLint `no-promise-executor-return` failures in Vite/browser/TimeTracker/production-hardening verifier utilities.
9. Added `npm run corrective:check` and made it mandatory in `check`, `release:check`, CI, deployment, and M4 activation.
10. M4 targeted activation now executes governed ESLint before provider activation.
11. `release:check` now executes governed ESLint and the high-severity npm audit itself, in addition to the existing production gates.

## Verification completed in the corrective build environment

PASS:

- required repository governance artifact verification;
- governance recovery simulation after deleting `.nvmrc`, `.npmrc`, and the complete `.github` directory;
- recovery restored all required artifacts byte-for-byte;
- Stage A M1 package governance;
- package governance with root lockfile `packageManager` present;
- package governance with root lockfile `packageManager` deliberately removed, reproducing the npm 10 behavior observed on macOS;
- high-confidence secret scan;
- Stage A M2 security baseline;
- Stage B M3 React 19.2 composition boundary;
- Stage B M4 React Design System source contract — 76 CSS token bridges;
- M4 corrective integrity gate;
- Vite architecture verification;
- production-hardening / Board compatibility / embedded-runtime verification;
- complete UI presentation, Boards M1–M8, shell M1–M8/hotfixes, and TimeTracker v2 verification;
- TypeScript architecture/runtime suite — 144 authoritative TS/TSX files, 0 project dependency cycles;
- JavaScript syntax checks for the corrected verifier/test utilities.

The activation self-healing path was also tested after deleting all reported hidden governance artifacts. It restored the artifacts successfully and proceeded to the npm registry preflight.

## Verification not claimed in this build environment

This execution environment still cannot resolve `registry.npmjs.org`, so the following cannot be certified here:

- actual Chakra/Emotion installation into this fresh corrective package;
- ESLint 10.9.1 execution against the whole repository after the five fixes;
- real Chakra/Emotion TypeScript declaration compatibility;
- M4 provider activation;
- freshly generated production Vite bundle;
- `verify:dist` / `verify:preview` / browser certification of the provider-enabled bundle.

The user's macOS environment has already demonstrated working npm connectivity, Node 22.16.0, npm 10.9.2, successful Chakra/Emotion dependency installation in the prior M4 working tree, and a zero-vulnerability audit. Those results are not embedded into this fresh lockfile; the corrective package intentionally reruns governed installation and certification instead of manufacturing dependency metadata.

## Remaining M4 work

No additional corrective source module is currently known to be incomplete.

Remaining release sequence:

1. `npm run design-system:activate` on the dependency-enabled machine;
2. confirm `active-pending-release-certification` and `Provider mounted: YES`;
3. `npm run design-system:activate:release`;
4. confirm `active-certified`.

## Compatibility boundaries

Until activation succeeds, the active runtime remains:

React 19.2 composition root → `LegacyApplicationBoundary` → existing Work Management runtime.

The M4 provider and Chakra implementation remain staged and do not alter existing Boards, shell, authentication, Supabase/RLS, TimeTracker, FuelTrack+, or TradeLink behavior.

## Workstreams beyond M4 before full platform stabilization

- M4 runtime/provider release certification must finish first.
- M5 Primitive Interaction Architecture remains a staged continuation and must not be promoted until M4 is `active-certified`.
- Later Stage B feature migration remains intentionally outside M4/M5 compatibility islands.
- The legacy imperative Work Management renderer and embedded application runtimes remain temporary migration boundaries until their dedicated conversion milestones.
- Production Supabase/hosting controls identified in Stage A M2 remain external operational dependencies and require environment-level certification.

## Production CSP dist-verifier corrective continuation

A macOS dependency-enabled M4 release certification reached a successful Vite 8.2.2 production build but `verify:dist` produced a false negative because it searched serialized HTML for the literal `script-src 'self'` substring. The verifier now decodes HTML entities and validates CSP directives semantically. Same-origin-only script execution remains strictly enforced; this is not a CSP relaxation. See `M4-PRODUCTION-CSP-DIST-HOTFIX.md`.
