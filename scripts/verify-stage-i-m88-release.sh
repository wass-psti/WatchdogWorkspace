#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M88 release requires Node v22.16.0.' >&2; exit 1; }
npm run users-admin-visual:source-guard
npm run users-admin-visual:check
npm run users-admin-visual:test
npm run users-rbac-recovery:check
npm run users-rbac-recovery:test
npm run management-authority:check
npm run management-authority:test
npm run lint:eslint
npm run typecheck
npm run build
npm run performance:bundle
npm run users-admin-visual:browser
npm run users-rbac-recovery:browser
npm run management-authority:browser
npm run release:check
echo 'STAGE I M88 USERS, ROLES & ADMINISTRATION SURFACES RELEASE VERIFICATION: PASS'
