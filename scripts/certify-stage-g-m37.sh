#!/usr/bin/env bash
set -euo pipefail
npm run cutover:status
npm run functional-regression:activate:release
npm run functional-regression:check
npm run functional-regression:test
npm run functional-regression:evidence
npm run functional-regression:status
echo 'Stage G M37 functional regression baseline certification: PASS'
