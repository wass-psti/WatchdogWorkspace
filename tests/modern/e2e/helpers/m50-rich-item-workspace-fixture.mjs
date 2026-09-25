import { M39_FIXTURE_ORIGIN } from './m39-auth-fixture.mjs';
import { installM49BoardsKanbanFixture, M49_BOARD_ID } from './m49-boards-kanban-fixture.mjs';

const clone = (value) => JSON.parse(JSON.stringify(value));
const json = (route, status, body) => route.fulfill({
  status,
  contentType: 'application/json; charset=utf-8',
  body: JSON.stringify(body),
  headers: { 'access-control-allow-origin': '*' },
});

export async function installM50RichItemWorkspaceFixture(page, { role = 'owner' } = {}) {
  const base = await installM49BoardsKanbanFixture(page);
  const board = base.snapshot();
  board.board.member_role = role;
  board.members = board.members.map((member) => ({ ...member, role }));

  const systemColumnStamp = String(board.board.updated_at || board.board.created_at || '2026-09-21T00:00:00.000Z');
  const requiredSystemColumns = [
    { id:'col-title', column_key:'title', name:'Item', data_type:'text', system_key:'title', visible:true },
    { id:'col-status', column_key:'status', name:'Status', data_type:'status', system_key:'status', visible:true },
    { id:'col-assignee', column_key:'assignee', name:'Assignee', data_type:'people', system_key:'assignee', visible:true },
    { id:'col-due-date', column_key:'due_date', name:'Due date', data_type:'date', system_key:'due_date', visible:true },
    { id:'col-notes', column_key:'notes', name:'Notes', data_type:'text', system_key:'notes', visible:true },
  ];
  for (const definition of requiredSystemColumns) {
    if (board.columns.some((entry) => entry.system_key === definition.system_key)) continue;
    board.columns.push({
      ...definition,
      board_id: M49_BOARD_ID,
      position: board.columns.length,
      required: false,
      config: {},
      created_at: systemColumnStamp,
      updated_at: systemColumnStamp,
    });
  }
  board.columns.forEach((entry, position) => { entry.position = position; });

  const updates = [];
  const files = [];
  const activity = [];
  const storage = new Map();
  const calls = [];
  let updateSeq = 1;
  let fileSeq = 1;
  let failRegistrationResponses = 0;
  let failStorageDelete = 0;

  const canEdit = () => role === 'owner' || role === 'editor';
  const canManage = () => role === 'owner';
  const workspace = (itemId) => ({
    permissions: {
      can_edit: canEdit(),
      can_comment: canEdit(),
      can_attach: canEdit(),
      can_manage: canManage(),
    },
    updates: clone(updates.filter((entry) => entry.item_id === itemId)),
    files: clone(files.filter((entry) => entry.item_id === itemId)),
    activity: clone(activity.filter((entry) => entry.item_id === itemId)),
  });

  await page.route(`${M39_FIXTURE_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    let body = {};
    try { body = request.postDataJSON() ?? {}; } catch {}

    if (url.pathname === '/rest/v1/rpc/wm_get_board') {
      return json(route, 200, {
        board: clone(board.board),
        groups: clone(board.groups),
        items: clone(board.items),
        columns: clone(board.columns),
        values: clone(board.values),
        members: clone(board.members),
      });
    }

    if (url.pathname === '/rest/v1/rpc/wm_get_board_item_workspace') {
      calls.push({ name: 'wm_get_board_item_workspace', body: clone(body) });
      return json(route, 200, workspace(String(body.p_item_id)));
    }

    if (url.pathname === '/rest/v1/rpc/wm_set_board_cell' || url.pathname === '/rest/v1/rpc/wm_set_board_cell_if_current') {
      if (!canEdit()) return json(route, 403, { code: '42501', message: 'Board edit access denied' });
      const name = url.pathname.split('/').pop();
      const item = board.items.find((entry) => entry.id === String(body.p_item_id));
      if (!item) return json(route, 404, { code: 'M50_ITEM_NOT_FOUND', message: 'Board item not found' });
      const columnId = body.p_column_id == null ? null : String(body.p_column_id);
      const column = columnId == null ? null : board.columns.find((entry) => entry.id === columnId);
      if (columnId != null && !column) return json(route, 404, { code: 'M50_COLUMN_NOT_FOUND', message: 'Board column not found' });
      const existing = columnId == null || column?.system_key ? null : board.values.find((entry) => String(entry.item_id) === String(item.id) && String(entry.column_id) === columnId);
      const currentValue = columnId == null ? item.title
        : column?.system_key === 'title' ? item.title
        : column?.system_key === 'status' ? item.status
        : column?.system_key === 'assignee' ? item.assignee_id
        : column?.system_key === 'due_date' ? item.due_date
        : column?.system_key === 'notes' ? item.notes
        : existing?.value ?? null;
      if (name === 'wm_set_board_cell_if_current' && JSON.stringify(currentValue ?? null) !== JSON.stringify(body.p_expected_value ?? null)) {
        return json(route, 409, { code: 'WM_BOARD_CELL_CONFLICT', message: 'Cell changed since it was loaded' });
      }
      const next = body.p_value ?? null;
      if (columnId == null || column?.system_key === 'title') item.title = String(next ?? '');
      else if (column?.system_key === 'status') item.status = next == null ? null : String(next);
      else if (column?.system_key === 'assignee') item.assignee_id = next == null ? null : String(next);
      else if (column?.system_key === 'due_date') item.due_date = next == null ? null : String(next);
      else if (column?.system_key === 'notes') item.notes = next == null ? '' : String(next);
      else if (existing) existing.value = next;
      else if (next != null) board.values.push({ item_id: item.id, column_id: columnId, value: next, updated_at: new Date().toISOString() });
      activity.unshift({
        id: String(activity.length + 1),
        item_id: item.id,
        event_type: 'item.updated',
        message: 'Item updated',
        payload: { column_id: columnId },
        created_at: new Date().toISOString(),
        actor_name: 'M50 User',
      });
      calls.push({ name, body: clone(body) });
      return json(route, 200, null);
    }

    if (url.pathname === '/rest/v1/rpc/wm_add_board_item_update') {
      if (!canEdit()) return json(route, 403, { code: '42501', message: 'Board edit access denied' });
      const itemId = String(body.p_item_id);
      const id = String(updateSeq++);
      updates.unshift({
        id,
        item_id: itemId,
        body: String(body.p_body),
        created_by: 'u1',
        author_id: 'u1',
        author_name: 'M50 User',
        created_at: new Date().toISOString(),
        can_delete: true,
      });
      activity.unshift({
        id: `a${activity.length + 1}`,
        item_id: itemId,
        event_type: 'item.update_added',
        message: 'Update posted',
        payload: { update_id: id },
        created_at: new Date().toISOString(),
        actor_name: 'M50 User',
      });
      calls.push({ name: 'wm_add_board_item_update', body: clone(body) });
      return json(route, 200, Number(id));
    }

    if (url.pathname === '/rest/v1/rpc/wm_delete_board_item_update') {
      if (!canEdit()) return json(route, 403, { code: '42501', message: 'Board edit access denied' });
      const index = updates.findIndex((entry) => String(entry.id) === String(body.p_update_id));
      if (index >= 0) updates.splice(index, 1);
      calls.push({ name: 'wm_delete_board_item_update', body: clone(body) });
      return json(route, 200, null);
    }

    if (url.pathname === '/rest/v1/rpc/wm_register_board_item_file') {
      calls.push({ name: 'wm_register_board_item_file', body: clone(body) });
      if (!canEdit()) return json(route, 403, { code: '42501', message: 'Board edit access denied' });
      const storagePath = String(body.p_storage_path);
      if (!storage.has(storagePath)) {
        return json(route, 403, { code: '42501', message: 'Uploaded Storage object is missing or is not owned by the current user' });
      }
      const existing = files.find((entry) => entry.storage_path === storagePath);
      if (existing) {
        if (failRegistrationResponses > 0) {
          failRegistrationResponses -= 1;
          calls.push({ name: 'wm_register_board_item_file-response-lost', path: storagePath });
          return json(route, 503, { code: 'M50_FIXTURE_RESPONSE_LOST', message: 'Simulated response loss after committed registration' });
        }
        return json(route, 200, existing.id);
      }

      const id = `00000000-0000-4000-8000-${String(fileSeq++).padStart(12, '0')}`;
      const itemId = String(body.p_item_id);
      files.unshift({
        id,
        item_id: itemId,
        file_name: String(body.p_file_name),
        mime_type: String(body.p_mime_type),
        size_bytes: Number(body.p_size_bytes),
        storage_path: storagePath,
        created_by: 'u1',
        author_id: 'u1',
        author_name: 'M50 User',
        created_at: new Date().toISOString(),
        can_delete: true,
      });
      activity.unshift({
        id: `a${activity.length + 1}`,
        item_id: itemId,
        event_type: 'item.file_added',
        message: 'File attached',
        payload: { file_id: id },
        created_at: new Date().toISOString(),
        actor_name: 'M50 User',
      });
      if (failRegistrationResponses > 0) {
        failRegistrationResponses -= 1;
        calls.push({ name: 'wm_register_board_item_file-response-lost', path: storagePath });
        return json(route, 503, { code: 'M50_FIXTURE_RESPONSE_LOST', message: 'Simulated response loss after committed registration' });
      }
      return json(route, 200, id);
    }

    if (url.pathname === '/rest/v1/rpc/wm_delete_board_item_file') {
      if (!canEdit()) return json(route, 403, { code: '42501', message: 'Board edit access denied' });
      const index = files.findIndex((entry) => entry.id === String(body.p_file_id));
      const removed = index >= 0 ? files.splice(index, 1)[0] : null;
      calls.push({ name: 'wm_delete_board_item_file', body: clone(body) });
      return json(route, 200, removed?.storage_path ?? null);
    }

    if (url.pathname.startsWith('/storage/v1/object/sign/work-board-files/') && request.method() === 'POST') {
      const storagePath = decodeURIComponent(url.pathname.slice('/storage/v1/object/sign/work-board-files/'.length));
      calls.push({ name: 'storage-sign', path: storagePath });
      return json(route, 200, { signedURL: `${M39_FIXTURE_ORIGIN}/m50-signed/${encodeURIComponent(storagePath)}` });
    }

    if (url.pathname.startsWith('/storage/v1/object/work-board-files/')) {
      const storagePath = decodeURIComponent(url.pathname.slice('/storage/v1/object/work-board-files/'.length));
      if (request.method() === 'POST') {
        storage.set(storagePath, await request.postDataBuffer());
        calls.push({ name: 'storage-upload', path: storagePath });
        return json(route, 200, { Key: storagePath });
      }
      if (request.method() === 'DELETE') {
        if (failStorageDelete > 0) {
          failStorageDelete -= 1;
          calls.push({ name: 'storage-delete-failed', path: storagePath });
          return json(route, 503, { code: 'M50_FIXTURE_STORAGE_DELETE', message: 'Simulated Storage delete failure' });
        }
        storage.delete(storagePath);
        calls.push({ name: 'storage-delete', path: storagePath });
        return json(route, 200, {});
      }
    }

    if (url.pathname.startsWith('/m50-signed/') && request.method() === 'GET') {
      const storagePath = decodeURIComponent(url.pathname.slice('/m50-signed/'.length));
      const bytes = storage.get(storagePath) ?? Buffer.from('fixture-file');
      calls.push({ name: 'storage-download', path: storagePath });
      return route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        body: bytes,
        headers: { 'access-control-allow-origin': '*' },
      });
    }

    return route.fallback();
  });

  return Object.freeze({
    boardId: M49_BOARD_ID,
    snapshot: () => ({
      board: clone(board),
      updates: clone(updates),
      files: clone(files),
      activity: clone(activity),
      storage: [...storage.keys()],
    }),
    calls: (name) => clone(calls.filter((entry) => !name || entry.name === name)),
    failNextRegistrationResponses: (count = 1) => { failRegistrationResponses += Math.max(1, Number(count) || 1); },
    failNextStorageDelete: () => { failStorageDelete += 1; },
  });
}
