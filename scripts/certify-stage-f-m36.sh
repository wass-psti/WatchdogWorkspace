#!/usr/bin/env bash
set -euo pipefail
npm run legacy-deletion:status
npm run cutover:activate:release
npm run cutover:check
npm run cutover:test
npm run cutover:artifact
npm run cutover:evidence
npm run verify:preview
npm run cutover:status
echo 'Stage F M36 production cutover certification: PASS'
