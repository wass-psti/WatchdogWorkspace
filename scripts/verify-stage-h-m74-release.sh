#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run time-tracker-ui:check
npm run time-tracker-ui:test
npm run release:check
