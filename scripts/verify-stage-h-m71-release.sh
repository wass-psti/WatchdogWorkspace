#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run motion-continuity:check
npm run motion-continuity:test
npm run release:check
