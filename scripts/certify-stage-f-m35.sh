#!/usr/bin/env bash
set -euo pipefail
npm run legacy-deletion:activate:release
npm run legacy-deletion:check
npm run legacy-deletion:test
npm run backup-dr:check
npm run backup-dr:test
npm run service-worker-update:check
npm run service-worker-update:test
npm run observability:check
npm run observability:test
npm run performance:check
npm run modern-tests:check
npm run database-rls:check
npm run edge-functions:check
npm run realtime-platform:check
echo 'Stage F M35 certification: PASS'
