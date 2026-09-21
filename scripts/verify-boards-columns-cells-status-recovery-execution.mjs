import assert from 'node:assert/strict';
import { createBoardViewState } from '../assets/js/features/boards/board-state.ts';
import { createBoardSelectors } from '../assets/js/features/boards/selectors/board-selectors.ts';
import { getBoardCellEditorContract, normalizeBoardCellValue } from '../assets/js/features/boards/grid/column-type-registry.ts';
import { defaultColumnName } from '../assets/js/features/boards/board-schema.ts';
import { createStatusLabelEditor } from '../assets/js/features/boards/services/status-label-editor.ts';
import { serializeStatusConfig } from '../assets/js/features/boards/status-labels.ts';
import { createBoardPreferencePatchService } from '../assets/js/features/boards/services/board-preferences-service.ts';
import { assertBoardEnvelope, mapBoardPreferences } from '../assets/js/features/boards/data/board-contracts.ts';
import { installM48BoardsColumnsFixture, M48_BOARD_ID, M48_ADMIN_ID, M48_MEMBER_ID } from '../tests/modern/e2e/helpers/m48-boards-columns-fixture.mjs';

let checks = 0;
const pass = (condition, message) => { assert.ok(condition, message); checks += 1; };

assert.equal(defaultColumnName('text', ['Status','Notes','Owner','Target date','Priority','Estimate']), 'New Text'); checks += 1;
const stamp = '2026-09-20T00:00:00.000Z';

// Required typed cell contracts remain explicit about save/cancel and normalize to persisted values.
{
  for (const type of ['text','number','date']) {
    const contract = getBoardCellEditorContract(type);
    assert.equal(contract.policy.explicitSave, true);
    assert.equal(contract.policy.explicitCancel, true);
    assert.equal(contract.policy.saveOnEnter, true);
    assert.equal(contract.policy.cancelOnEscape, true);
    assert.equal(contract.policy.commitOnBlur, false);
    checks += 5;
  }
  for (const type of ['status','dropdown','people']) {
    const contract = getBoardCellEditorContract(type);
    assert.equal(contract.policy.explicitCancel, true);
    assert.equal(contract.policy.cancelOnEscape, true);
    assert.equal(contract.policy.commitOnBlur, false);
    checks += 3;
  }
  assert.equal(normalizeBoardCellValue('text','  Alpha  '),'Alpha'); checks += 1;
  assert.equal(normalizeBoardCellValue('number','42.5'),42.5); checks += 1;
  assert.equal(normalizeBoardCellValue('date','2026-12-31'),'2026-12-31'); checks += 1;
  assert.equal(normalizeBoardCellValue('dropdown','High'),'High'); checks += 1;
  assert.equal(normalizeBoardCellValue('status','doing'),'doing'); checks += 1;
  assert.equal(normalizeBoardCellValue('people',M48_MEMBER_ID),M48_MEMBER_ID); checks += 1;
  assert.throws(() => normalizeBoardCellValue('number','not-a-number'), /valid number/); checks += 1;
  assert.throws(() => normalizeBoardCellValue('date','2026-02-30'), /valid date/); checks += 1;
}

// Status lifecycle guards must reject invalid all-inactive state and preserve a valid default.
{
  const column = {
    config:{ labels:[
      { id:'todo', name:'To do', color:'#7f8a9a', active:true, description:'', position:0 },
      { id:'doing', name:'Doing', color:'#5b7cfa', active:true, description:'', position:1 },
    ], default_label_id:'todo' },
  };
  const editor = createStatusLabelEditor(column);
  editor.toggleActive('todo');
  assert.equal(editor.snapshot().defaultId,'doing'); checks += 1;
  assert.throws(() => editor.toggleActive('doing'), /at least one active/); checks += 1;
  assert.throws(() => editor.remove('doing'), /at least one active/); checks += 1;
  editor.toggleActive('todo');
  editor.rename('todo','Backlog');
  editor.move('todo','down');
  editor.setDefault('todo');
  const config = editor.serialize();
  assert.equal(config.default_label_id,'todo'); checks += 1;
  assert.equal(config.labels.find((entry)=>entry.id==='todo')?.name,'Backlog'); checks += 1;
  assert.equal(config.labels.at(-1)?.id,'todo'); checks += 1;
  assert.doesNotThrow(() => serializeStatusConfig(config.labels,config.default_label_id)); checks += 1;
}

// Typed filter equality and sort null placement are deterministic for both ascending and descending order.
{
  const state = createBoardViewState();
  state.board = {
    board:{ id:'b1', name:'Board', description:'', status:'active', view_mode:'table', member_role:'owner' },
    groups:[{ id:'g1', board_id:'b1', title:'Group', accent_color:'#5b7cfa', position:0 }],
    items:[
      { id:'i1', board_id:'b1', group_id:'g1', title:'Alpha', status:'todo', assignee_id:null, due_date:null, notes:'', position:0, archived_at:null },
      { id:'i2', board_id:'b1', group_id:'g1', title:'Bravo', status:'doing', assignee_id:null, due_date:null, notes:'', position:1, archived_at:null },
      { id:'i3', board_id:'b1', group_id:'g1', title:'Charlie', status:'todo', assignee_id:null, due_date:null, notes:'', position:2, archived_at:null },
    ],
    columns:[
      { id:'status', board_id:'b1', column_key:'status', name:'Status', data_type:'status', system_key:'status', position:0, visible:true, required:false, config:{ labels:[{id:'todo',name:'To do',color:'#7f8a9a',active:true,description:'',position:0},{id:'doing',name:'Doing',color:'#5b7cfa',active:true,description:'',position:1}], default_label_id:'todo' } },
      { id:'choice', board_id:'b1', column_key:'custom:choice', name:'Priority', data_type:'dropdown', system_key:null, position:1, visible:true, required:false, config:{ options:['Low','Low priority'] } },
      { id:'num', board_id:'b1', column_key:'custom:num', name:'Estimate', data_type:'number', system_key:null, position:2, visible:true, required:false, config:{} },
    ],
    values:[
      { item_id:'i1', column_id:'choice', value:'Low', updated_at:stamp },
      { item_id:'i2', column_id:'choice', value:'Low priority', updated_at:stamp },
      { item_id:'i1', column_id:'num', value:10, updated_at:stamp },
      { item_id:'i2', column_id:'num', value:20, updated_at:stamp },
    ],
    members:[],
  };
  const selectors = createBoardSelectors(state);
  state.boardPrefs={ ...state.boardPrefs, column_filters:{ choice:'Low' } };
  assert.deepEqual(selectors.visibleTableItems().map((entry)=>entry.id),['i1']); checks += 1;
  state.boardPrefs={ ...state.boardPrefs, column_filters:{ status:'todo' } };
  assert.deepEqual(selectors.visibleTableItems().map((entry)=>entry.id),['i1','i3']); checks += 1;
  state.boardPrefs={ ...state.boardPrefs, column_filters:{}, sort_column_id:'num', sort_direction:'asc' };
  assert.deepEqual(selectors.visibleTableItems().map((entry)=>entry.id),['i1','i2','i3']); checks += 1;
  state.boardPrefs={ ...state.boardPrefs, sort_column_id:'num', sort_direction:'desc' };
  assert.deepEqual(selectors.visibleTableItems().map((entry)=>entry.id),['i2','i1','i3']); checks += 1;
}

// Column-reference preference cleanup is total and leaves unrelated preferences intact.
{
  const patches = createBoardPreferencePatchService();
  const source = { sort_column_id:'c1', sort_direction:'desc', column_filters:{ c1:'x', c2:'y' }, wrap_columns:['c1','c2'], column_widths:{ c1:333, c2:222 }, collapsed_groups:['g1'], item_name_width:310 };
  const next = patches.withoutColumnReferences(source,'c1');
  assert.equal(next.sort_column_id,null); checks += 1;
  assert.equal(next.sort_direction,null); checks += 1;
  assert.deepEqual(next.column_filters,{ c2:'y' }); checks += 1;
  assert.deepEqual(next.wrap_columns,['c2']); checks += 1;
  assert.deepEqual(next.column_widths,{ c2:222 }); checks += 1;
  assert.deepEqual(next.collapsed_groups,['g1']); checks += 1;
  assert.equal(next.item_name_width,310); checks += 1;
}

// M48 browser fixture must execute the complete persisted column/cell/status lifecycle through production DTO validation.
{
  let routeHandler = null;
  const page = { route: async (_pattern, handler) => { routeHandler = handler; } };
  const fixture = await installM48BoardsColumnsFixture(page);
  assert.equal(typeof routeHandler,'function'); checks += 1;

  const rpc = async (name, body = {}) => {
    let response=null; let fellBack=false;
    const request={ url:()=>`https://m39-fixture.supabase.co/rest/v1/rpc/${name}`, method:()=> 'POST', postDataJSON:()=>body };
    const route={ request:()=>request, fulfill:async(options)=>{ response={ status:options.status, body:JSON.parse(options.body) }; }, fallback:async()=>{ fellBack=true; } };
    await routeHandler(route);
    assert.equal(fellBack,false,`${name} unexpectedly fell through M48 fixture.`);
    assert.ok(response,`${name} did not return a response.`);
    assert.ok(response.status < 400,`${name} returned ${response.status}: ${JSON.stringify(response.body)}`);
    return response.body;
  };

  let loaded=assertBoardEnvelope(await rpc('wm_get_board',{ p_board_id:M48_BOARD_ID }),'m48.initial');
  assert.ok(loaded); checks += 1;
  mapBoardPreferences(await rpc('wm_get_board_preferences',{ p_board_id:M48_BOARD_ID })); checks += 1;

  const added=await rpc('wm_add_board_column_at',{ p_board_id:M48_BOARD_ID, p_name:'Quality', p_data_type:'dropdown', p_config:{ options:['A','B'] }, p_position:2 });
  assert.match(added,/^col-new-/); checks += 1;
  loaded=assertBoardEnvelope(await rpc('wm_get_board',{ p_board_id:M48_BOARD_ID }),'m48.column-added');
  assert.equal(loaded?.columns.find((entry)=>entry.id===added)?.position,2); checks += 1;

  await rpc('wm_update_board_column',{ p_column_id:added, p_name:'Quality Gate', p_config:{ options:['A','B'] }, p_visible:true });
  await rpc('wm_set_board_cell',{ p_item_id:'item-a1', p_column_id:added, p_value:'B' });
  loaded=assertBoardEnvelope(await rpc('wm_get_board',{ p_board_id:M48_BOARD_ID }),'m48.cell-set');
  assert.equal(loaded?.values.find((entry)=>entry.item_id==='item-a1' && entry.column_id===added)?.value,'B'); checks += 1;

  const duplicate=await rpc('wm_duplicate_board_column',{ p_column_id:added, p_with_values:true });
  loaded=assertBoardEnvelope(await rpc('wm_get_board',{ p_board_id:M48_BOARD_ID }),'m48.column-duplicated');
  assert.equal(loaded?.values.find((entry)=>entry.item_id==='item-a1' && entry.column_id===duplicate)?.value,'B'); checks += 1;
  await rpc('wm_move_board_column',{ p_column_id:duplicate, p_position:0 });
  loaded=assertBoardEnvelope(await rpc('wm_get_board',{ p_board_id:M48_BOARD_ID }),'m48.column-moved');
  assert.equal(loaded?.columns.find((entry)=>entry.id===duplicate)?.position,0); checks += 1;

  await rpc('wm_change_board_column_type',{ p_column_id:duplicate, p_data_type:'number', p_config:{}, p_clear_values:true });
  loaded=assertBoardEnvelope(await rpc('wm_get_board',{ p_board_id:M48_BOARD_ID }),'m48.column-type');
  assert.equal(loaded?.columns.find((entry)=>entry.id===duplicate)?.data_type,'number'); checks += 1;
  assert.equal(loaded?.values.some((entry)=>entry.column_id===duplicate),false); checks += 1;

  await rpc('wm_set_board_cell',{ p_item_id:'item-a1', p_column_id:'col-status', p_value:'doing' });
  const labels=[
    { id:'todo', name:'Backlog', color:'#7f8a9a', active:true, description:'', position:0 },
    { id:'doing', name:'Doing', color:'#5b7cfa', active:true, description:'', position:1 },
  ];
  await rpc('wm_set_board_status_labels',{ p_column_id:'col-status', p_labels:labels, p_default_label_id:'todo' });
  loaded=assertBoardEnvelope(await rpc('wm_get_board',{ p_board_id:M48_BOARD_ID }),'m48.status-labels');
  assert.equal(loaded?.items.find((entry)=>entry.id==='item-a3')?.status,null); checks += 1;
  assert.equal(loaded?.items.find((entry)=>entry.id==='item-b1')?.status,null); checks += 1;
  assert.equal(loaded?.columns.find((entry)=>entry.id==='col-status')?.config.labels[0].name,'Backlog'); checks += 1;

  await rpc('wm_set_board_preferences',{ p_board_id:M48_BOARD_ID, p_preferences:{ column_widths:{ [added]:240 }, column_filters:{ [added]:'B' }, wrap_columns:[added], sort_column_id:added, sort_direction:'asc' } });
  await rpc('wm_delete_board_column',{ p_column_id:added });
  const prefs=mapBoardPreferences(await rpc('wm_get_board_preferences',{ p_board_id:M48_BOARD_ID }));
  assert.equal(prefs.column_widths?.[added],undefined); checks += 1;
  assert.equal(prefs.column_filters?.[added],undefined); checks += 1;
  assert.equal(prefs.sort_column_id,null); checks += 1;
  assert.equal(prefs.wrap_columns?.includes(added),false); checks += 1;
  pass(fixture.calls('wm_set_board_cell').length >= 2,'fixture must record typed cell persistence calls');
  pass(fixture.calls('wm_set_board_status_labels').length === 1,'fixture must record status lifecycle persistence');
  pass(fixture.calls('wm_delete_board_column').length === 1,'fixture must record column deletion');
}

console.log(`M48 deterministic verification: PASS (${checks} checks)`);
