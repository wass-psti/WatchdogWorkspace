#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
npm run dependencies:ensure
npm run lint:eslint
npm run typecheck
npm run recovery-quality:check
npm run recovery-quality:test
npm run cross-module-rbac-e2e:check
npm run auth-stabilization:check
npm run settings-recovery:check
npm run boards-realtime-concurrency:check
npm run cross-module-rbac-e2e:browser
npm run recovery-quality:browser
npm run build
npm run verify:dist
npm run verify:preview
echo 'Stage G M53 candidate verification: PASS'
