import { M39_FIXTURE_ORIGIN } from './m39-auth-fixture.mjs';

export const M49_BOARD_ID = 'board-m49';
export const M49_ADMIN_ID = '00000000-0000-4000-8000-000000000039';
const now = () => '2026-09-21T00:00:00.000Z';
const clone = (value) => JSON.parse(JSON.stringify(value));
const json = (route, status, body) => route.fulfill({
  status,
  contentType: 'application/json; charset=utf-8',
  body: JSON.stringify(body),
  headers: { 'access-control-allow-origin': '*' },
});
const error = (route, status, code, message) => json(route, status, { code, message, details:null, hint:null });

const statusColumn = () => ({
  id:'col-status', board_id:M49_BOARD_ID, column_key:'status', name:'Status', data_type:'status', system_key:'status',
  position:0, visible:true, required:false,
  config:{ labels:[
    { id:'todo', name:'To do', color:'#7f8a9a', active:true, description:'', position:0 },
    { id:'doing', name:'Doing', color:'#5b7cfa', active:true, description:'', position:1 },
    { id:'legacy', name:'Legacy', color:'#d9a227', active:false, description:'Retained inactive status', position:2 },
    { id:'done_custom', name:'Done', color:'#23b784', active:true, description:'', position:3 },
  ], default_label_id:'todo' }, created_at:now(), updated_at:now(),
});
const textColumn = (id, name, position) => ({
  id, board_id:M49_BOARD_ID, column_key:id, name, data_type:'text', system_key:null,
  position, visible:true, required:false, config:{}, created_at:now(), updated_at:now(),
});
const item = (id, groupId, title, position, status='todo') => ({
  id, board_id:M49_BOARD_ID, group_id:groupId, title, status, assignee_id:null, due_date:null, notes:'', position,
  archived_at:null, created_at:now(), updated_at:now(),
});

export async function installM49BoardsKanbanFixture(page) {
  const state = {
    board:{ id:M49_BOARD_ID, name:'M49 Kanban Recovery Board', description:'Kanban and drag/drop recovery fixture', status:'active', view_mode:'table', member_role:'owner', owner_id:M49_ADMIN_ID, item_count:4, created_at:now(), updated_at:now() },
    groups:[
      { id:'group-a', board_id:M49_BOARD_ID, title:'Planning', accent_color:'#5b7cfa', position:0, created_at:now(), updated_at:now() },
      { id:'group-b', board_id:M49_BOARD_ID, title:'Delivery', accent_color:'#2f9e73', position:1, created_at:now(), updated_at:now() },
    ],
    items:[
      item('item-a1','group-a','Alpha',0,'todo'),
      item('item-a2','group-a','Bravo',1,'doing'),
      item('item-a3','group-a','Charlie',2,'legacy'),
      item('item-b1','group-b','Delta',0,'todo'),
    ],
    columns:[statusColumn(), textColumn('col-text-1','Field 1',1), textColumn('col-text-2','Field 2',2)],
    values:[],
    members:[{ board_id:M49_BOARD_ID, user_id:M49_ADMIN_ID, role:'owner', email:'m49-admin@example.test', display_name:'M49 Admin' }],
    preferences:{ sort_column_id:null, sort_direction:null, column_filters:{}, wrap_columns:[], column_widths:{}, item_name_width:280, collapsed_groups:[] },
    calls:[],
    failures:{},
  };
  const holds = new Map();
  const record = (name, body) => state.calls.push({ name, body:clone(body ?? {}) });
  const envelope = () => ({ board:clone(state.board), groups:clone(state.groups), items:clone(state.items), columns:clone(state.columns), values:clone(state.values), members:clone(state.members) });
  const normalizeItems = (groupId) => state.items
    .filter((entry) => entry.group_id === groupId && !entry.archived_at)
    .sort((a,b) => a.position-b.position || a.id.localeCompare(b.id))
    .forEach((entry,index) => { entry.position=index; });
  const normalizeGroups = () => state.groups.forEach((entry,index) => { entry.position=index; });
  const normalizeColumns = () => state.columns.forEach((entry,index) => { entry.position=index; });
  const consumeFault = async (name, route) => {
    const hold = holds.get(name);
    if (hold) { holds.delete(name); await hold.promise; }
    const fault = state.failures[name];
    if (!fault || fault.count <= 0) return false;
    fault.count -= 1;
    await error(route, fault.status || 500, 'M49_FORCED_FAILURE', fault.message || `Forced ${name} failure`);
    return true;
  };

  await page.route(`${M39_FIXTURE_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!url.pathname.startsWith('/rest/v1/rpc/wm_')) return route.fallback();
    if (request.method() === 'OPTIONS') return route.fallback();
    let body={}; try { body=request.postDataJSON() ?? {}; } catch {}
    const name=url.pathname.split('/').at(-1) ?? '';
    const handled=new Set([
      'wm_list_boards','wm_get_board','wm_get_board_preferences','wm_set_board_preferences','wm_list_board_events','wm_get_board_item_workspace',
      'wm_set_board_view','wm_move_board_item','wm_move_board_group','wm_move_board_column','wm_set_board_cell',
    ]);
    if (!handled.has(name)) return route.fallback();
    record(name, body);
    if (await consumeFault(name, route)) return;

    if (name === 'wm_list_boards') return json(route,200,[{ ...clone(state.board), item_count:state.items.filter((entry)=>!entry.archived_at).length }]);
    if (name === 'wm_get_board') return json(route,200,String(body.p_board_id)===M49_BOARD_ID ? envelope() : null);
    if (name === 'wm_get_board_preferences') return json(route,200,clone(state.preferences));
    if (name === 'wm_set_board_preferences') { state.preferences={ ...state.preferences, ...clone(body.p_preferences ?? {}) }; return json(route,200,clone(state.preferences)); }
    if (name === 'wm_list_board_events') return json(route,200,[]);
    if (name === 'wm_get_board_item_workspace') {
      const current=state.items.find((entry)=>entry.id===String(body.p_item_id));
      if (!current) return error(route,404,'M49_ITEM_NOT_FOUND','Item not found');
      return json(route,200,{ item:clone(current), updates:[], files:[], activity:[] });
    }
    if (name === 'wm_set_board_view') { state.board.view_mode=String(body.p_view || 'table'); return json(route,200,null); }
    if (name === 'wm_move_board_group') {
      const current=state.groups.find((entry)=>entry.id===String(body.p_group_id));
      if (!current) return error(route,404,'M49_GROUP_NOT_FOUND','Group not found');
      state.groups=state.groups.filter((entry)=>entry!==current);
      const target=Math.max(0,Math.min(Number(body.p_position)||0,state.groups.length));
      state.groups.splice(target,0,current); normalizeGroups(); return json(route,200,null);
    }
    if (name === 'wm_move_board_column') {
      const current=state.columns.find((entry)=>entry.id===String(body.p_column_id));
      if (!current) return error(route,404,'M49_COLUMN_NOT_FOUND','Column not found');
      state.columns=state.columns.filter((entry)=>entry!==current);
      const target=Math.max(0,Math.min(Number(body.p_position)||0,state.columns.length));
      state.columns.splice(target,0,current); normalizeColumns(); return json(route,200,null);
    }
    if (name === 'wm_move_board_item') {
      const current=state.items.find((entry)=>entry.id===String(body.p_item_id));
      if (!current) return error(route,404,'M49_ITEM_NOT_FOUND','Item not found');
      if (current.archived_at) return error(route,400,'M49_ARCHIVED_MOVE','Restore the item before moving it');
      const source=current.group_id;
      state.items.filter((entry)=>entry.group_id===source && !entry.archived_at && entry!==current && entry.position>current.position).forEach((entry)=>{entry.position-=1;});
      current.group_id=String(body.p_group_id);
      const peers=state.items.filter((entry)=>entry.group_id===current.group_id && !entry.archived_at && entry!==current).sort((a,b)=>a.position-b.position || a.id.localeCompare(b.id));
      const target=Math.max(0,Math.min(Number(body.p_position)||0,peers.length));
      peers.filter((entry)=>entry.position>=target).forEach((entry)=>{entry.position+=1;});
      current.position=target;
      if (body.p_status !== null && body.p_status !== undefined) current.status=body.p_status===''?null:String(body.p_status);
      normalizeItems(source); normalizeItems(current.group_id); return json(route,200,null);
    }
    if (name === 'wm_set_board_cell') return json(route,200,null);
    return route.fallback();
  });

  return Object.freeze({
    snapshot:()=>clone(state),
    calls:(name)=>clone(state.calls.filter((entry)=>!name || entry.name===name)),
    resetCalls:()=>{ state.calls.length=0; },
    failNext:(name,{ count=1, status=500, message=`Forced ${name} failure` }={})=>{ state.failures[name]={ count, status, message }; },
    holdNext:(name)=>{
      if (holds.has(name)) throw new Error(`A held ${name} request is already pending.`);
      let release=()=>undefined;
      const promise=new Promise((resolve)=>{ release=resolve; });
      holds.set(name,{ promise });
      return ()=>{ release(); };
    },
  });
}
