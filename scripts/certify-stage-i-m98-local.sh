#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
printf '\n%s\n' '============================================================' 'M98 LOCAL CERTIFICATION — ENVIRONMENT PREPARATION' '============================================================'
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: Node v22.16.0 required.' >&2; exit 1; }
[ "$(npm --version)" = '10.9.2' ] || { echo 'FAIL: npm 10.9.2 required.' >&2; exit 1; }
rm -rf node_modules dist coverage test-results playwright-report .wm-modern-test-toolchain m97-browser-evidence m98-browser-evidence
printf '\n%s\n' '============================================================' 'WORKSPACE / REPOSITORY VALIDATION' '============================================================'
test -f package.json; test -f package-lock.json; test -f config/stage-i-m98-futuristic-minimalist-production-readiness-certification-target.ts
npm run futuristic-readiness:source-guard
npm run workspace-regression:source-guard
npm run token-theme:source-guard
printf '\n%s\n' '============================================================' 'DEPENDENCY INSTALLATION + INTEGRITY' '============================================================'
npm ci
npm run dependencies:verify-lockfile
npm ls --depth=0
printf '\n%s\n' '============================================================' 'STATIC VERIFICATION' '============================================================'
npm run futuristic-readiness:check
npm run typecheck
npm run lint:eslint
npm run build
printf '\n%s\n' '============================================================' 'DETERMINISTIC AUTOMATED TESTS' '============================================================'
npm run futuristic-readiness:test
printf '\n%s\n' '============================================================' 'BROWSER / E2E + SCREENSHOT EVIDENCE GATE' '============================================================'
npm run futuristic-readiness:browser
npm run futuristic-readiness:evidence
printf '\n%s\n' '============================================================' 'DEDICATED CERTIFICATION' '============================================================'
npm run futuristic-readiness:certify
printf '\n%s\n' '============================================================' 'POST-CERTIFICATION STATE VALIDATION' '============================================================'
npm run futuristic-readiness:post-certification
printf '\n%s\n' '============================================================' 'HISTORICAL REGRESSION GATE' '============================================================'
npm run verify:historical-all
npm run release:check
printf '\n%s\n' '============================================================' 'CHECKSUM + PACKAGE HYGIENE' '============================================================'
npm run futuristic-readiness:package-hygiene
printf '\n%s\n' '============================================================' 'FINAL CHECKPOINT VALIDATION' '============================================================'
npm run futuristic-readiness:final-checkpoint
printf '\n%s\n' '============================================================' 'PUBLISH CERTIFIED M98 BASELINE' '============================================================'
npm run futuristic-readiness:publish-certified
printf '\n%s\n' '============================================================' 'ALL REQUIRED M98 IMPLEMENTATION AND CERTIFICATION WORK PASSED' '============================================================'
