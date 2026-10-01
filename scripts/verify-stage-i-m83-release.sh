#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M83 release requires Node v22.16.0.' >&2; exit 1; }
npm run authentication-account:source-guard
npm run authentication-account:check
npm run authentication-account:test
npm run authentication-ui:check
npm run account-settings-users:check
npm run auth-stabilization:check
npm run auth-stabilization:test
npm run account-recovery:check
npm run account-recovery:test
npm run management-authority:check
npm run management-authority:test
npm run lint:eslint
npm run typecheck
npm run build
npm run performance:bundle
npm run authentication-account:browser
npm run release:check
echo 'STAGE I M83 AUTHENTICATION & ACCOUNT SURFACES RELEASE VERIFICATION: PASS'
