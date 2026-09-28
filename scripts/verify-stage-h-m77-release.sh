#!/usr/bin/env bash
set -euo pipefail
cd "$(cd "$(dirname "$0")/.." && pwd)"
npm run final-ui:check
npm run final-ui:test
npm run final-ui:browser
npm run release:check
