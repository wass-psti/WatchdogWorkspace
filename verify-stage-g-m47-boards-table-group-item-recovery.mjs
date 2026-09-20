import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => assert.ok(fs.existsSync(p), `Missing required M47 authority: ${p}`);
let checks = 0;
const ok = (condition, message) => { assert.ok(condition, message); checks += 1; };
const has = (source, fragment, message) => ok(source.includes(fragment), message);
const notHas = (source, fragment, message) => ok(!source.includes(fragment), message);

const required = [
  'config/stage-g-m47-boards-table-group-item-recovery-target.ts',
  'config/application-manifest.ts',
  'src/types/manifest.ts',
  'src/runtime-schemas/manifest.ts',
  'RELEASE-STATUS-v1.43.2-STAGE-G-M47-BOARDS-TABLE-GROUP-ITEM-RECOVERY.md',
  'assets/js/features/boards/controllers/board-preference-controller.ts',
  'assets/js/features/boards/controllers/selection-controller.ts',
  'assets/js/features/boards/controllers/item-workflows.ts',
  'assets/js/features/boards/controllers/drag-drop-controller.ts',
  'assets/js/features/boards/selectors/board-selectors.ts',
  'assets/js/features/boards/services/board-command-service.ts',
  'assets/js/features/boards/views/board-workspace-view.ts',
  'supabase/migrations/v1.43.2-stage-g-m47-boards-table-group-item-recovery.sql',
  'supabase/tests/m47/boards_table_group_item_recovery.test.sql',
  'scripts/verify-boards-table-group-item-recovery-execution.mjs',
  'scripts/run-boards-table-group-item-recovery-browser.mjs',
  'tests/modern/e2e/boards-table-group-item-recovery.spec.mjs',
  'tests/modern/e2e/helpers/m47-boards-table-fixture.mjs',
  'verify-stage-g-m46-boards-backend-data-contract-recovery.mjs',
  'scripts/verify-stage-g-m47-production-invariants.mjs',
  'scripts/report-stage-g-m47.mjs',
  'scripts/package-stage-g-m47-certified.sh',
  'scripts/verify-stage-g-m47-certified-artifact.mjs',
  'scripts/lib/stage-g-m47-certification-tree.mjs',
  'scripts/verify-stage-g-m47-finalizer-fail-closed.mjs',
  'scripts/finalize-stage-g-m47.sh',
  'scripts/verify-stage-g-m47-deployment-provenance.mjs',
  'scripts/verify-stage-g-m47-production-deployment-guard.mjs',
  'scripts/deploy-stage-g-m47-production-recovery.sh',
  'scripts/verify-stage-g-m47-release.sh',
  'scripts/verify-stage-g-m47-candidate.sh',
  'verify-stage-g-m47-state-aware-workflows.mjs',
  '.github/workflows/boards-table-group-item-recovery.yml',
  'verify-v1230-architecture-phase2.mjs',
  'tests/browser/run-cdp.mjs',
  'tests/modern/e2e/management-authority-consolidation.spec.mjs',
  'verify-stage-g-m44-management-authority-consolidation.mjs',
  'supabase/deployments/m47/20260919165239_stage_g_m47_boards_table_group_item_recovery.sql',
  'scripts/verify-stage-g-m45-finalizer-fail-closed.mjs',
  'scripts/verify-stage-g-m46-finalizer-fail-closed.mjs',
  'supabase/tests/database/00_rls_structure.test.sql',
];
required.forEach(exists); checks += required.length;

const target = read(required[0]);
const releaseStatus = read(required[4]);
const appManifest = read(required[1]);
const manifestTypes = read(required[2]);
const manifestSchema = read(required[3]);
const prefs = read(required[5]);
const selection = read(required[6]);
const itemWorkflows = read(required[7]);
const dnd = read(required[8]);
const selectors = read(required[9]);
const commands = read(required[10]);
const tableView = read(required[11]);
const boardsUi = read('assets/js/boards-ui.ts');
const boardMenu = read('assets/js/features/boards/controllers/board-menu-controller.ts');
const migration = read(required[12]);
const dbTest = read(required[13]);
const deterministic = read(required[14]);
const browserRunner = read(required[15]);
const browserSpec = read(required[16]);
const browserFixture = read(required[17]);
const m46HistoricalVerifier = read(required[18]);
const productionVerifier = read(required[19]);
const m46Target = read('config/stage-g-m46-boards-backend-data-contract-recovery-target.ts');
const m46ReleaseStatus = read('RELEASE-STATUS-v1.43.2-STAGE-G-M46-BOARDS-BACKEND-DATA-CONTRACT-RECOVERY.md');
const schema = read('supabase/schema.sql');
const m46Contract = read('config/stage-g-m46-board-backend-contract.ts');
const m47Workflow = read('.github/workflows/boards-table-group-item-recovery.yml');
const m47WorkflowVerifier = read('verify-stage-g-m47-state-aware-workflows.mjs');
const m47Finalizer = read('scripts/finalize-stage-g-m47.sh');
const m47Deploy = read('scripts/deploy-stage-g-m47-production-recovery.sh');
const m47ArtifactVerifier = read('scripts/verify-stage-g-m47-certified-artifact.mjs');
const m47Tree = read('scripts/lib/stage-g-m47-certification-tree.mjs');
const dbRunner = read('scripts/run-stage-g-m47-database-tests.mjs');
const pkg = JSON.parse(read('package.json'));
const continuationState = read('M47-CONTINUATION-STATE.md');
const v1230Historical = read(required[33]);
const historicalBrowserIntegration = read(required[34]);
const m44Browser = read('tests/modern/e2e/management-authority-consolidation.spec.mjs');
const m44Verifier = read('verify-stage-g-m44-management-authority-consolidation.mjs');
const m47DeploymentProvenance = fs.readFileSync('supabase/deployments/m47/20260919165239_stage_g_m47_boards_table_group_item_recovery.sql');
const m47DeploymentGuard = read('scripts/verify-stage-g-m47-production-deployment-guard.mjs');
const m45FinalizerVerifier = read('scripts/verify-stage-g-m45-finalizer-fail-closed.mjs');
const m46FinalizerVerifier = read('scripts/verify-stage-g-m46-finalizer-fail-closed.mjs');
const m45Finalizer = read('scripts/finalize-stage-g-m45.sh');
const m46Finalizer = read('scripts/finalize-stage-g-m46.sh');
const databaseRlsStructure = read('supabase/tests/database/00_rls_structure.test.sql');
const m47Candidate = read('scripts/verify-stage-g-m47-candidate.sh');
exists('M47-CONTINUATION-STATE.md'); checks += 1;

has(target, "milestone: 47", 'M47 target owns milestone 47');
has(target, "architectureVersion: 55", 'M47 target advances architecture to 55');
has(target, "requiredState: 'active-certified'", 'M47 requires certified M46');
has(m46Target, "activationState: 'active-certified'", 'M47 package carries forward the certified M46 target state');
has(m46ReleaseStatus, '**State:** active-certified', 'M47 package carries forward the certified M46 release-status state');
const state = target.match(/activationState: '([^']+)'/)?.[1] ?? 'unknown';
ok(['implementation-in-progress','implementation-complete-pending-certification','active-certified'].includes(state), 'M47 target exposes a recognized fail-closed certification state');
ok(releaseStatus.includes(`**State:** ${state}`), 'M47 release-status state is synchronized with target state');
notHas(releaseStatus, 'This source remains `implementation-in-progress`', 'M47 release narrative does not contradict the pending certification state');
has(continuationState, 'Certification-Ready Checkpoint 29', 'M47 continuation handoff identifies the current checkpoint');
has(continuationState, 'Overall M47 completion at this checkpoint: 99% implementation-corrected/certification-ready', 'M47 continuation handoff reports implementation complete with certification-only work remaining');
has(continuationState, 'official four-scenario browser gate is now PASS', 'M47 continuation handoff records the governed four-scenario browser PASS');
has(releaseStatus, 'Checkpoint 29 hosted historical-regression synchronization', 'M47 release status records the post-deployment publication resume corrective');
has(continuationState, 'PASS — 269 static checks', 'M47 continuation summary reports the current static authority count');
has(continuationState, 'PASS — 50 checks', 'M47 continuation summary reports the current deterministic authority count');
has(releaseStatus, 'Current M47 static verifier: **PASS (269 checks)**', 'M47 release summary reports the current static authority count');
has(releaseStatus, 'Current dependency-free M47 deterministic verifier: **PASS (50 checks)**', 'M47 release summary reports the current deterministic authority count');
ok(!/[ \t]+$/m.test(releaseStatus), 'M47 release-status authority contains no trailing whitespace that can block atomic publication');
ok(Buffer.compare(Buffer.from(migration),m47DeploymentProvenance)===0, 'M47 packaged timestamped deployment provenance is byte-identical to the governed semantic migration');
has(m45FinalizerVerifier, 'preparePendingCertificationFixture', 'retained M45 finalizer self-test explicitly synthesizes a pending certification fixture from the active-certified historical source');
has(m45FinalizerVerifier, "replace(\"activationState: 'active-certified'\", \"activationState: 'implementation-complete-pending-certification'\")", 'retained M45 finalizer self-test rewrites only its isolated target fixture to pending');
has(m45FinalizerVerifier, "## Final certified baseline —", 'retained M45 finalizer self-test strips the historical certified-baseline marker from its isolated pending fixture');
has(m46FinalizerVerifier, 'preparePendingCertificationFixture', 'retained M46 finalizer self-test explicitly synthesizes a pending certification fixture from the active-certified historical source');
has(m46FinalizerVerifier, "replace(\"activationState: 'active-certified'\", \"activationState: 'implementation-complete-pending-certification'\")", 'retained M46 finalizer self-test rewrites only its isolated target fixture to pending');
has(m46FinalizerVerifier, "## Final certified baseline —", 'retained M46 finalizer self-test strips the historical certified-baseline marker from its isolated pending fixture');
has(m45Finalizer, "activationState:[[:space:]]*'implementation-complete-pending-certification'", 'actual M45 finalizer remains pending-only despite historical self-test synchronization');
has(m46Finalizer, "activationState:[[:space:]]*'implementation-complete-pending-certification'", 'actual M46 finalizer remains pending-only despite historical self-test synchronization');
has(databaseRlsStructure, "p.oid <> 'public.wm_board_contract_attestation()'::regprocedure", 'global Database/RLS suite permits only the governed Board contract attestation through the anon SECURITY DEFINER exception');
has(databaseRlsStructure, "'public.work_board_realtime_topic_access(text)'::regprocedure", 'global Database/RLS suite binds the hardened Board Realtime topic-access search_path exception');
has(databaseRlsStructure, "'public.work_board_realtime_broadcast_change()'::regprocedure", 'global Database/RLS suite binds the hardened Board Realtime trigger search_path exception');
has(databaseRlsStructure, "array['search_path=\"\"']", 'global Database/RLS suite requires the exact empty search_path for governed hardened Board SECURITY DEFINER functions');
has(m47Candidate, 'npm run boards-collection:finalizer:test', 'M47 candidate re-runs the retained M45 fail-closed finalizer self-test before publication');
has(m47Candidate, 'npm run board-backend-contract:finalizer:test', 'M47 candidate re-runs the retained M46 fail-closed finalizer self-test before publication');
has(m47Candidate, 'npm run database-rls:test:local', 'M47 candidate runs the global disposable Database/RLS suite before publication');
has(m47Candidate, 'npm run boards-collection:workflows', 'M47 candidate retains M45 state-aware workflow governance before publication');

has(appManifest, 'architectureVersion: 55', 'application manifest advances global architecture to 55');
has(appManifest, "boardTableGroupItemRecovery: 'transactional-table-group-item-recovery-v1'", 'application manifest registers M47 recovery authority');
has(appManifest, "boardTableGroupItemPreferencePersistence: 'board-scoped-flush-on-deactivate-v1'", 'application manifest registers M47 preference persistence authority');
has(manifestTypes, "boardTableGroupItemRecovery?: 'transactional-table-group-item-recovery-v1'", 'manifest types expose M47 architecture contract');
has(manifestSchema, "boardTableGroupItemRecovery: z.literal('transactional-table-group-item-recovery-v1').optional()", 'manifest runtime schema validates M47 architecture contract');
has(manifestSchema, 'Architecture v55+', 'manifest runtime refinement enforces M47 architecture authorities');
has(v1230Historical, "const deactivateSource = deactivateStart >= 0 && deactivateEnd > deactivateStart", 'v1.23 historical verifier scopes lifecycle assertions to the deactivate body');
has(v1230Historical, 'applicationManifest.architectureVersion >= 55', 'v1.23 historical verifier is architecture-aware for modern preference teardown');
has(v1230Historical, "deactivateSource.includes('preferencePersistence.flushPending()')", 'v1.23 historical verifier requires flush-on-deactivate for Architecture 55+');
has(v1230Historical, "deactivateSource.includes('preferencePersistence.cancel()')", 'v1.23 historical verifier preserves the legacy cancellation fallback for older architecture snapshots');
notHas(v1230Historical, "boardUi.includes('preferencePersistence.cancel()')", 'v1.23 historical verifier no longer imposes stale global cancel-on-deactivate semantics');
has(m44Browser, 'retryM39RuntimeBoundary', 'M44 retained browser authority uses the hosted runtime-boundary retry helper');
has(m44Browser, 'captureManagementAuthority', 'M44 retained browser authority captures management ownership and host identity in one retryable boundary');
has(m44Browser, 'runtime-replaced-during-authority-read', 'M44 retained browser authority rejects runtime replacement during authority capture');
has(m44Browser, 'expectedHostToken', 'M44 retained browser route probe binds the persistent host token inside the atomic readiness read');
has(m44Browser, 'management-host-token-mismatch', 'M44 retained browser route probe fails closed when the management host is actually replaced');
notHas(m44Browser, 'page.waitForFunction(', 'M44 retained browser authority no longer splits readiness from value consumption across page evaluations');
has(m44Verifier, "browser.includes('retryM39RuntimeBoundary')", 'M44 static verifier protects the hosted runtime-boundary synchronization corrective');
has(m44Verifier, "!browser.includes('page.waitForFunction(')", 'M44 static verifier rejects recurrence of split management readiness probes');
has(historicalBrowserIntegration, 'class=\"board-item-row\" draggable=\"true\" data-item-id=\"i1\"', 'historical browser fixture models item one as an actually reorderable Board row');
has(historicalBrowserIntegration, 'class=\"board-item-row\" draggable=\"true\" data-item-id=\"i2\"', 'historical browser fixture models item two as an actually reorderable Board row');
has(historicalBrowserIntegration, "root.querySelector('[data-item-id=\"i1\"]').setAttribute('draggable','false')", 'historical browser fixture exercises the M47 non-reorderable row guard');
has(historicalBrowserIntegration, 'Keyboard item reorder ignores a non-draggable Board row', 'historical browser fixture asserts keyboard suppression for non-reorderable rows');
notHas(historicalBrowserIntegration, "root.innerHTML='<span id=\"itemHandle1\" data-item-drag=\"i1\" tabindex=\"0\"></span>", 'historical browser fixture no longer uses orphan reorder handles outside Board item rows');

has(prefs, 'flushPending', 'preference controller exposes an explicit pending-write flush boundary');
has(prefs, 'readonly boardId: BoardId', 'preference debounce snapshots Board identity');
has(prefs, 'readonly preferences: BoardPreferences', 'preference debounce snapshots preference payload');
has(selectors, 'visibleTableItems', 'selectors expose rendered table order');
has(selectors, 'if (item.archived_at && !state.showArchived) return false;', 'Show archived items is additive and never hides active rows');
notHas(selectors, 'Boolean(item.archived_at) !== Boolean(state.showArchived)', 'archived visibility no longer switches the table into archived-only mode');
has(selection, 'getVisibleItems', 'selection controller consumes visible rendered item ordering');
has(selection, 'reloadBoard', 'bulk selection failure can reconcile authoritative Board state');
has(commands, 'WM_BOARD_ITEM_CREATE_ROLLBACK_FAILED', 'item create compensation reports rollback failure explicitly');
has(commands, 'await service.deleteItem(itemId)', 'item create compensation removes partial insert after enrichment failure');
has(itemWorkflows, 'moveItem', 'item edit flow coordinates cross-group movement');
has(itemWorkflows, 'groupId: item.group_id', 'item edit flow retains original group for compensation');
has(dnd, 'archived_at', 'drag/drop contains an archived-item guard');
has(tableView, 'aria-disabled="true" data-readonly-cell="true"', 'read-only cells stay keyboard focusable');
has(tableView, 'canReorder', 'table row presentation gates reorder affordances');
has(boardMenu, 'let activationScrollHost: HTMLElement | null = null;', 'board menu tracks the activation scroll host for deferred-scroll discrimination');
has(boardMenu, 'const isDeferredActivationScroll = scrollHost === activationScrollHost', 'board menu distinguishes activation-position scroll events from genuine post-open movement');
has(boardMenu, 'Math.abs(scrollHost.scrollLeft - activationScrollLeft) <= 1', 'board menu keeps duplicate deferred horizontal scroll events from closing a newly opened menu');
has(boardMenu, "activationScrollHost?.matches('.board-table-scroll')", 'board menu recognizes synchronized peer table scrolls from the activation transaction');
has(boardMenu, "scrollHost.matches('.board-table-scroll')", 'board menu limits peer-scroll tolerance to Board table scrollers');
has(boardMenu, 'isDeferredActivationScroll || isSynchronizedPeerTableScroll', 'board menu preserves an open menu across same-position peer table synchronization');
has(boardMenu, 'readonly onClose?: (() => void) | null;', 'board menu exposes a close lifecycle callback for deferred virtualization flush');
has(boardMenu, 'if (wasActive) onClose?.();', 'board menu invokes the lifecycle callback only after an active menu closes');
has(boardsUi, 'readonly tableScrollLeft?: number | null;', 'board view render options expose the intentional horizontal restoration coordinate');
has(boardsUi, 'let virtualizationRenderDeferredForMenu = false;', 'board virtualization tracks view renders deferred by an active action menu');
has(boardsUi, 'let fullBoardRenderDeferredForMenu = false;', 'board rendering tracks full data renders deferred by an active action menu');
has(boardsUi, "function renderBoardViewOnly(options: BoardViewRenderOptions = {}): void {\n    if (boardMenuController?.active) {\n      virtualizationRenderDeferredForMenu = true;\n      return;", 'all board-view-only renders defer before they can replace an active menu trigger');
has(boardsUi, "function renderBoardData(): void {\n    if (boardMenuController?.active) {\n      fullBoardRenderDeferredForMenu = true;\n      return;", 'full Board data/realtime renders defer before they can replace an active menu trigger');
has(boardsUi, 'if (boardMenuController?.active)', 'scheduled virtualization render defers instead of replacing an active menu trigger');
has(boardsUi, 'function flushDeferredBoardRender(): void', 'board menu close has one governed render-transaction flush boundary');
has(boardsUi, 'if (fullBoardRenderDeferredForMenu) {\n      fullBoardRenderDeferredForMenu = false;\n      virtualizationRenderDeferredForMenu = false;\n      renderBoardData();', 'deferred full Board data render takes precedence over a redundant virtualization-only render');
has(boardsUi, 'onClose: flushDeferredBoardRender', 'board menu close flushes the highest-priority deferred Board render');
has(boardsUi, 'let pendingGridFocus: PendingGridFocus | null = null;', 'keyboard navigation tracks a logical focus target while virtualization settles');
has(boardsUi, 'const navigationTarget = pendingGridFocus;', 'viewport-driven rerenders prioritize the in-flight logical keyboard focus target');
has(boardsUi, 'tableVirtualization.ensureRowVisible(navigationTarget.groupId, navigationTarget.rowIndex, navigationTarget.totalRows', 'virtual rerenders keep the keyboard target row materialized');
has(boardsUi, 'armPendingGridFocus({ ...navigationTarget, scrollLeft: tableScrollLeft });', 'focus preservation remains armed through the rerender settling cycle');
notHas(boardsUi, 'pendingGridFocusClearFrame', 'keyboard focus settling no longer depends on a fixed animation-frame timeout');
has(boardsUi, 'function settlePendingGridFocusIfStable(rowChanged: boolean, columnChanged: boolean): void', 'keyboard focus settling is measured against stable virtual row/column windows');
has(boardsUi, 'scheduleBoardVirtualizationSync();', 'arming logical focus schedules a governed viewport measurement');
has(boardsUi, 'if (rowChanged || columnChanged) {\n      requestVirtualizedBoardRender();\n      return;\n    }', 'changed viewport windows rerender before logical focus can settle');
has(boardsUi, 'settlePendingGridFocusIfStable(rowChanged, columnChanged);', 'stable viewport measurements evaluate the pending logical focus target');
has(boardsUi, 'if (focusLogicalGridCell(target.itemId, target.columnIndex, target.scrollLeft)) {\n      scheduleBoardVirtualizationSync();', 'stable virtual windows actively restore lost DOM focus instead of leaving a stranded pending target');
has(boardsUi, '// Stable viewport state without the target cell is inconsistent with the', 'stable focus recovery documents the rematerialization invariant');
has(boardsUi, 'requestVirtualizedBoardRender();\n  }\n\n  function focusAdjacentGridCoordinate', 'stable viewport state rematerializes the target when the logical cell is unexpectedly absent');
has(boardsUi, 'function focusAdjacentGridCoordinate(currentItemId: string, currentColumnIndex: number, key: GridNavigationKey): boolean', 'keyboard navigation can advance from a logical coordinate even while its prior DOM cell is transiently detached');
has(boardsUi, "document.addEventListener('keydown', (event: KeyboardEvent) => {", 'document capture preserves rapid grid navigation during transient virtual-DOM replacement');
has(boardsUi, 'if (focusAdjacentGridCoordinate(target.itemId, target.columnIndex, event.key)) {', 'transient keydown recovery advances from the pending logical coordinate');
has(boardsUi, 'event.stopPropagation();', 'recovered transient grid key events are consumed exactly once');
has(boardsUi, 'function captureActiveGridFocusTarget(): PendingGridFocus | null', 'generic Board rerenders capture active logical grid focus before replacing view DOM');
ok((boardsUi.match(/if \(preservedGridFocus && focusLogicalGridCell\(preservedGridFocus\.itemId, preservedGridFocus\.columnIndex, preservedGridFocus\.scrollLeft\)\)/g) ?? []).length === 2, 'both view-only and full Board renders restore captured logical grid focus');
has(boardsUi, "root.addEventListener('wheel', () => { pendingGridFocus = null; }", 'explicit wheel input releases keyboard focus authority for user-driven scrolling');
has(boardsUi, "root.addEventListener('touchstart', () => { pendingGridFocus = null; }", 'explicit touch input releases keyboard focus authority for user-driven scrolling');
ok((boardsUi.match(/pendingGridFocus = null;\n    virtualizationRenderDeferredForMenu = false;\n    fullBoardRenderDeferredForMenu = false;/g) ?? []).length === 2, 'grid/menu render transaction state has exactly two governed teardown reset boundaries');
has(boardsUi, 'renderBoardViewOnly(columnResult.changed ? { tableScrollLeft: columnResult.scrollLeft } : undefined);', 'logical column navigation forwards its intentional horizontal coordinate through rerender');
has(boardsUi, 'focusLogicalGridCell(focusTarget.itemId, focusTarget.columnIndex, focusTarget.scrollLeft);', 'logical focus restoration receives the same coordinate used to materialize the target cell');

has(migration, 'ranked_groups', 'migration normalizes existing group position drift');
has(migration, 'ranked_items', 'migration normalizes existing active-item position drift');
for (const fn of ['wm_add_board_group','wm_move_board_group','wm_delete_board_group','wm_add_board_item','wm_move_board_item','wm_duplicate_board_item','wm_delete_board_item','wm_set_board_item_archived']) {
  has(migration, `function public.${fn}`, `${fn} is governed by the M47 semantic migration`);
}
ok((migration.match(/pg_advisory_xact_lock/g) ?? []).length >= 8, 'all M47 ordering mutation RPCs use Board-scoped advisory serialization');
has(migration, "Remove item files before deleting this group", 'group deletion fails closed while attachment metadata exists');
has(migration, "Restore the item before moving it", 'archived item movement fails closed');
has(migration, 'if src.archived_at is null then', 'item delete/duplicate logic distinguishes active ordering from archived records');
has(migration, 'select count(*) into target', 'restore appends to current active group order');
has(migration, "where archived_at is null", 'active item ordering consistently excludes archived rows');
has(migration, "system_key='status'", 'item creation validates current system Status semantics');
has(migration, "coalesce((e->>'active')::boolean,true)", 'item creation falls back only to an active Status label');
notHas(migration, 'from pg_catalog.pg_proc p\n  join pg_catalog.pg_namespace n on n.oid=p.pronamespace', 'M47 attestation avoids collision with inherited PL/pgSQL catalog variable p');
has(migration, 'from pg_catalog.pg_proc m47_proc', 'M47 attestation uses a collision-safe catalog alias');

has(schema, '-- Stage G M47 — Boards Table / Group / Item Recovery', 'authoritative schema snapshot contains the M47 semantic override');
for (const fragment of [
  "Remove item files before deleting this group",
  "Restore the item before moving it",
  "pg_advisory_xact_lock(hashtextextended(bid::text,0))",
]) has(schema, fragment, `schema snapshot includes M47 invariant: ${fragment}`);

has(dbTest, 'select plan(34);', 'M47 pgTAP suite declares the governed assertion count');
has(dbRunner, 'pgTAP=34', 'M47 database runner PASS evidence matches the governed 34-assertion suite');
notHas(dbRunner, 'pgTAP=28', 'M47 database runner rejects the stale 28-assertion evidence marker');
ok((dbTest.match(/^select\s+(?:is|ok|throws_ok|lives_ok)\b/gm) ?? []).length === 34, 'M47 pgTAP suite contains exactly 34 assertions');
has(dbTest, 'The authenticated role is used only for', 'M47 pgTAP documents the authenticated-RPC / owner-inspection role boundary');
ok((dbTest.match(/^set local role authenticated;$/gm) ?? []).length === 15, 'M47 pgTAP enters authenticated role exactly for the governed RPC mutation blocks');
ok((dbTest.match(/^reset role;$/gm) ?? []).length === 15, 'M47 pgTAP returns to database-owner context after every authenticated RPC mutation block');
ok(!/grant\s+[^;]*\s+on\s+public\.work_board_(?:groups|items|boards|columns|item_files)\s+to\s+authenticated/i.test(dbTest), 'M47 pgTAP never weakens private Board-table grants for authenticated');
{
  let role = 'owner';
  const directPrivateReads = [];
  for (const [index, rawLine] of dbTest.split('\n').entries()) {
    const line = rawLine.trim();
    if (line === 'set local role authenticated;') { role = 'authenticated'; continue; }
    if (line === 'reset role;') { role = 'owner'; continue; }
    const code = line.replace(/'(?:''|[^'])*'/g, "''");
    if (role === 'authenticated' && /\b(?:from|join)\s+public\.work_board_(?:groups|items|boards|columns|item_files)\b/i.test(code)) directPrivateReads.push(index + 1);
  }
  ok(directPrivateReads.length === 0, `M47 pgTAP performs no direct private Board-table reads while authenticated${directPrivateReads.length ? ` (lines ${directPrivateReads.join(',')})` : ''}`);
}
has(dbTest, "reset role;\ninsert into m47_ids values('g1',(select id from public.work_board_groups", 'M47 pgTAP inspects the auto-created first group only after restoring owner context');
has(dbTest, "reset role;\nselect is((select status from public.work_board_items", 'M47 pgTAP inspects item postconditions only after restoring owner context');
has(dbTest, "reset role;\nselect is((select array_agg(position order by position) from public.work_board_groups", 'M47 pgTAP inspects group-delete postconditions only after restoring owner context');
has(dbTest, 'group deletion refuses to orphan private Storage objects', 'pgTAP covers attachment-safe group deletion');
has(dbTest, 'archive compacts remaining active positions', 'pgTAP covers archive compaction');
has(dbTest, 'restore appends archived item after current active items', 'pgTAP covers restore insertion');
has(dbTest, 'same-group move keeps contiguous positions', 'pgTAP covers same-group item movement');
has(dbTest, 'cross-group move compacts source positions', 'pgTAP covers cross-group movement');
has(dbTest, 'M46 governed 40-RPC contract remains compatible', 'pgTAP retains M46 contract compatibility gate');
has(dbTest, 'M47 semantic recovery attestation is compatible', 'pgTAP covers M47 production semantic attestation');
has(migration, "'m47_semantics_version','1.43.2-m47-v1'", 'M47 migration extends the existing attestation with semantic version');
has(migration, "'m47_compatible',compatible and m47_group_order_ok", 'M47 migration exposes fail-closed semantic compatibility');
has(schema, "'m47_semantics_version','1.43.2-m47-v1'", 'schema snapshot contains M47 semantic attestation');
has(productionVerifier, "payload.m47_semantics_version", 'M47 production verifier checks semantic version');
has(productionVerifier, "payload.m47_group_order_ok", 'M47 production verifier checks group ordering');
has(productionVerifier, "payload.m47_active_item_order_ok", 'M47 production verifier checks active-item ordering');
has(productionVerifier, "payload.m47_mutation_security_ok", 'M47 production verifier checks mutation security boundary');
has(productionVerifier, "payload.m47_order_indexes_ok", 'M47 production verifier checks ordering indexes');
has(productionVerifier, "payload.m47_compatible", 'M47 production verifier fails closed on semantic incompatibility');

has(deterministic, 'checks=${checks}', 'deterministic verifier reports counted checks');
has(browserRunner, 'boards-table-group-item-recovery.spec.mjs', 'M47 browser runner targets the dedicated recovery suite');
has(browserRunner, 'ensure-modern-test-toolchain.mjs', 'M47 browser runner requires governed modern test toolchain');
has(browserSpec, '@m47-group-item-crud', 'browser suite covers group/item lifecycle recovery');
has(browserSpec, '@m47-selection-visible-order', 'browser suite covers rendered-order range selection and bulk movement');
has(browserSpec, '@m47-preference-flush', 'browser suite covers immediate preference flush and reload persistence');
has(browserSpec, '@m47-virtualized-keyboard', 'browser suite covers virtualized keyboard navigation');
has(browserSpec, "toMatch(/^item-new-/)", 'browser CRUD gate waits for authoritative item identity before opening its menu');
has(browserSpec, "getByRole('button', { name:'Echo Updated', exact:true })", 'browser CRUD gate identifies the moved item-title control by exact accessible name');
notHas(browserSpec, "getByRole('button', { name:'Echo Updated', exact:false })", 'browser CRUD gate does not use an ambiguous substring locator for the moved item');
has(browserSpec, ".selection-count span", 'browser selection gate asserts numeric count independently of presentation whitespace');
has(browserSpec, "th[data-column-id=\"col-status\"]", 'browser preference gate targets the Status column header rather than cells/buttons');
has(boardsUi, 'const focusNow = (): boolean =>', 'grid navigation performs an immediate focus handoff before using a frame fallback');
has(boardsUi, 'if (focusNow()) return true;', 'grid navigation does not defer already-rendered targets and lose rapid repeated key presses');
has(browserFixture, 'wm_move_board_item', 'browser fixture models governed item movement RPC');
has(browserFixture, 'wm_set_board_item_archived', 'browser fixture models governed archive/restore RPC');
has(browserFixture, "description:''", 'browser fixture Status labels include the strict description field required by the DTO schema');
has(browserFixture, 'const groupNormalize = () => state.groups.forEach', 'browser fixture group normalization preserves explicit reordered array order');
notHas(browserFixture, 'const groupNormalize = () => state.groups.sort', 'browser fixture must not re-sort moved groups by stale position values');
has(deterministic, 'assertBoardEnvelope', 'deterministic verifier executes the strict browser-fixture DTO contract');
has(deterministic, 'installM47BoardsTableFixture', 'deterministic verifier executes the real M47 browser RPC fixture');
has(deterministic, 'm47.fixture-lifecycle.final', 'deterministic verifier covers the full fixture mutation lifecycle through production DTO mappers');
has(browserSpec, ".boards-state.error p", 'browser setup surfaces the actual Board load error when the table cannot render');
has(m46HistoricalVerifier, 'applicationArchitectureVersion>=target.architectureVersion', 'retained M46 verifier accepts later architectures while preserving M46 authority');
notHas(m46HistoricalVerifier, "Application architecture must be 54 for M46.", 'retained M46 verifier no longer freezes the whole application at architecture 54');

has(m47Workflow, 'permissions:\n  contents: read', 'M47 hosted workflow keeps read-only repository permission');
has(m47Workflow, 'npm run boards-table-recovery:verify:candidate', 'M47 hosted workflow has non-publishing candidate route');
has(m47Workflow, 'npm run boards-table-recovery:certify', 'M47 hosted workflow routes pending push through fail-closed certifier');
has(m47Workflow, 'M47_SOURCE_COMMIT: ${{ github.sha }}', 'M47 hosted certification binds exact source SHA');
has(m47Workflow, 'work-management-v1.43.2-stage-g-m47-certified-${{ github.sha }}', 'M47 hosted artifact name binds exact source SHA');
has(m47WorkflowVerifier, "['M46','.github/workflows/boards-backend-data-contract-recovery.yml'", 'M47 workflow verifier retains M46 hosted governance');
has(m47Finalizer, 'npm run boards-table-recovery:verify:release', 'M47 finalizer requires complete release gate before state promotion');
has(m47Finalizer, "activationState:[[:space:]]*'implementation-complete-pending-certification'", 'M47 finalizer requires pending source state');
has(m47Finalizer, 'M47_EXPECTED_SOURCE_COMMIT', 'M47 finalizer independently verifies exact-commit artifact');
has(m47Deploy, "M46_DEPLOYMENT_NAME='20260917142647_stage_g_m46_boards_backend_data_contract_recovery.sql'", 'M47 post-deployment resume binds the exact certified M46 remote ledger version');
has(m47Deploy, "M47_DEPLOYMENT_NAME='20260919165239_stage_g_m47_boards_table_group_item_recovery.sql'", 'M47 post-deployment resume binds the exact applied M47 remote ledger version');
has(m47Deploy, 'cmp -s "$M46_MIGRATION" "$M46_DEPLOYMENT"', 'M47 post-deployment resume verifies M46 semantic/provenance byte identity');
has(m47Deploy, 'cmp -s "$MIGRATION" "$M47_DEPLOYMENT"', 'M47 post-deployment resume verifies M47 semantic/provenance byte identity');
has(m47Deploy, 'verify-stage-g-m47-production-invariants.mjs', 'M47 post-deployment resume requires live semantic attestation');
has(m47Deploy, 'migration replay skipped', 'M47 post-deployment resume records the no-replay path');
has(m47Deploy, 'forbids migration replay', 'M47 post-deployment resume fails closed instead of replaying an already-applied migration');
notHas(m47Deploy, 'db push', 'M47 post-deployment resume cannot push the M47 migration a second time');
notHas(m47Deploy, 'migration new', 'M47 post-deployment resume cannot mint a second M47 ledger version');
notHas(m47Deploy, 'migration repair', 'M47 post-deployment resume never mutates correct production migration history');
notHas(m47Deploy, 'db reset', 'M47 post-deployment resume never destructively resets production');
notHas(m47Deploy, 'PASSWORD_ARGS=()', 'M47 post-deployment resume remains macOS Bash 3.2 safe');
has(m47DeploymentGuard, 'post-deployment-resume-only=true', 'M47 deployment guard reports resume-only governance');
has(m47DeploymentGuard, 'replay-forbidden=true', 'M47 deployment guard reports replay-forbidden governance');
has(m47ArtifactVerifier, "semanticsVersion!=='1.43.2-m47-v1'", 'M47 artifact verifier binds semantic recovery version');
has(m47Tree, "'config/stage-g-m47-boards-table-group-item-recovery-target.ts'", 'M47 certification tree isolates promoted target state');
for (const script of ['boards-table-recovery:workflows','boards-table-recovery:finalizer:test','boards-table-recovery:deployment-guard:test','boards-table-recovery:verify:candidate','boards-table-recovery:verify:release','boards-table-recovery:deploy:production','boards-table-recovery:deployment-provenance','boards-table-recovery:certify','boards-table-recovery:package','boards-table-recovery:status']) ok(Boolean(pkg.scripts?.[script]), `package.json exposes ${script}`);
has(m46Contract, '"version": "1.43.2-m46-v1"', 'M46 backend contract version remains unchanged');
notHas(migration, 'create function public.wm_', 'M47 uses CREATE OR REPLACE for existing public Board RPCs rather than adding shadow signatures');

console.log(`Stage G M47 Boards Table / Group / Item Recovery static verification: PASS (architecture=55; state=${state}; checks=${checks}; dbAssertions=34; browserScenarios=4)`);
