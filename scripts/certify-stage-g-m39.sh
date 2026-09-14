#!/usr/bin/env bash
set -euo pipefail
npm run backend-preflight:status
npm run auth-stabilization:activate:release
npm run auth-stabilization:check
npm run auth-stabilization:test
npm run auth-stabilization:status
echo 'Stage G M39 authentication/session/access-context stabilization certification: PASS'
