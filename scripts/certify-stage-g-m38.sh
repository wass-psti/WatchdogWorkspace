#!/usr/bin/env bash
set -euo pipefail
npm run functional-regression:status
npm run backend-preflight:activate:release
npm run backend-preflight:check
npm run backend-preflight:test
npm run backend-preflight:status
echo 'Stage G M38 runtime configuration/backend capability preflight certification: PASS'
