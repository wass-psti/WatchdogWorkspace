# M99 Implementation Report

M99 restores sidebar section dropdown persistence across React shell synchronization and prevents internal navigation/text overflow from becoming visible during sidebar resizing/transitional states.

Latest corrective delta aligns the M99 managed browser runner with the repository's canonical authenticated browser fixture contract. The runner now binds Vite to the deterministic CI runtime and M39 fixture Supabase origin/public fixture key before Playwright executes. This preserves the existing M53/M52/M39 authentication readiness path rather than weakening it.

Static verifier evidence: PASS.
Full dependency-backed local certification remains required.


## M98 successor source-guard synchronization
M99 now carries explicit successor authority over the certified M98 baseline. The historical M98→M97 guard delegates to a fail-closed M99→M98 guard only when both M99 authority artifacts are present. The new guard authorizes only the enumerated M99 delta and continues to reject unrelated source drift. Full local certification remains required before M99 can be marked fully complete.

## Candidate v6 verification evidence
The new M99→M98 source guard passes directly, the historical M98→M97 guard successfully delegates to it, the M99 sidebar corrective verifier passes, and the complete M98 deterministic production-readiness execution verifier passes under the M99 successor authority. The authorization remains narrow: four M98-baseline mutations, zero removals, and the enumerated M99 new files only.

## Corrective v7 — M96 adaptive CSS historical verifier synchronization

Stage 9 of the v6 certification passed 214/215 historical verifiers and exposed one stale M96 live-tree CSS-size comparison. M99 v7 makes the M96 verifier successor-aware without weakening its historical retirement contract: it normalizes only the exact M99 `assets/css/shell-navigation.css` byte delta derived from the M98 baseline in the M99 source-guard manifest, forbids other M99 CSS additions/removals, and still requires the original M96 certified 1,201,822-byte result below the 1,202,209-byte M95 baseline. No production CSS was removed to satisfy the historical gate.

### v7 targeted verification evidence

- M96 historical verifier: PASS with 42 live CSS files and current successor-tree CSS total 1,202,802 bytes after normalization of the exact governed M99 shell-navigation delta.
- M99→M98 source guard: PASS with 5 allowed mutations, 0 removals, and 16 allowed new files.
- M99 corrective verifier: PASS with explicit protection for the M96 adaptive-CSS successor reconciliation.
- Container historical collect-all could not be treated as authoritative because the packaging environment did not have application dependencies installed; dependency-dependent historical verifiers failed on missing packages such as `zod` and `@tanstack/react-query`. The user's full local pipeline remains the authoritative execution environment for Stage 9 and later gates.

## Final checkpoint test-toolchain lifecycle synchronization (Candidate v8)

The v7 full certification reached Stage 11 after Stages 1–10 passed. During final validation, `npm run lint` invoked the governed dependency preflight, which correctly restored the exact application lockfile tree and removed the isolated `node_modules/.wm-modern-test-toolchain` workspace as extraneous to `package-lock.json`. The subsequent final `test:m99:sidebar` invocation therefore failed because Playwright was no longer materialized.

Candidate v8 corrects only the certification harness ordering. Stage 11 now performs `verify:m99:sidebar`, `typecheck`, and `lint`, then re-runs the governed modern test-toolchain check/execution to re-materialize the isolated test-only toolchain before the final M99 Playwright gate. The application lockfile remains authoritative and unchanged; test-only packages are not added to the application dependency graph.

## Hosted post-publication corrective — 2026-10-02
Hosted M43 cold-start timing, Supabase shared migration-ledger visibility, and three workflow timeout ceilings were corrected without removing any verification gates. See `M99-CORRECTIVE-LOOP-HOSTED-POST-PUBLICATION-VALIDATION-2026-10-02.md` and `verify-v1432-m99-hosted-post-publication-corrective.mjs`.
