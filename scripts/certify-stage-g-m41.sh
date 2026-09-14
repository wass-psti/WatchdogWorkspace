#!/usr/bin/env bash
set -euo pipefail
npm run route-lifecycle:status
npm run account-recovery:activate:release
npm run account-recovery:check
npm run account-recovery:test
npm run account-recovery:status
echo 'Stage G M41 Account Functional Recovery certification: PASS'
