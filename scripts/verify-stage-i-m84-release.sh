#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M84 release requires Node v22.16.0.' >&2; exit 1; }
npm run boards-visual:source-guard
npm run boards-visual:check
npm run boards-visual:test
npm run boards-ui:check
npm run boards-ui:test
npm run boards-collection:check
npm run boards-collection:test
npm run boards-table-recovery:check
npm run boards-table-recovery:test
npm run boards-columns-cells-status:check
npm run boards-columns-cells-status:test
npm run boards-kanban-drag-drop:check
npm run boards-kanban-drag-drop:test
npm run boards-realtime-concurrency:check
npm run boards-realtime-concurrency:test
npm run cross-module-rbac-e2e:check
npm run cross-module-rbac-e2e:test
npm run lint:eslint
npm run typecheck
npm run build
npm run performance:bundle
npm run boards-visual:browser
npm run boards-collection:browser
npm run boards-table-recovery:browser
npm run boards-columns-cells-status:browser
npm run boards-kanban-drag-drop:browser
npm run release:check
echo 'STAGE I M84 BOARDS VISUAL MIGRATION RELEASE VERIFICATION: PASS'
