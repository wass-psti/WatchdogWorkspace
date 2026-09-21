import { M39_FIXTURE_ORIGIN } from './m39-auth-fixture.mjs';

export const M48_BOARD_ID = 'board-m48';
export const M48_ADMIN_ID = '00000000-0000-4000-8000-000000000039';
export const M48_MEMBER_ID = '00000000-0000-4000-8000-000000000048';
const now = () => '2026-09-20T00:00:00.000Z';
const clone = (value) => JSON.parse(JSON.stringify(value));
const json = (route, status, body) => route.fulfill({
  status,
  contentType: 'application/json; charset=utf-8',
  body: JSON.stringify(body),
  headers: { 'access-control-allow-origin': '*' },
});
const error = (route, status, code, message) => json(route, status, { code, message, details: null, hint: null });

const statusLabels = () => [
  { id:'todo', name:'To do', color:'#7f8a9a', active:true, description:'Ready to start', position:0 },
  { id:'doing', name:'Doing', color:'#5b7cfa', active:true, description:'Work in progress', position:1 },
  { id:'blocked', name:'Blocked', color:'#e64f70', active:true, description:'Needs attention', position:2 },
  { id:'done_custom', name:'Done', color:'#23b784', active:true, description:'Completed', position:3 },
];

const column = (id, name, dataType, position, { systemKey = null, config = {}, visible = true } = {}) => ({
  id, board_id:M48_BOARD_ID, column_key:systemKey || `custom:${id}`, name, data_type:dataType, system_key:systemKey,
  position, visible, required:false, config:clone(config), created_at:now(), updated_at:now(),
});
const item = (id, groupId, title, position, status='todo') => ({
  id, board_id:M48_BOARD_ID, group_id:groupId, title, status, assignee_id:null, due_date:null, notes:'', position,
  archived_at:null, created_at:now(), updated_at:now(),
});
const value = (itemId, columnId, cellValue) => ({ item_id:itemId, column_id:columnId, value:clone(cellValue), updated_at:now() });

const normalizeDropdownConfig = (config = {}) => {
  const raw = Array.isArray(config?.options) && config.options.length ? config.options : ['Option 1','Option 2'];
  const options = raw.map((entry) => String(entry).trim()).filter(Boolean);
  return { options };
};
const normalizeStatusConfig = (config = {}) => {
  const raw = Array.isArray(config?.labels) && config.labels.length ? config.labels : statusLabels();
  const labels = raw.map((entry, position) => ({
    id:String(entry.id), name:String(entry.name), color:String(entry.color || '#7f8a9a').toLowerCase(),
    active:entry.active !== false, description:String(entry.description || ''), position,
  }));
  const requested = String(config?.default_label_id || '');
  const default_label_id = labels.some((entry) => entry.id === requested && entry.active)
    ? requested
    : labels.find((entry) => entry.active)?.id ?? null;
  return { labels, default_label_id };
};
const normalizeConfig = (type, config = {}) => type === 'status'
  ? normalizeStatusConfig(config)
  : type === 'dropdown'
    ? normalizeDropdownConfig(config)
    : {};

export async function installM48BoardsColumnsFixture(page) {
  const groups = [
    { id:'group-a', board_id:M48_BOARD_ID, title:'Planning', accent_color:'#5b7cfa', position:0, created_at:now(), updated_at:now() },
    { id:'group-b', board_id:M48_BOARD_ID, title:'Delivery', accent_color:'#2f9e73', position:1, created_at:now(), updated_at:now() },
  ];
  const items = [
    item('item-a1','group-a','Alpha',0,'todo'),
    item('item-a2','group-a','Bravo',1,'doing'),
    item('item-a3','group-a','Charlie',2,'blocked'),
    item('item-b1','group-b','Delta',0,'done_custom'),
  ];
  items[0].assignee_id = M48_MEMBER_ID;
  items[0].due_date = '2026-10-01';
  items[1].assignee_id = M48_ADMIN_ID;
  items[1].due_date = '2026-09-30';

  const columns = [
    column('col-status','Status','status',0,{ systemKey:'status', config:{ labels:statusLabels(), default_label_id:'todo' } }),
    column('col-text','Notes','text',1),
    column('col-person','Owner','people',2),
    column('col-date','Target date','date',3),
    column('col-dropdown','Priority','dropdown',4,{ config:{ options:['Low','Low priority','Medium','High'] } }),
    column('col-number','Estimate','number',5),
  ];
  const values = [
    value('item-a1','col-text','Alpha note'), value('item-a2','col-text','Bravo note'), value('item-b1','col-text','Delta note'),
    value('item-a1','col-person',M48_MEMBER_ID), value('item-a2','col-person',M48_ADMIN_ID),
    value('item-a1','col-date','2026-10-01'), value('item-a2','col-date','2026-09-30'), value('item-b1','col-date','2026-11-15'),
    value('item-a1','col-dropdown','Low'), value('item-a2','col-dropdown','Low priority'), value('item-b1','col-dropdown','High'),
    value('item-a1','col-number',10), value('item-a2','col-number',20), value('item-b1','col-number',5),
  ];

  const state = {
    board:{ id:M48_BOARD_ID, name:'M48 Columns Recovery Board', description:'Columns, cells, and status recovery fixture', status:'active', view_mode:'table', member_role:'owner', owner_id:M48_ADMIN_ID, item_count:items.length, created_at:now(), updated_at:now() },
    groups, items, columns, values,
    members:[
      { board_id:M48_BOARD_ID, user_id:M48_ADMIN_ID, role:'owner', email:'m48-admin@example.test', display_name:'M48 Admin' },
      { board_id:M48_BOARD_ID, user_id:M48_MEMBER_ID, role:'editor', email:'alex@example.test', display_name:'Alex Operator' },
    ],
    preferences:{ sort_column_id:null, sort_direction:null, column_filters:{}, wrap_columns:[], column_widths:{}, item_name_width:280, collapsed_groups:[] },
    calls:[], nextColumn:100,
  };

  const record = (name, body) => state.calls.push({ name, body:clone(body ?? {}) });
  const envelope = () => ({ board:clone(state.board), groups:clone(state.groups), items:clone(state.items), columns:clone(state.columns), values:clone(state.values), members:clone(state.members) });
  const normalizeColumns = () => state.columns.sort((a,b) => a.position-b.position || a.id.localeCompare(b.id)).forEach((entry,index) => { entry.position=index; });
  const findColumn = (id) => state.columns.find((entry) => entry.id === String(id));
  const findItem = (id) => state.items.find((entry) => entry.id === String(id));
  const customValueIndex = (itemId, columnId) => state.values.findIndex((entry) => entry.item_id === itemId && entry.column_id === columnId);
  const uniqueName = (base) => {
    let name = `${base} copy`;
    let suffix = 2;
    const used = new Set(state.columns.map((entry) => entry.name.toLowerCase()));
    while (used.has(name.toLowerCase())) name = `${base} copy ${suffix++}`;
    return name;
  };

  await page.route(`${M39_FIXTURE_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!url.pathname.startsWith('/rest/v1/rpc/wm_')) return route.fallback();
    if (request.method() === 'OPTIONS') return route.fallback();
    let body = {};
    try { body = request.postDataJSON() ?? {}; } catch { body = {}; }
    const name = url.pathname.split('/').at(-1) ?? '';
    const handled = new Set([
      'wm_list_boards','wm_get_board','wm_get_board_preferences','wm_set_board_preferences','wm_list_board_events','wm_set_board_view',
      'wm_add_board_column','wm_add_board_column_at','wm_update_board_column','wm_move_board_column','wm_delete_board_column',
      'wm_duplicate_board_column','wm_change_board_column_type','wm_set_board_status_labels','wm_set_board_cell',
    ]);
    if (!handled.has(name)) return route.fallback();
    record(name, body);

    if (name === 'wm_list_boards') return json(route,200,[clone(state.board)]);
    if (name === 'wm_get_board') return json(route,200,String(body.p_board_id) === M48_BOARD_ID ? envelope() : null);
    if (name === 'wm_get_board_preferences') return json(route,200,clone(state.preferences));
    if (name === 'wm_set_board_preferences') { state.preferences={ ...state.preferences, ...clone(body.p_preferences ?? {}) }; return json(route,200,clone(state.preferences)); }
    if (name === 'wm_list_board_events') return json(route,200,[]);
    if (name === 'wm_set_board_view') { state.board.view_mode=String(body.p_view || 'table'); return json(route,200,null); }

    if (name === 'wm_add_board_column' || name === 'wm_add_board_column_at') {
      const type = String(body.p_data_type || 'text');
      const id = `col-new-${state.nextColumn++}`;
      const target = name === 'wm_add_board_column_at'
        ? Math.max(0, Math.min(Number(body.p_position) || 0, state.columns.length))
        : state.columns.length;
      state.columns.filter((entry) => entry.position >= target).forEach((entry) => { entry.position += 1; });
      state.columns.push(column(id,String(body.p_name || '').trim(),type,target,{ config:normalizeConfig(type,body.p_config ?? {}) }));
      normalizeColumns();
      return json(route,200,id);
    }
    if (name === 'wm_update_board_column') {
      const current = findColumn(body.p_column_id);
      if (!current) return error(route,404,'M48_COLUMN_NOT_FOUND','Column not found');
      current.name=String(body.p_name || '').trim();
      current.visible=Boolean(body.p_visible);
      if (!current.system_key || current.data_type !== 'status') current.config=normalizeConfig(current.data_type,body.p_config ?? {});
      current.updated_at=now();
      return json(route,200,null);
    }
    if (name === 'wm_move_board_column') {
      const current = findColumn(body.p_column_id);
      if (!current) return error(route,404,'M48_COLUMN_NOT_FOUND','Column not found');
      const ordered = [...state.columns].sort((a,b)=>a.position-b.position).filter((entry)=>entry !== current);
      const target = Math.max(0, Math.min(Number(body.p_position) || 0, ordered.length));
      ordered.splice(target,0,current);
      state.columns=ordered;
      state.columns.forEach((entry,index) => { entry.position=index; });
      return json(route,200,null);
    }
    if (name === 'wm_delete_board_column') {
      const id = String(body.p_column_id);
      const current = findColumn(id);
      if (!current) return error(route,404,'M48_COLUMN_NOT_FOUND','Column not found');
      state.columns=state.columns.filter((entry)=>entry.id !== id);
      state.values=state.values.filter((entry)=>entry.column_id !== id);
      const widths={ ...(state.preferences.column_widths || {}) }; delete widths[id];
      const filters={ ...(state.preferences.column_filters || {}) }; delete filters[id];
      state.preferences={ ...state.preferences, column_widths:widths, column_filters:filters, wrap_columns:(state.preferences.wrap_columns || []).filter((entry)=>entry !== id), sort_column_id:state.preferences.sort_column_id === id ? null : state.preferences.sort_column_id, sort_direction:state.preferences.sort_column_id === id ? null : state.preferences.sort_direction };
      normalizeColumns();
      return json(route,200,null);
    }
    if (name === 'wm_duplicate_board_column') {
      const source = findColumn(body.p_column_id);
      if (!source) return error(route,404,'M48_COLUMN_NOT_FOUND','Column not found');
      const id=`col-new-${state.nextColumn++}`;
      const target=source.position+1;
      state.columns.filter((entry)=>entry.position>=target).forEach((entry)=>{entry.position+=1;});
      state.columns.push(column(id,uniqueName(source.name),source.data_type,target,{ config:source.config, visible:source.visible }));
      if (Boolean(body.p_with_values)) {
        state.values.filter((entry)=>entry.column_id===source.id).forEach((entry)=>state.values.push(value(entry.item_id,id,entry.value)));
      }
      normalizeColumns();
      return json(route,200,id);
    }
    if (name === 'wm_change_board_column_type') {
      const current = findColumn(body.p_column_id);
      if (!current || current.system_key) return error(route,400,'M48_COLUMN_TYPE','Column type cannot be changed');
      if (Boolean(body.p_clear_values)) state.values=state.values.filter((entry)=>entry.column_id !== current.id);
      current.data_type=String(body.p_data_type || 'text');
      current.config=normalizeConfig(current.data_type,body.p_config ?? {});
      current.updated_at=now();
      return json(route,200,null);
    }
    if (name === 'wm_set_board_status_labels') {
      const current=findColumn(body.p_column_id);
      if (!current || current.data_type !== 'status') return error(route,400,'M48_STATUS_COLUMN','Status column not found');
      const config=normalizeStatusConfig({ labels:body.p_labels, default_label_id:body.p_default_label_id });
      const ids=new Set(config.labels.map((entry)=>entry.id));
      if (current.system_key === 'status') state.items.forEach((entry)=>{ if (entry.status != null && !ids.has(String(entry.status))) entry.status=null; });
      else state.values=state.values.filter((entry)=>entry.column_id !== current.id || entry.value == null || ids.has(String(entry.value)));
      current.config=config;
      current.updated_at=now();
      return json(route,200,clone(config));
    }
    if (name === 'wm_set_board_cell') {
      const current=findItem(body.p_item_id);
      const currentColumn=findColumn(body.p_column_id);
      if (!current || !currentColumn) return error(route,404,'M48_CELL_NOT_FOUND','Item or column not found');
      const next=body.p_value === '' ? null : clone(body.p_value);
      if (currentColumn.system_key === 'title') current.title=String(next || '');
      else if (currentColumn.system_key === 'status') current.status=next == null ? null : String(next);
      else if (currentColumn.system_key === 'assignee') current.assignee_id=next == null ? null : String(next);
      else if (currentColumn.system_key === 'due_date') current.due_date=next == null ? null : String(next);
      else if (currentColumn.system_key === 'notes') current.notes=next == null ? '' : String(next);
      else {
        const index=customValueIndex(current.id,currentColumn.id);
        if (next == null) { if (index >= 0) state.values.splice(index,1); }
        else if (index >= 0) state.values[index]={ ...state.values[index], value:next, updated_at:now() };
        else state.values.push(value(current.id,currentColumn.id,next));
      }
      return json(route,200,null);
    }
    return route.fallback();
  });

  return Object.freeze({
    snapshot:()=>clone(state),
    calls:(name)=>clone(state.calls.filter((entry)=>!name || entry.name===name)),
  });
}
