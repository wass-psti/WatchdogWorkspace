#!/usr/bin/env bash
set -euo pipefail
npm run auth-stabilization:status
npm run route-lifecycle:activate:release
npm run route-lifecycle:check
npm run route-lifecycle:test
npm run route-lifecycle:status
echo 'Stage G M40 React/Runtime Route Ownership & Lifecycle Recovery certification: PASS'
