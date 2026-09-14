#!/usr/bin/env bash
set -euo pipefail
npm run performance:activate:release
npm run performance:check
npm run database-rls:check
npm run edge-functions:check
npm run realtime-platform:check
npm run modern-tests:check
echo 'Stage F M31 certification: PASS'
