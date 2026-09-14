#!/usr/bin/env bash
set -euo pipefail
npm run observability:activate:release
npm run observability:check
npm run observability:test
npm run performance:check
npm run database-rls:check
npm run edge-functions:check
npm run realtime-platform:check
npm run modern-tests:check
echo 'Stage F M32 certification: PASS'
