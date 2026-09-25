import { M39_FIXTURE_ORIGIN } from './m39-auth-fixture.mjs';

const ADMIN_ID = '00000000-0000-4000-8000-000000000039';
const now = () => '2026-09-18T00:00:00.000Z';
const clone = (value) => JSON.parse(JSON.stringify(value));
const json = (route, status, body) => route.fulfill({
  status,
  contentType: 'application/json; charset=utf-8',
  body: JSON.stringify(body),
  headers: { 'access-control-allow-origin': '*' },
});
const error = (route, status, code, message) => json(route, status, { code, message, details: null, hint: null });

const statusColumn = () => ({
  id: 'col-status', board_id: 'board-m47', column_key: 'status', name: 'Status', data_type: 'status', system_key: 'status',
  position: 0, visible: true, required: false,
  config: { labels: [
    { id:'todo', name:'To do', color:'#7f8a9a', active:true, description:'', position:0 },
    { id:'doing', name:'Doing', color:'#5b7cfa', active:true, description:'', position:1 },
    { id:'done_custom', name:'Done', color:'#23b784', active:true, description:'', position:2 },
  ], default_label_id:'todo' }, created_at:now(), updated_at:now(),
});
const textColumn = (index) => ({
  id:`col-text-${index}`, board_id:'board-m47', column_key:`field_${index}`, name:`Field ${index}`, data_type:'text', system_key:null,
  position:index, visible:true, required:false, config:{}, created_at:now(), updated_at:now(),
});
const item = (id, groupId, title, position, status='todo') => ({
  id, board_id:'board-m47', group_id:groupId, title, status, assignee_id:null, due_date:null, notes:'', position,
  archived_at:null, created_at:now(), updated_at:now(),
});

export async function installM47BoardsTableFixture(page, { large = false } = {}) {
  const groups = [
    { id:'group-a', board_id:'board-m47', title:'Planning', accent_color:'#5b7cfa', position:0, created_at:now(), updated_at:now() },
    { id:'group-b', board_id:'board-m47', title:'Delivery', accent_color:'#2f9e73', position:1, created_at:now(), updated_at:now() },
  ];
  const baseItems = large
    ? Array.from({ length: 180 }, (_, index) => item(`item-${index + 1}`, 'group-a', `Item ${String(index + 1).padStart(3,'0')}`, index, index % 3 === 0 ? 'doing' : 'todo'))
    : [item('item-a1','group-a','Alpha',0), item('item-a2','group-a','Bravo',1,'doing'), item('item-a3','group-a','Charlie',2), item('item-b1','group-b','Delta',0)];
  const columns = [statusColumn(), ...(large ? Array.from({ length: 20 }, (_, index) => textColumn(index + 1)) : [textColumn(1), textColumn(2)])];
  const values = large ? baseItems.flatMap((entry) => columns.filter((column) => column.data_type === 'text').map((column) => ({ item_id:entry.id, column_id:column.id, value:`${entry.title} ${column.name}`, updated_at:now() }))) : [];
  const state = {
    board: { id:'board-m47', name:'M47 Recovery Board', description:'Table group item recovery fixture', status:'active', view_mode:'table', member_role:'owner', owner_id:ADMIN_ID, item_count:baseItems.length, created_at:now(), updated_at:now() },
    groups,
    items: baseItems,
    columns,
    values,
    members:[{ board_id:'board-m47', user_id:ADMIN_ID, role:'owner', email:'m47-admin@example.test', display_name:'M47 Admin' }],
    preferences:{ sort_column_id:null, sort_direction:null, column_filters:{}, wrap_columns:[], column_widths:{}, item_name_width:280, collapsed_groups:[] },
    calls:[], nextItem:1000, nextGroup:10,
  };
  const record = (name, body) => state.calls.push({ name, body:clone(body ?? {}) });
  const envelope = () => ({ board:clone(state.board), groups:clone(state.groups), items:clone(state.items), columns:clone(state.columns), values:clone(state.values), members:clone(state.members) });
  const normalize = (groupId) => {
    state.items.filter((entry) => entry.group_id === groupId && !entry.archived_at).sort((a,b) => a.position-b.position || a.id.localeCompare(b.id)).forEach((entry,index) => { entry.position=index; });
  };
  const groupNormalize = () => state.groups.forEach((entry,index) => { entry.position=index; });

  await page.route(`${M39_FIXTURE_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (!path.startsWith('/rest/v1/rpc/wm_')) return route.fallback();
    if (request.method() === 'OPTIONS') return route.fallback();
    let body={}; try { body=request.postDataJSON() ?? {}; } catch {}
    const name=path.split('/').at(-1) ?? '';
    const handled = new Set([
      'wm_list_boards','wm_get_board','wm_get_board_preferences','wm_set_board_preferences','wm_list_board_events',
      'wm_add_board_group','wm_update_board_group','wm_move_board_group','wm_delete_board_group','wm_set_board_group_accent',
      'wm_add_board_item','wm_update_board_item','wm_move_board_item','wm_duplicate_board_item','wm_delete_board_item','wm_set_board_item_archived',
      'wm_get_board_item_workspace','wm_set_board_view','wm_set_board_cell','wm_set_board_cell_if_current',
    ]);
    if (!handled.has(name)) return route.fallback();
    record(name, body);

    if (name === 'wm_list_boards') return json(route,200,[{ ...clone(state.board), item_count:state.items.filter((entry)=>!entry.archived_at).length }]);
    if (name === 'wm_get_board') return json(route,200,String(body.p_board_id)==='board-m47' ? envelope() : null);
    if (name === 'wm_get_board_preferences') return json(route,200,clone(state.preferences));
    if (name === 'wm_set_board_preferences') { state.preferences={ ...state.preferences, ...clone(body.p_preferences ?? {}) }; return json(route,200,clone(state.preferences)); }
    if (name === 'wm_list_board_events') return json(route,200,[]);
    if (name === 'wm_set_board_view') { state.board.view_mode=String(body.p_view || 'table'); return json(route,200,null); }
    if (name === 'wm_get_board_item_workspace') {
      const current=state.items.find((entry)=>entry.id===String(body.p_item_id));
      if (!current) return error(route,404,'M47_ITEM_NOT_FOUND','Item not found');
      return json(route,200,{ item:clone(current), permissions:{ can_edit:true, can_comment:true, can_attach:true, can_manage:true }, updates:[], files:[], activity:[] });
    }
    if (name === 'wm_add_board_group') {
      const id=`group-${state.nextGroup++}`;
      state.groups.push({ id, board_id:'board-m47', title:String(body.p_title || '').trim(), accent_color:'#65758b', position:state.groups.length, created_at:now(), updated_at:now() });
      return json(route,200,id);
    }
    if (name === 'wm_update_board_group') { const g=state.groups.find((entry)=>entry.id===String(body.p_group_id)); if(g)g.title=String(body.p_title || '').trim(); return json(route,200,null); }
    if (name === 'wm_set_board_group_accent') { const g=state.groups.find((entry)=>entry.id===String(body.p_group_id)); if(g)g.accent_color=String(body.p_accent_color || '#65758b'); return json(route,200,null); }
    if (name === 'wm_move_board_group') {
      const g=state.groups.find((entry)=>entry.id===String(body.p_group_id)); if(!g)return error(route,404,'M47_GROUP_NOT_FOUND','Group not found');
      state.groups=state.groups.filter((entry)=>entry!==g); const target=Math.max(0,Math.min(Number(body.p_position)||0,state.groups.length)); state.groups.splice(target,0,g); groupNormalize(); return json(route,200,null);
    }
    if (name === 'wm_delete_board_group') {
      const gid=String(body.p_group_id); if(state.groups.length<=1)return error(route,400,'M47_LAST_GROUP','A board must keep at least one group');
      state.groups=state.groups.filter((entry)=>entry.id!==gid); state.items=state.items.filter((entry)=>entry.group_id!==gid); groupNormalize(); return json(route,200,null);
    }
    if (name === 'wm_add_board_item') {
      const gid=String(body.p_group_id); const active=state.items.filter((entry)=>entry.group_id===gid && !entry.archived_at); const id=`item-new-${state.nextItem++}`;
      state.items.push(item(id,gid,String(body.p_title || '').trim(),active.length,'todo')); return json(route,200,id);
    }
    if (name === 'wm_update_board_item') {
      const current=state.items.find((entry)=>entry.id===String(body.p_item_id)); if(!current)return error(route,404,'M47_ITEM_NOT_FOUND','Item not found');
      current.title=String(body.p_title ?? current.title); current.status=body.p_status===''?null:(body.p_status ?? current.status); current.assignee_id=body.p_assignee_id ?? null; current.due_date=body.p_due_date ?? null; current.notes=String(body.p_notes ?? ''); return json(route,200,null);
    }
    if (name === 'wm_move_board_item') {
      const current=state.items.find((entry)=>entry.id===String(body.p_item_id)); if(!current)return error(route,404,'M47_ITEM_NOT_FOUND','Item not found');
      if(current.archived_at)return error(route,400,'M47_ARCHIVED_MOVE','Restore the item before moving it');
      const source=current.group_id; state.items.filter((entry)=>entry.group_id===source && !entry.archived_at && entry!==current && entry.position>current.position).forEach((entry)=>entry.position-=1);
      current.group_id=String(body.p_group_id); const peers=state.items.filter((entry)=>entry.group_id===current.group_id && !entry.archived_at && entry!==current).sort((a,b)=>a.position-b.position); const target=Math.max(0,Math.min(Number(body.p_position) || 0,peers.length)); peers.filter((entry)=>entry.position>=target).forEach((entry)=>entry.position+=1); current.position=target; if(body.p_status!==null&&body.p_status!==undefined)current.status=body.p_status===''?null:String(body.p_status); normalize(source); normalize(current.group_id); return json(route,200,null);
    }
    if (name === 'wm_duplicate_board_item') {
      const src=state.items.find((entry)=>entry.id===String(body.p_item_id)); if(!src)return error(route,404,'M47_ITEM_NOT_FOUND','Item not found'); const id=`item-new-${state.nextItem++}`; const peers=state.items.filter((entry)=>entry.group_id===src.group_id&&!entry.archived_at); const pos=src.archived_at?peers.length:src.position+1; peers.filter((entry)=>entry.position>=pos).forEach((entry)=>entry.position+=1); state.items.push({ ...clone(src), id, title:`${src.title} copy`, position:pos, archived_at:null }); normalize(src.group_id); return json(route,200,id);
    }
    if (name === 'wm_delete_board_item') { const id=String(body.p_item_id); const current=state.items.find((entry)=>entry.id===id); if(current){state.items=state.items.filter((entry)=>entry.id!==id); if(!current.archived_at)normalize(current.group_id);} return json(route,200,null); }
    if (name === 'wm_set_board_item_archived') {
      const current=state.items.find((entry)=>entry.id===String(body.p_item_id)); if(!current)return error(route,404,'M47_ITEM_NOT_FOUND','Item not found'); const archive=Boolean(body.p_archived);
      if(archive&&!current.archived_at){current.archived_at=now(); normalize(current.group_id);} else if(!archive&&current.archived_at){current.archived_at=null; current.position=state.items.filter((entry)=>entry.group_id===current.group_id&&!entry.archived_at&&entry!==current).length; normalize(current.group_id);} return json(route,200,null);
    }
    if (name === 'wm_set_board_cell' || name === 'wm_set_board_cell_if_current') {
      const itemId=String(body.p_item_id); const current=state.items.find((entry)=>entry.id===itemId);
      if(!current)return error(route,404,'M47_ITEM_NOT_FOUND','Item not found');
      const columnId=body.p_column_id == null ? null : String(body.p_column_id);
      const currentColumn=columnId == null ? null : state.columns.find((entry)=>entry.id===columnId);
      if(columnId != null && !currentColumn)return error(route,404,'M47_COLUMN_NOT_FOUND','Column not found');
      const existing=columnId == null || currentColumn?.system_key ? null : state.values.find((entry)=>entry.item_id===itemId&&entry.column_id===columnId);
      const currentValue=columnId == null ? current.title
        : currentColumn?.system_key === 'status' ? current.status
        : currentColumn?.system_key === 'assignee' ? current.assignee_id
        : currentColumn?.system_key === 'due_date' ? current.due_date
        : currentColumn?.system_key === 'notes' ? current.notes
        : existing?.value ?? null;
      if(name === 'wm_set_board_cell_if_current' && JSON.stringify(currentValue ?? null) !== JSON.stringify(body.p_expected_value ?? null)) return error(route,409,'WM_BOARD_CELL_CONFLICT','Cell changed since it was loaded');
      const next=body.p_value === '' ? null : clone(body.p_value);
      if(columnId == null) current.title=String(next ?? '');
      else if(currentColumn?.system_key === 'status') current.status=next == null ? null : String(next);
      else if(currentColumn?.system_key === 'assignee') current.assignee_id=next == null ? null : String(next);
      else if(currentColumn?.system_key === 'due_date') current.due_date=next == null ? null : String(next);
      else if(currentColumn?.system_key === 'notes') current.notes=next == null ? '' : String(next);
      else if(next == null && existing) state.values=state.values.filter((entry)=>entry!==existing);
      else if(existing) existing.value=next;
      else if(next != null) state.values.push({ item_id:itemId,column_id:columnId,value:next,updated_at:now() });
      return json(route,200,null);
    }
    return route.fallback();
  });

  return Object.freeze({
    snapshot:()=>clone(state),
    calls:(name)=>clone(state.calls.filter((entry)=>!name||entry.name===name)),
  });
}
