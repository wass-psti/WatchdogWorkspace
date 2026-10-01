#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"

printf '\n%s\n' '============================================================'
printf '%s\n' 'M95 LOCAL CERTIFICATION — ENVIRONMENT PREPARATION'
printf '%s\n' '============================================================'
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: Node v22.16.0 required.' >&2; exit 1; }
[ "$(npm --version)" = '10.9.2' ] || { echo 'FAIL: npm 10.9.2 required.' >&2; exit 1; }
rm -rf node_modules dist coverage test-results playwright-report .wm-modern-test-toolchain

printf '\n%s\n' '============================================================'
printf '%s\n' 'WORKSPACE / REPOSITORY VALIDATION'
printf '%s\n' '============================================================'
test -f package.json
test -f package-lock.json
test -f config/stage-i-m95-cross-module-responsive-harmonization-target.ts
npm run responsive-harmonization:source-guard

printf '\n%s\n' '============================================================'
printf '%s\n' 'DEPENDENCY INSTALLATION + INTEGRITY'
printf '%s\n' '============================================================'
npm ci
npm run dependencies:verify-lockfile
npm ls --depth=0

printf '\n%s\n' '============================================================'
printf '%s\n' 'STATIC VERIFICATION'
printf '%s\n' '============================================================'
npm run responsive-harmonization:check
npm run typecheck
npm run lint:eslint
npm run build

printf '\n%s\n' '============================================================'
printf '%s\n' 'DETERMINISTIC AUTOMATED TESTS'
printf '%s\n' '============================================================'
npm run responsive-harmonization:test

printf '\n%s\n' '============================================================'
printf '%s\n' 'BROWSER / E2E GATE'
printf '%s\n' '============================================================'
npm run responsive-harmonization:browser

printf '\n%s\n' '============================================================'
printf '%s\n' 'DEDICATED CERTIFICATION'
printf '%s\n' '============================================================'
npm run responsive-harmonization:certify

printf '\n%s\n' '============================================================'
printf '%s\n' 'POST-CERTIFICATION STATE VALIDATION'
printf '%s\n' '============================================================'
npm run responsive-harmonization:post-certification

printf '\n%s\n' '============================================================'
printf '%s\n' 'HISTORICAL REGRESSION GATE'
printf '%s\n' '============================================================'
npm run verify:historical-all
npm run release:check

printf '\n%s\n' '============================================================'
printf '%s\n' 'CHECKSUM + PACKAGE HYGIENE'
printf '%s\n' '============================================================'
npm run responsive-harmonization:package-hygiene

printf '\n%s\n' '============================================================'
printf '%s\n' 'FINAL CHECKPOINT VALIDATION'
printf '%s\n' '============================================================'
npm run responsive-harmonization:final-checkpoint

printf '\n%s\n' '============================================================'
printf '%s\n' 'PUBLISH CERTIFIED M95 BASELINE'
printf '%s\n' '============================================================'
npm run responsive-harmonization:publish-certified

printf '\n%s\n' '============================================================'
printf '%s\n' 'ALL REQUIRED M95 IMPLEMENTATION AND CERTIFICATION WORK PASSED'
printf '%s\n' '============================================================'
