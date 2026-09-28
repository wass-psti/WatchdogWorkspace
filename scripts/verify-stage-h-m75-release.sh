#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run fueltrack-ui:check
npm run fueltrack-ui:test
npm run release:check
