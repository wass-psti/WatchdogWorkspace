#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
printf '\n%s\n' '============================================================' 'M96 LOCAL CERTIFICATION — ENVIRONMENT PREPARATION' '============================================================'
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: Node v22.16.0 required.' >&2; exit 1; };[ "$(npm --version)" = '10.9.2' ] || { echo 'FAIL: npm 10.9.2 required.' >&2; exit 1; };rm -rf node_modules dist coverage test-results playwright-report .wm-modern-test-toolchain
printf '\n%s\n' '============================================================' 'WORKSPACE / REPOSITORY VALIDATION' '============================================================';test -f package.json;test -f package-lock.json;test -f config/stage-i-m96-visual-consistency-legacy-styling-retirement-target.ts;npm run visual-consistency:source-guard;node scripts/verify-stage-i-m95-m94-source-guard.mjs;npm run token-theme:source-guard
printf '\n%s\n' '============================================================' 'DEPENDENCY INSTALLATION + INTEGRITY' '============================================================';npm ci;npm run dependencies:verify-lockfile;npm ls --depth=0
printf '\n%s\n' '============================================================' 'STATIC VERIFICATION' '============================================================';npm run visual-consistency:check;npm run typecheck;npm run lint:eslint;npm run build
printf '\n%s\n' '============================================================' 'DETERMINISTIC AUTOMATED TESTS' '============================================================';npm run visual-consistency:test
printf '\n%s\n' '============================================================' 'BROWSER / E2E GATE' '============================================================';npm run visual-consistency:browser
printf '\n%s\n' '============================================================' 'DEDICATED CERTIFICATION' '============================================================';npm run visual-consistency:certify
printf '\n%s\n' '============================================================' 'POST-CERTIFICATION STATE VALIDATION' '============================================================';npm run visual-consistency:post-certification
printf '\n%s\n' '============================================================' 'HISTORICAL REGRESSION GATE' '============================================================';npm run verify:historical-all;npm run release:check
printf '\n%s\n' '============================================================' 'CHECKSUM + PACKAGE HYGIENE' '============================================================';npm run visual-consistency:package-hygiene
printf '\n%s\n' '============================================================' 'FINAL CHECKPOINT VALIDATION' '============================================================';npm run visual-consistency:final-checkpoint
printf '\n%s\n' '============================================================' 'PUBLISH CERTIFIED M96 BASELINE' '============================================================';npm run visual-consistency:publish-certified
printf '\n%s\n' '============================================================' 'ALL REQUIRED M96 IMPLEMENTATION AND CERTIFICATION WORK PASSED' '============================================================'
