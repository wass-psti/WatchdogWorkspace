#!/usr/bin/env bash
set -euo pipefail
npm run service-worker-update:activate:release
npm run service-worker-update:check
npm run service-worker-update:test
npm run observability:check
npm run observability:test
npm run performance:check
npm run modern-tests:check
npm run database-rls:check
npm run edge-functions:check
npm run realtime-platform:check
echo 'Stage F M33 certification: PASS'
