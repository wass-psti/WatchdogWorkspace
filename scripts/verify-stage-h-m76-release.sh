#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run tradelink-ui:check
npm run tradelink-ui:test
npm run release:check
