# M99 Corrective Loop — M96 Adaptive CSS Successor Synchronization — 2026-10-01

## Origin

The M99 v6 full certification reached Stage 9 and executed all 215 historical verifiers. Exactly one verifier failed: `verify-stage-i-m96-visual-consistency-legacy-styling-retirement.mjs` compared the live successor-tree CSS byte total directly to the M95-era retirement ceiling.

## Root cause

M96 correctly certified retirement of five one-off CSS layers at 42 live CSS files and 1,201,822 source bytes, below the M95 baseline of 1,202,209 bytes. The historical verifier later re-counted the current repository after the governed M99 `assets/css/shell-navigation.css` corrective. That conflated historical M96 retirement evidence with legitimate successor CSS growth.

## Corrective delta

The M96 verifier now remains strict for a pure M96 tree. When the governed M99→M98 source-guard manifest is present, it:

- requires exactly one M99 CSS mutation: `assets/css/shell-navigation.css`;
- forbids M99 CSS additions and removals;
- derives the exact shell-navigation byte delta from the M98 baseline entry in the M99 source-guard manifest;
- subtracts only that authorized successor delta from the current live CSS total;
- requires the successor-normalized total to equal the documented M96 certified measurement of 1,201,822 bytes and remain below the M95 baseline of 1,202,209 bytes;
- preserves all existing M96 retirement, marker-removal, no-`transition: all`, and source-guard assertions.

No production CSS was removed or reduced to satisfy the historical check. The adaptive governed CSS policy remains authoritative for successor work.

## Exit criterion

The corrective loop exits only after the complete M99 Stage 1–11 fail-closed certification pipeline passes, including all historical verifiers, package/checksum hygiene, and final checkpoint validation.
