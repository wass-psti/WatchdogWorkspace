import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (p) => fs.readFileSync(p, 'utf8');
let checks = 0;
const ok = (condition, message) => { assert.ok(condition, message); checks += 1; };
const has = (source, fragment, message) => ok(source.includes(fragment), message);
const notHas = (source, fragment, message) => ok(!source.includes(fragment), message);
const exists = (p) => { ok(fs.existsSync(p), `Missing required M48 authority: ${p}`); };

const required = [
  'config/stage-g-m48-boards-columns-cells-status-recovery-target.ts',
  'config/application-manifest.ts',
  'src/types/manifest.ts',
  'src/runtime-schemas/manifest.ts',
  'RELEASE-STATUS-v1.43.2-STAGE-G-M48-BOARDS-COLUMNS-CELLS-STATUS-SYSTEM-RECOVERY.md',
  'M48-CONTINUATION-STATE.md',
  'assets/js/boards-ui.ts',
  'assets/js/features/boards/views/board-workspace-view.ts',
  'assets/js/features/boards/views/table-view.ts',
  'assets/js/features/boards/controllers/column-resize-controller.ts',
  'assets/js/features/boards/controllers/column-workflows.ts',
  'assets/js/features/boards/controllers/inline-edit-controller.ts',
  'assets/js/features/boards/selectors/board-selectors.ts',
  'assets/js/features/boards/services/status-label-editor.ts',
  'assets/js/features/boards/grid/column-type-registry.ts',
  'assets/js/features/boards/data/board-repository.ts',
  'assets/js/features/boards/services/board-command-service.ts',
  'tests/modern/e2e/helpers/m48-boards-columns-fixture.mjs',
  'tests/modern/e2e/boards-columns-cells-status-recovery.spec.mjs',
  'scripts/run-boards-columns-cells-status-recovery-browser.mjs',
  'scripts/verify-boards-columns-cells-status-recovery-execution.mjs',
  'scripts/verify-stage-g-m48-production-boundary.mjs',
  'verify-stage-g-m48-state-aware-workflows.mjs',
  'scripts/verify-stage-g-m48-candidate.sh',
  'scripts/verify-stage-g-m48-release.sh',
  'scripts/finalize-stage-g-m48.sh',
  'scripts/package-stage-g-m48-certified.sh',
  'scripts/verify-stage-g-m48-certified-artifact.mjs',
  'scripts/lib/stage-g-m48-certification-tree.mjs',
  'scripts/verify-stage-g-m48-finalizer-fail-closed.mjs',
  'scripts/report-stage-g-m48.mjs',
  '.github/workflows/boards-columns-cells-status-system-recovery.yml',
  'config/stage-g-m47-boards-table-group-item-recovery-target.ts',
  'scripts/verify-stage-g-m47-production-invariants.mjs',
  'config/stage-g-m46-board-backend-contract.ts',
  'scripts/verify-stage-g-m46-production-contract.mjs',
  'package.json',
  'assets/js/features/boards/controllers/dialog-controller.ts',
  'src/features/boards/contracts/presentation.ts',
  'verify-v1432-board-overlays-m6.mjs',
];
required.forEach(exists);

const target = read(required[0]);
const manifest = read(required[1]);
const manifestTypes = read(required[2]);
const manifestSchema = read(required[3]);
const release = read(required[4]);
const continuation = read(required[5]);
const boardsUi = read(required[6]);
const workspaceView = read(required[7]);
const tableView = read(required[8]);
const resize = read(required[9]);
const workflows = read(required[10]);
const inline = read(required[11]);
const selectors = read(required[12]);
const statusEditor = read(required[13]);
const registry = read(required[14]);
const repository = read(required[15]);
const commands = read(required[16]);
const fixture = read(required[17]);
const browser = read(required[18]);
const browserRunner = read(required[19]);
const deterministic = read(required[20]);
const productionBoundary = read(required[21]);
const workflowVerifier = read(required[22]);
const candidate = read(required[23]);
const releaseGate = read(required[24]);
const finalizer = read(required[25]);
const packager = read(required[26]);
const artifactVerifier = read(required[27]);
const tree = read(required[28]);
const finalizerTest = read(required[29]);
const report = read(required[30]);
const hosted = read(required[31]);
const m47Target = read(required[32]);
const m47StaticVerifier = read('verify-stage-g-m47-boards-table-group-item-recovery.mjs');
const m47FinalizerSelfTest = read('scripts/verify-stage-g-m47-finalizer-fail-closed.mjs');
const m47Production = read(required[33]);
const m46Contract = read(required[34]);
const m46Production = read(required[35]);
const pkg = JSON.parse(read(required[36]));
const dialogController = read(required[37]);
const presentationContracts = read(required[38]);
const m6HistoricalVerifier = read(required[39]);

// Milestone/state/architecture authority.
has(target, 'milestone: 48', 'M48 target owns milestone 48');
has(target, "stage: 'G'", 'M48 target is Stage G');
has(target, "name: 'Boards Columns, Cells & Status System Recovery'", 'M48 target names the recovery scope');
const state = target.match(/activationState: '([^']+)'/)?.[1] ?? 'unknown';
ok(['implementation-complete-pending-certification', 'active-certified'].includes(state), 'M48 target exposes a recognized certification lifecycle state');
has(target, "prerequisite: Object.freeze({ milestone: 47, requiredState: 'active-certified'", 'M48 requires certified M47');
has(target, 'architectureVersion: 56', 'M48 advances architecture to 56');
has(m47Target, "activationState: 'active-certified'", 'M47 prerequisite remains active-certified');
has(m47StaticVerifier, 'applicationArchitectureVersion >= 55', 'retained M47 static verifier accepts later architecture descendants while preserving M47 authority');
has(m47FinalizerSelfTest, 'preparePendingCertificationFixture', 'retained M47 finalizer self-test synthesizes a pending fixture from active-certified M47 source');
has(m47FinalizerSelfTest, "replace(\"activationState: 'active-certified'\", \"activationState: 'implementation-complete-pending-certification'\")", 'retained M47 finalizer self-test rewrites only its isolated target fixture');
if (state === 'implementation-complete-pending-certification') {
  has(release, '**State:** implementation-complete-pending-certification', 'M48 pending release status matches target state');
  notHas(release, 'ACTIVE-CERTIFIED / PASS', 'M48 pending release does not prematurely claim certification');
} else {
  has(release, '**State:** active-certified', 'M48 certified release status matches promoted target state');
  has(release, '## Final certified baseline', 'M48 certified release records final certification provenance');
}
has(release, '**Architecture:** 56', 'M48 release status records architecture 56');
has(continuation, '**Checkpoint:** M48 Certification-Ready Checkpoint 9', 'M48 continuation identifies checkpoint 9');
has(continuation, '**Current source state:** implementation-complete-pending-certification', 'M48 continuation records the authoritative source state before artifact-only promotion');

for (const token of [
  "mode: 'retained-m46-m47-no-schema-change-v1'",
  'migrationRequired: false',
  'newRpcRequired: false',
  'rlsChangeRequired: false',
  "retainedBackendContract: 'config/stage-g-m46-board-backend-contract.ts'",
  "retainedProductionVerifier: 'scripts/verify-stage-g-m47-production-invariants.mjs'",
]) has(target, token, `M48 target locks retained-backend boundary: ${token}`);

// Architecture manifest/type/runtime-schema authority.
const applicationArchitectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
ok(applicationArchitectureVersion >= 56, 'application manifest remains an architecture 56+ descendant for retained M48 authority');
for (const token of [
  "boardColumnsCellsStatusRecovery: 'typed-columns-cells-status-recovery-v1'",
  "boardColumnsCellsStatusTarget: 'config/stage-g-m48-boards-columns-cells-status-recovery-target.ts'",
  "boardColumnsCellsStatusColumnWorkflows: 'assets/js/features/boards/controllers/column-workflows.ts'",
  "boardColumnsCellsStatusInlineEditor: 'assets/js/features/boards/controllers/inline-edit-controller.ts'",
  "boardColumnsCellsStatusSelectors: 'assets/js/features/boards/selectors/board-selectors.ts'",
  "boardColumnsCellsStatusStatusEditor: 'assets/js/features/boards/services/status-label-editor.ts'",
  "boardColumnsCellsStatusBrowser: 'tests/modern/e2e/boards-columns-cells-status-recovery.spec.mjs'",
  "boardColumnsCellsStatusBackendBoundary: 'retained-m46-m47-no-schema-change-v1'",
]) has(manifest, token, `application manifest locks M48 authority: ${token}`);
has(manifest, 'manifest.architectureVersion >= 56', 'application manifest validates architecture 56');
has(manifest, 'Architecture v56+ requires governed typed Board column/cell/status recovery', 'application manifest exposes M48 validation failure');
for (const token of ['boardColumnsCellsStatusRecovery?', 'boardColumnsCellsStatusTarget?', 'boardColumnsCellsStatusColumnWorkflows?', 'boardColumnsCellsStatusInlineEditor?', 'boardColumnsCellsStatusSelectors?', 'boardColumnsCellsStatusStatusEditor?', 'boardColumnsCellsStatusBrowser?', 'boardColumnsCellsStatusBackendBoundary?']) has(manifestTypes, token, `manifest types expose ${token}`);
for (const token of ["boardColumnsCellsStatusRecovery: z.literal('typed-columns-cells-status-recovery-v1').optional()", "boardColumnsCellsStatusBackendBoundary: z.literal('retained-m46-m47-no-schema-change-v1').optional()", 'manifest.architectureVersion >= 56', 'Architecture v56+ requires governed typed Board column/cell/status recovery']) has(manifestSchema, token, `runtime schema locks M48 token: ${token}`);

// Root-cause production corrections.
for (const token of [
  "column.data_type === 'status' || column.data_type === 'dropdown'",
  "String(value ?? '') !== filter",
  'if (leftValue == null && rightValue == null) return stableOrder()',
  'if (leftValue == null) return 1',
  'if (rightValue == null) return -1',
  'if (result === 0) return stableOrder()',
  "direction === 'desc' ? -result : result",
]) has(selectors, token, `selectors enforce M48 typed filter/sort behavior: ${token}`);

for (const token of ['const finish = (commit: boolean)', 'const onPointerUp = (): void => finish(true)', 'const onPointerCancel = (): void => finish(false)', 'applyWidth(root, key, startWidth)', 'handle.releasePointerCapture?.(event.pointerId)', 'if (!commit)']) has(resize, token, `resize controller locks commit/cancel semantics: ${token}`);

for (const token of ['const editorActive = inlineEdit.activeEditor', 'virtualizationRenderDeferredForEditor = true', 'if (!editorActive)', 'if (editorActive) inlineEdit.repositionPopover()', 'if (inlineEdit.activeEditor)', 'flushDeferredEditorVirtualization']) has(boardsUi, token, `Board scroll/virtualization ownership preserves active editor transactions: ${token}`);

for (const token of ["'data-edit-cell'", "'data-edit-item-title'", "'data-rename-column-inline'", "'data-rename-group-inline'", 'const restoreFocus = (): void =>', 'CSS.escape', 'current.restoreFocus()', 'restoreFocus();']) has(inline, token, `inline editor locks replacement-focus semantics: ${token}`);
notHas(inline, 'input.showPicker?.()', 'date editor does not force-open the native picker and preserves first-Escape cancel semantics');
has(inline, "{ parentOverlayId: 'inline-editor' }", 'status label destructive confirmation is nested under the active inline editor overlay');
for (const token of ['parentOverlayId?: string | null', 'ConfirmActionOptions', 'options?: ConfirmActionOptions']) has(presentationContracts, token, `presentation contracts expose nested confirmation authority: ${token}`);
for (const token of ['parentOverlayId = null', 'parentId: parentOverlayId', 'function confirm(message: string, { parentOverlayId = null }', 'parentOverlayId,']) has(dialogController, token, `dialog controller preserves nested overlay authority: ${token}`);

for (const token of [
  'ConfirmActionOptions',
  'dialogs.confirm(message, options)',
  'inlineEdit.activeEditor) return',
  'virtualizationFrame || dragDrop?.activeItemId || inlineEdit.activeEditor',
  'if (syncingBoardTableScroll) return',
]) has(boardsUi, token, `Boards controller locks active-editor/confirmation lifecycle: ${token}`);
has(dialogController, 'confirm(message: string, options?: ConfirmActionOptions)', 'dialog controller public contract forwards nested confirmation options');
has(m6HistoricalVerifier, 'message-first asynchronous and may add only backward-compatible optional confirmation options', 'M48 synchronizes the historical M6 dialog verifier with the backward-compatible optional confirmation extension');
has(m6HistoricalVerifier, 'message-first and may forward only backward-compatible optional confirmation options', 'M48 synchronizes the historical M6 Board wiring verifier with optional confirmation forwarding');
notHas(m6HistoricalVerifier, "'function confirm(message: string): Promise<boolean>'", 'M6 historical verifier no longer requires the obsolete exact-only dialog signature');
for (const token of ['readonly currentWidth: number', 'aria-valuenow="${Math.round(currentWidth)}"', 'aria-valuetext="${Math.round(currentWidth)} pixels"']) has(workspaceView, token, `column header renders committed resize accessibility: ${token}`);
for (const token of ['aria-valuenow="${Math.round(itemNameWidth)}"', 'aria-valuetext="${Math.round(itemNameWidth)} pixels"']) has(tableView, token, `item header renders committed resize accessibility: ${token}`);


has(workflows, 'name="confirm_delete" required', 'destructive populated-column deletion retains explicit acknowledgement');

for (const token of [
  "DEFAULT_DROPDOWN_OPTIONS = Object.freeze(['Option 1', 'Option 2']",
  'normalizeDropdownOptions',
  "options.length === 0",
  'options.length > 50',
  'option.length > 80',
  'option.toLowerCase()',
  'Dropdown option names must be unique.',
  'maxlength="4049"',
  "dataType === 'dropdown' ? normalizeDropdownOptions",
  "newType === 'dropdown' ? normalizeDropdownOptions",
]) has(workflows, token, `column workflows lock dropdown lifecycle: ${token}`);

for (const token of ['Keep at least one active status label.', "labels.filter((entry) => entry.active).length <= 1", 'toggleActive', 'remove']) has(statusEditor, token, `status editor locks active-label invariant: ${token}`);

// Typed editor contracts and authoritative RPCs remain present.
for (const token of ['normalizeBoardCellValue', 'explicitSave', 'explicitCancel', 'cancelOnEscape', 'commitOnBlur']) has(registry, token, `column type registry retains editor contract token: ${token}`);
for (const rpc of ['wm_add_board_column','wm_add_board_column_at','wm_update_board_column','wm_move_board_column','wm_delete_board_column','wm_duplicate_board_column','wm_change_board_column_type','wm_set_board_status_labels','wm_set_board_cell','wm_set_board_cell_if_current']) has(repository, rpc, `repository retains Board RPC ${rpc}`);
for (const token of ['createColumn', 'updateColumn', 'moveColumn', 'deleteColumn', 'duplicateColumn', 'changeColumnType', 'setStatusLabels', 'setCell']) has(commands, token, `command service retains ${token}`);

// Deterministic fixture and execution authority.
for (const rpc of ['wm_add_board_column','wm_add_board_column_at','wm_update_board_column','wm_move_board_column','wm_delete_board_column','wm_duplicate_board_column','wm_change_board_column_type','wm_set_board_status_labels','wm_set_board_cell','wm_set_board_cell_if_current','wm_get_board_preferences','wm_set_board_preferences']) has(fixture, rpc, `M48 fixture models ${rpc}`);
for (const token of ['state.values=state.values.filter((entry)=>entry.column_id !== id)', 'delete widths[id]', 'delete filters[id]', 'Boolean(body.p_with_values)', 'Boolean(body.p_clear_values)', 'default_label_id', 'state.items.forEach', 'snapshot:()=>clone(state)', 'calls:(name)=>']) has(fixture, token, `M48 fixture preserves persistence semantic: ${token}`);
for (const token of [
  "getBoardCellEditorContract(type)",
  "normalizeBoardCellValue('text'",
  "normalizeBoardCellValue('number'",
  "normalizeBoardCellValue('date'",
  "normalizeBoardCellValue('dropdown'",
  "normalizeBoardCellValue('status'",
  "normalizeBoardCellValue('people'",
  'at least one active',
  "column_filters:{ choice:'Low' }",
  "sort_direction:'desc'",
  "wm_duplicate_board_column",
  "wm_change_board_column_type",
  "wm_set_board_status_labels",
  "wm_set_board_cell",
  "defaultColumnName('text'",
  "'New Text'",
  'M48 deterministic verification: PASS',
]) has(deterministic, token, `M48 deterministic verifier locks ${token}`);

// Browser authority: every required editor plus lifecycle persistence/cancel semantics.
for (const token of ['@m48-typed-cells','@m48-filter-sort','@m48-column-lifecycle','@m48-status-lifecycle']) has(browser, token, `M48 browser contains ${token}`);
for (const token of [
  "name:'Edit Notes'", 'Edit Estimate', 'Edit Target date', "name:'Choose Priority'", "name:'Board members'", '.board-status-picker',
  "press('Escape')", 'toBeFocused()', "calls('wm_set_board_cell_if_current')", 'page.reload()',
  "selectOption('Low')", "selectOption('todo')", "aria-sort','descending'", "['Bravo','Alpha','Charlie']",
  "expect(createCall?.p_name).toBe('New Text')", "name:`Rename ${createCall.p_name} column`",
  "name:'Duplicate column'", 'p_with_values', "name:'Change column type'", 'p_clear_values', "toEqual(['Option 1','Option 2'])",
  'pointercancel', "column_widths[createdId]", "name:'Delete column permanently'", 'input[name="confirm_delete"]', "toHaveAttribute('required', '')", "calls('wm_delete_board_column')",
  "name:'Cancel changes'", "await expect(manager).toBeVisible()", "name:'Deactivate label'", "name:'Delete label'", "name:'+ New label'", "name:'Set as default'", "name:'Apply changes'", "calls('wm_set_board_status_labels')",
]) has(browser, token, `M48 browser locks interaction/persistence token: ${token}`);
for (const token of ['modern test toolchain', 'boards-columns-cells-status-recovery.spec.mjs', 'Stage G M48 Boards Columns, Cells & Status System Recovery browser verification: PASS']) has(browserRunner, token, `M48 browser runner locks ${token}`);

// Retained backend boundary: explicitly no M48 database mutation.
for (const token of ['retained-m46-m47-no-schema-change-v1', 'migrationRequired: false', 'newRpcRequired: false', 'rlsChangeRequired: false', 'wm_set_board_status_labels']) has(productionBoundary, token, `production boundary locks ${token}`);
for (const dir of ['supabase/migrations','supabase/deployments']) {
  if (!fs.existsSync(dir)) continue;
  const names = fs.readdirSync(dir, { recursive: true }).map(String).filter((name) => /m48|stage[_-]g[_-]m48/i.test(name));
  ok(names.length === 0, `M48 ships no ${dir} migration/deployment artifact`);
}
has(m47Production, 'M47', 'M48 retains M47 production invariant authority');
has(m46Production, 'M46', 'M48 retains M46 production contract authority');
has(m46Contract, 'BOARD_BACKEND_CONTRACT', 'M48 retains M46 backend contract digest authority');

// State-aware workflow and package scripts.
for (const token of ['pull_request:', 'implementation-complete-pending-certification', 'npm run boards-columns-cells-status:verify:candidate', 'npm run boards-columns-cells-status:verify:release', 'npm run boards-columns-cells-status:certify', 'M48_SOURCE_COMMIT: ${{ github.sha }}', 'M48_EXPECTED_SOURCE_COMMIT: ${{ github.sha }}', 'if-no-files-found: error']) has(hosted, token, `hosted M48 workflow locks ${token}`);
notHas(hosted, 'continue-on-error:', 'hosted M48 workflow has no continue-on-error bypass');
has(workflowVerifier, 'Stage G M48 state-aware workflow verification: PASS', 'M48 workflow verifier is executable authority');
for (const key of [
  'boards-columns-cells-status:check','boards-columns-cells-status:test','boards-columns-cells-status:browser','boards-columns-cells-status:production-boundary','boards-columns-cells-status:workflows','boards-columns-cells-status:finalizer:test','boards-columns-cells-status:verify:candidate','boards-columns-cells-status:verify:release','boards-columns-cells-status:certify','boards-columns-cells-status:package','boards-columns-cells-status:status',
]) ok(typeof pkg.scripts?.[key] === 'string' && pkg.scripts[key].length > 0, `package.json exposes ${key}`);

for (const token of ['boards-columns-cells-status:check','boards-columns-cells-status:workflows','boards-columns-cells-status:test','boards-columns-cells-status:browser','boards-columns-cells-status:production-boundary','boards-table-recovery:browser','board-backend-contract:browser','boards-collection:browser','database-rls:test:local','typecheck','security:check','verify:ui','npm run verify','npm run build']) has(candidate, token, `M48 candidate gate retains ${token}`);
for (const token of ['verify-stage-g-m48-candidate.sh','boards-columns-cells-status:production-boundary','boards-table-recovery:production','board-backend-contract:production']) has(releaseGate, token, `M48 release gate retains ${token}`);

for (const token of [
  "BASE='Work-Management-App-v1.43.2-Stage-G-M48-Certified-Baseline'",
  'M48_SOURCE_COMMIT',
  'SOURCE_BEFORE=',
  'boards-columns-cells-status:verify:release',
  'git archive --format=tar "$COMMIT"',
  "activationState: 'active-certified'",
  'stage-g-m48-certification-tree.mjs',
  'verify-stage-g-m48-boards-columns-cells-status-system-recovery.mjs',
  'verify-stage-g-m48-production-boundary.mjs',
  'verify-stage-g-m47-production-invariants.mjs',
  'verify-stage-g-m46-production-contract.mjs',
  'verify-project.sh',
  'vite" build',
  'scan-secrets.mjs',
  'CHECKSUMS.sha256',
  'M48_EXPECTED_SOURCE_COMMIT',
  'STAGE G M48 CERTIFICATION: PASS',
  'M48 STATUS: ACTIVE-CERTIFIED / PASS',
]) has(finalizer, token, `M48 finalizer locks ${token}`);
notHas(finalizer, 'supabase db push', 'M48 finalizer cannot replay a database migration');
notHas(finalizer, 'deploy-stage-g-m47-production-recovery.sh', 'M48 finalizer does not replay M47 deployment');
has(packager, 'finalize-stage-g-m48.sh', 'M48 package entry delegates to fail-closed finalizer');
for (const token of ['RESULT: PASS', 'CERTIFICATION STATE: active-certified', 'CERTIFIED SOURCE TREE SHA-256', 'CERTIFIED SOURCE COMMIT', 'M48 SEMANTICS VERSION', 'retained-m46-m47-no-schema-change-v1', 'CHECKSUMS.sha256']) has(artifactVerifier, token, `M48 artifact verifier locks ${token}`);
for (const token of ['CHECKSUMS.sha256', 'stage-g-m48-boards-columns-cells-status-recovery-target.ts', 'RELEASE-STATUS-v1.43.2-STAGE-G-M48-BOARDS-COLUMNS-CELLS-STATUS-SYSTEM-RECOVERY.md', '--compare']) has(tree, token, `M48 certification tree locks ${token}`);
for (const token of ['invalid M48 source commit binding', 'simulated-release-failure', 'source tree changed during pre-certification gates', 'reached-post-state-gate', 'active-certified staged static verifier', 'realpath-stable']) has(finalizerTest, token, `M48 finalizer self-test locks ${token}`);
has(report, 'M48', 'M48 status reporter exists');

// No source-level premature PASS record or generated artifact is allowed.
ok(!fs.existsSync('m48-certified-artifacts-upload'), 'authoritative pending M48 source contains no pre-generated certified artifact directory');
ok(!/[ \t]+$/m.test(release), 'M48 release authority contains no trailing whitespace');
ok(!/[ \t]+$/m.test(continuation), 'M48 continuation authority contains no trailing whitespace');

console.log(`Stage G M48 static recovery verification: PASS (${checks} checks)`);
