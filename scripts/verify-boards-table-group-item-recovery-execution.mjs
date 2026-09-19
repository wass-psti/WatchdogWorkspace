import assert from 'node:assert/strict';
import { createBoardViewState } from '../assets/js/features/boards/board-state.ts';
import { createBoardSelectors } from '../assets/js/features/boards/selectors/board-selectors.ts';
import { createBoardCommandService } from '../assets/js/features/boards/services/board-command-service.ts';
import { createBoardPreferencePersistenceController } from '../assets/js/features/boards/controllers/board-preference-controller.ts';
import { createBoardPreferencePatchService } from '../assets/js/features/boards/services/board-preferences-service.ts';
import { createBoardSelectionController } from '../assets/js/features/boards/controllers/selection-controller.ts';
import { createBoardTableVirtualizationController } from '../assets/js/features/boards/controllers/board-table-virtualization-controller.ts';
import { createItemWorkflows } from '../assets/js/features/boards/controllers/item-workflows.ts';
import { renderBoardItemRow } from '../assets/js/features/boards/views/board-workspace-view.ts';
import { assertBoardEnvelope, assertWorkspaceEnvelope, mapBoardList, mapBoardPreferences } from '../assets/js/features/boards/data/board-contracts.ts';
import { installM47BoardsTableFixture } from '../tests/modern/e2e/helpers/m47-boards-table-fixture.mjs';

const board = (id = 'b1') => ({ id, name: 'Board', description: '', status: 'active', view: 'table', view_mode: 'table', member_role: 'owner' });
const group = (id, position, title = id) => ({ id, board_id: 'b1', title, accent_color: '#5b7cfa', position });
const item = (id, groupId, position, overrides = {}) => ({ id, board_id: 'b1', group_id: groupId, title: id, status: 'not_started', assignee_id: null, due_date: null, notes: '', position, archived_at: null, ...overrides });
const envelope = ({ groups = [], items = [], id = 'b1' } = {}) => ({ board: board(id), groups, items, columns: [], values: [], members: [] });
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, '');
let checks = 0;
const pass = (condition, message) => { assert.ok(condition, message); checks += 1; };


// Browser fixture Status labels must satisfy the same strict DTO boundary as production Board payloads.
{
  const stamp = '2026-09-18T00:00:00.000Z';
  const strictFixture = {
    board: { id:'board-m47', name:'M47 Recovery Board', description:'fixture', status:'active', view_mode:'table', member_role:'owner', owner_id:'00000000-0000-4000-8000-000000000039', item_count:1, created_at:stamp, updated_at:stamp },
    groups: [{ id:'group-a', board_id:'board-m47', title:'Planning', accent_color:'#5b7cfa', position:0, created_at:stamp, updated_at:stamp }],
    items: [{ id:'item-a1', board_id:'board-m47', group_id:'group-a', title:'Alpha', status:'todo', assignee_id:null, due_date:null, notes:'', position:0, archived_at:null, created_at:stamp, updated_at:stamp }],
    columns: [{ id:'col-status', board_id:'board-m47', column_key:'status', name:'Status', data_type:'status', system_key:'status', position:0, visible:true, required:false, config:{ labels:[{ id:'todo', name:'To do', color:'#7f8a9a', active:true, description:'', position:0 }], default_label_id:'todo' }, created_at:stamp, updated_at:stamp }],
    values: [],
    members: [{ board_id:'board-m47', user_id:'00000000-0000-4000-8000-000000000039', role:'owner', email:'m47-admin@example.test', display_name:'M47 Admin' }],
  };
  assert.doesNotThrow(() => assertBoardEnvelope(strictFixture, 'm47.browser-fixture'));
  checks += 1;
  const invalidFixture = structuredClone(strictFixture);
  delete invalidFixture.columns[0].config.labels[0].description;
  assert.throws(() => assertBoardEnvelope(invalidFixture, 'm47.browser-fixture'), /Status configuration contains an invalid label/);
  checks += 1;
}

// The browser RPC fixture must remain executable through the real production DTO mappers across the full M47 mutation lifecycle.
{
  let routeHandler = null;
  const page = { route: async (_pattern, handler) => { routeHandler = handler; } };
  const fixture = await installM47BoardsTableFixture(page);
  assert.equal(typeof routeHandler, 'function');
  checks += 1;

  const rpc = async (name, body = {}) => {
    let response = null;
    let fellBack = false;
    const request = {
      url: () => `https://m39-fixture.supabase.co/rest/v1/rpc/${name}`,
      method: () => 'POST',
      postDataJSON: () => body,
    };
    const route = {
      request: () => request,
      fulfill: async (options) => { response = { status: options.status, body: JSON.parse(options.body) }; },
      fallback: async () => { fellBack = true; },
    };
    await routeHandler(route);
    assert.equal(fellBack, false, `${name} unexpectedly fell through the M47 fixture.`);
    assert.ok(response, `${name} did not produce a fixture response.`);
    assert.ok(response.status < 400, `${name} returned ${response.status}: ${JSON.stringify(response.body)}`);
    return response.body;
  };

  assert.equal(mapBoardList(await rpc('wm_list_boards', { p_status:'active' })).length, 1);
  checks += 1;
  let loaded = assertBoardEnvelope(await rpc('wm_get_board', { p_board_id:'board-m47' }), 'm47.fixture-lifecycle.initial');
  assert.ok(loaded);
  checks += 1;
  mapBoardPreferences(await rpc('wm_get_board_preferences', { p_board_id:'board-m47' }));
  mapBoardPreferences(await rpc('wm_set_board_preferences', { p_board_id:'board-m47', p_preferences:{ collapsed_groups:['group-a'], sort_column_id:'col-status', sort_direction:'asc' } }));
  checks += 1;
  assert.deepEqual(await rpc('wm_list_board_events', { p_board_id:'board-m47' }), []);
  checks += 1;

  const groupId = await rpc('wm_add_board_group', { p_board_id:'board-m47', p_title:'QA' });
  assert.equal(typeof groupId, 'string');
  await rpc('wm_update_board_group', { p_group_id:groupId, p_title:'Quality' });
  await rpc('wm_set_board_group_accent', { p_group_id:groupId, p_accent_color:'#123456' });
  await rpc('wm_move_board_group', { p_group_id:groupId, p_position:0 });
  loaded = assertBoardEnvelope(await rpc('wm_get_board', { p_board_id:'board-m47' }), 'm47.fixture-lifecycle.group');
  assert.ok(loaded?.groups.some((entry) => entry.id === groupId && entry.title === 'Quality' && entry.position === 0));
  checks += 2;

  const itemId = await rpc('wm_add_board_item', { p_board_id:'board-m47', p_group_id:groupId, p_title:'Echo' });
  assert.equal(typeof itemId, 'string');
  await rpc('wm_update_board_item', { p_item_id:itemId, p_title:'Echo Updated', p_status:'done_custom', p_assignee_id:null, p_due_date:null, p_notes:'' });
  await rpc('wm_move_board_item', { p_item_id:itemId, p_group_id:'group-b', p_position:9999, p_status:'done_custom' });
  const duplicateId = await rpc('wm_duplicate_board_item', { p_item_id:itemId });
  assert.equal(typeof duplicateId, 'string');
  await rpc('wm_set_board_item_archived', { p_item_id:duplicateId, p_archived:true });
  loaded = assertBoardEnvelope(await rpc('wm_get_board', { p_board_id:'board-m47' }), 'm47.fixture-lifecycle.archive');
  assert.ok(loaded?.items.find((entry) => entry.id === duplicateId)?.archived_at);
  assertWorkspaceEnvelope(await rpc('wm_get_board_item_workspace', { p_item_id:duplicateId }), duplicateId);
  checks += 4;

  await rpc('wm_set_board_item_archived', { p_item_id:duplicateId, p_archived:false });
  await rpc('wm_set_board_cell', { p_item_id:itemId, p_column_id:'col-text-1', p_value:'fixture-value' });
  loaded = assertBoardEnvelope(await rpc('wm_get_board', { p_board_id:'board-m47' }), 'm47.fixture-lifecycle.cell');
  assert.ok(loaded?.values.some((entry) => entry.item_id === itemId && entry.column_id === 'col-text-1' && entry.value === 'fixture-value'));
  checks += 2;

  await rpc('wm_delete_board_item', { p_item_id:duplicateId });
  await rpc('wm_delete_board_group', { p_group_id:groupId });
  loaded = assertBoardEnvelope(await rpc('wm_get_board', { p_board_id:'board-m47' }), 'm47.fixture-lifecycle.final');
  assert.ok(loaded && !loaded.groups.some((entry) => entry.id === groupId) && !loaded.items.some((entry) => entry.id === duplicateId));
  assert.ok(fixture.calls().length >= 23);
  checks += 2;
}

// Visible selection order is the rendered table order and excludes collapsed groups.
{
  const state = createBoardViewState();
  state.board = envelope({
    groups: [group('g2', 1), group('g1', 0)],
    items: [item('g2-b', 'g2', 1), item('g1-b', 'g1', 1), item('g2-a', 'g2', 0), item('g1-a', 'g1', 0)],
  });
  state.boardPrefs = { ...state.boardPrefs, collapsed_groups: ['g1'] };
  const selectors = createBoardSelectors(state);
  assert.deepEqual(selectors.visibleTableItems().map((entry) => entry.id), ['g2-a', 'g2-b']);
  checks += 1;
  state.boardPrefs = { ...state.boardPrefs, collapsed_groups: [] };
  assert.deepEqual(selectors.visibleTableItems().map((entry) => entry.id), ['g1-a', 'g1-b', 'g2-a', 'g2-b']);
  checks += 1;
}

// Archived visibility is additive: active rows remain visible while the archived toggle reveals archived rows.
{
  const state = createBoardViewState();
  state.board = envelope({
    groups: [group('g1', 0)],
    items: [item('active', 'g1', 0), item('archived', 'g1', 1, { archived_at: '2026-09-18T00:00:00Z' })],
  });
  const selectors = createBoardSelectors(state);
  assert.deepEqual(selectors.visibleTableItems().map((entry) => entry.id), ['active']);
  checks += 1;
  state.showArchived = true;
  assert.deepEqual(selectors.visibleTableItems().map((entry) => entry.id), ['active', 'archived']);
  checks += 1;
}

// Composite item creation rolls back the inserted item when enrichment fails.
{
  const calls = [];
  const service = new Proxy({}, {
    get(_target, key) {
      if (key === 'addItem') return async () => { calls.push('add'); return 'new-item'; };
      if (key === 'updateItem') return async () => { calls.push('update'); throw new Error('enrichment failed'); };
      if (key === 'deleteItem') return async () => { calls.push('delete'); };
      return async () => undefined;
    },
  });
  const commands = createBoardCommandService({ service });
  await assert.rejects(() => commands.createItem({ boardId: 'b1', groupId: 'g1', title: 'New item' }), /enrichment failed/);
  assert.deepEqual(calls, ['add', 'update', 'delete']);
  checks += 2;
}

// A pending preference write is snapshot-bound to the board it was scheduled for and flushes on route exit.
{
  const state = createBoardViewState();
  state.board = envelope({ id: 'board-a' });
  state.boardPrefs = { ...state.boardPrefs, item_name_width: 411, collapsed_groups: ['g1'] };
  const writes = [];
  const commands = { savePreferences: async (boardId, preferences) => { writes.push({ boardId, preferences }); return preferences; } };
  const persistence = createBoardPreferencePersistenceController({ state, commands, patches: createBoardPreferencePatchService(), delayMs: 60_000 });
  persistence.schedule();
  state.board = envelope({ id: 'board-b' });
  state.boardPrefs = { ...state.boardPrefs, item_name_width: 222, collapsed_groups: [] };
  await persistence.flushPending();
  assert.equal(writes.length, 1);
  assert.equal(writes[0].boardId, 'board-a');
  assert.equal(writes[0].preferences.item_name_width, 411);
  assert.deepEqual(writes[0].preferences.collapsed_groups, ['g1']);
  checks += 4;
}

// Bulk mutation failures reconcile authoritative state and clear stale selection after partial success.
{
  const state = createBoardViewState();
  state.board = envelope({ groups: [group('g1', 0)], items: [item('i1', 'g1', 0), item('i2', 'g1', 1)] });
  state.selectedItems = ['i1', 'i2'];
  let archiveCalls = 0;
  let reloads = 0;
  const controller = createBoardSelectionController({
    state,
    commands: {
      archiveItem: async () => { archiveCalls += 1; if (archiveCalls === 2) throw new Error('second mutation failed'); },
    },
    toast: () => {},
    getVisibleItems: () => state.board.items,
    reloadBoard: async () => { reloads += 1; },
    escapeHtml: esc,
    canEdit: () => true,
  });
  assert.equal(await controller.archiveSelected(), false);
  assert.equal(archiveCalls, 2);
  assert.equal(reloads, 1);
  assert.deepEqual(state.selectedItems, []);
  checks += 4;
}

// Cross-group edits move first and compensate the move if field persistence fails.
{
  const state = createBoardViewState();
  const original = item('i1', 'g1', 0, { title: 'Before' });
  state.board = envelope({ groups: [group('g1', 0), group('g2', 1)], items: [original] });
  const calls = [];
  let submitted = null;
  let reloads = 0;
  const workflows = createItemWorkflows({
    commands: {
      moveItem: async (command) => { calls.push(`move:${command.groupId}:${command.position}`); },
      updateItem: async () => { calls.push('update'); throw new Error('update failed'); },
    },
    state,
    dialog: (options) => { submitted = options.onSubmit; return { wrap: {}, close() {} }; },
    toast: () => {},
    escapeHtml: esc,
    reloadBoard: async () => { reloads += 1; },
    getStatusLabels: () => [{ id: 'not_started', name: 'Not started', color: '#000000', active: true, position: 0 }],
    getDefaultStatus: () => 'not_started',
  });
  workflows.open(original);
  const form = new FormData();
  form.set('title', 'After'); form.set('group', 'g2'); form.set('status', 'not_started'); form.set('assignee', ''); form.set('due', ''); form.set('notes', '');
  await assert.rejects(() => submitted(form), /update failed/);
  assert.deepEqual(calls, ['move:g2:9999', 'update', 'move:g1:0']);
  assert.equal(reloads, 1);
  checks += 3;
}

// The exact 21-column End-navigation vector must keep the final logical column materialized after the intentional horizontal move.
{
  const controller = createBoardTableVirtualizationController();
  const widths = Array.from({ length: 21 }, () => 160);
  const initial = controller.columnWindow(widths);
  pass(initial.enabled, '21 logical dynamic columns must activate horizontal virtualization');
  pass(initial.end < widths.length, 'initial virtual window must not already materialize the final logical column');
  const endNavigation = controller.ensureColumnVisible(widths.length - 1, widths);
  pass(endNavigation.changed, 'End navigation must intentionally move the horizontal virtual window');
  pass(endNavigation.scrollLeft > 0, 'End navigation must publish a positive horizontal restoration coordinate');
  controller.updateColumnsFromScroller({ scrollLeft: endNavigation.scrollLeft, clientWidth: 960 }, widths);
  const finalWindow = controller.columnWindow(widths);
  pass(finalWindow.end === widths.length, 'End navigation must materialize the final logical column');
  pass(finalWindow.start <= widths.length - 1 && widths.length - 1 < finalWindow.end, 'final logical column must remain contained in the restored virtual window');
  controller.reset();
  pass(controller.columnWindow(widths).start === initial.start, 'virtual-column controller reset must restore the initial logical window');
}

// The exact 180-row / 48-ArrowDown vector must keep every requested logical row materializable across row-window boundaries.
{
  const controller = createBoardTableVirtualizationController();
  const totalRows = 180;
  const rowHeight = 44;
  const initial = controller.rowWindow('g1', totalRows, rowHeight);
  pass(initial.enabled, '180 rows must activate row virtualization');
  pass(!(48 >= initial.start && 48 < initial.end), 'row 48 must begin outside the initial virtual row window so the stress vector crosses a boundary');
  let allTargetsMaterialized = true;
  let windowChanges = 0;
  for (let rowIndex = 1; rowIndex <= 48; rowIndex += 1) {
    if (controller.ensureRowVisible('g1', rowIndex, totalRows, rowHeight)) windowChanges += 1;
    const current = controller.rowWindow('g1', totalRows, rowHeight);
    if (!(rowIndex >= current.start && rowIndex < current.end)) allTargetsMaterialized = false;
  }
  pass(allTargetsMaterialized, 'sequential ArrowDown targets through row 48 must remain materializable after every virtual-window transition');
  pass(windowChanges > 0, '48-row keyboard traversal must exercise at least one virtual-row window transition');
  const finalWindow = controller.rowWindow('g1', totalRows, rowHeight);
  pass(48 >= finalWindow.start && 48 < finalWindow.end, 'logical row 48 must remain inside the final materialized virtual row window');
}

// Read-only cells stay keyboard-focusable, while non-reorderable rows expose no drag handle.
{
  const state = createBoardViewState();
  const markup = renderBoardItemRow({
    state,
    item: item('i1', 'g1', 0),
    group: group('g1', 0),
    columns: [{ id: 'c1', board_id: 'b1', name: 'Text', data_type: 'text', config: {}, position: 0, visible: true, system_key: null }],
    canEdit: false,
    canReorder: false,
    isWrapped: () => false,
    formatCell: () => '<span>value</span>',
    escapeHtml: esc,
  });
  pass(markup.includes('aria-disabled="true" data-readonly-cell="true"'), 'read-only cells must be aria-disabled instead of native disabled');
  pass(!markup.includes('data-item-drag='), 'non-reorderable rows must not expose a reorder handle');
  pass(markup.includes('draggable="false"'), 'non-reorderable rows must not be native-draggable');
  pass(!/board-cell-button[^>]+\sdisabled(?:\s|>)/.test(markup), 'read-only cells must remain focusable for keyboard navigation');
}

console.log(`Stage G M47 Boards Table / Group / Item Recovery deterministic verification: PASS (checks=${checks})`);
