import { M39_FIXTURE_ORIGIN } from './m39-auth-fixture.mjs';

const now = () => '2026-09-17T00:00:00.000Z';
const clone = (value) => JSON.parse(JSON.stringify(value));
const board = (id, name, description, status = 'active', member_role = 'owner') => ({
  id,
  name,
  description,
  status,
  view_mode: 'table',
  member_role,
  owner_id: '00000000-0000-4000-8000-000000000039',
  item_count: 0,
  created_at: now(),
  updated_at: now(),
});

const json = (route, status, body) => route.fulfill({
  status,
  contentType: 'application/json; charset=utf-8',
  body: JSON.stringify(body),
  headers: { 'access-control-allow-origin': '*' },
});

const envelope = (record) => ({
  board: record ? clone(record) : null,
  groups: [],
  items: [],
  columns: [],
  values: [],
  members: [],
});

export async function installM45BoardsFixture(page) {
  const state = {
    boards: [
      board('board-active-alpha', 'Alpha Roadmap', 'Delivery launch plan', 'active', 'owner'),
      board('board-active-beta', 'Beta Operations', 'Quarterly operations checklist', 'active', 'editor'),
      board('board-archived-owner', 'Archived Owner Board', 'Archived lifecycle fixture', 'archived', 'owner'),
      board('board-archived-viewer', 'Archived Viewer Board', 'Viewer has no inactive actions', 'archived', 'viewer'),
      board('board-trashed-owner', 'Trashed Owner Board', 'Trash lifecycle fixture', 'trashed', 'owner'),
      board('board-trashed-viewer', 'Trashed Viewer Board', 'Viewer has no trash actions', 'trashed', 'viewer'),
    ],
    calls: [],
    nextId: 1,
  };

  const find = (id) => state.boards.find((entry) => entry.id === id) ?? null;
  const record = (name, body, rawBody, contentType) => state.calls.push({ name, body: clone(body ?? {}), rawBody, contentType });

  await page.route(`${M39_FIXTURE_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (!path.startsWith('/rest/v1/rpc/wm_')) return route.fallback();
    if (request.method() === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': 'POST, OPTIONS',
        },
      });
    }
    const rawBody = request.postData() ?? '';
    const contentType = request.headers()['content-type'] ?? '';
    let body = {};
    try {
      const parsed = rawBody ? JSON.parse(rawBody) : {};
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('RPC body must be a JSON object.');
      body = parsed;
    } catch (error) {
      return json(route, 400, { code:'M45_FIXTURE_INVALID_JSON_BODY', message:error instanceof Error ? error.message : 'Invalid RPC request body' });
    }
    const name = path.split('/').at(-1) ?? '';
    if (!['wm_list_boards','wm_get_board','wm_get_board_preferences','wm_create_board_configured','wm_duplicate_board','wm_set_board_status','wm_delete_board_permanently','wm_list_board_events'].includes(name)) return route.fallback();
    record(name, body, rawBody, contentType);

    if (name === 'wm_list_boards') {
      const status = String(body.p_status || 'active');
      return json(route, 200, state.boards.filter((entry) => entry.status === status).map(clone));
    }
    if (name === 'wm_get_board') return json(route, 200, envelope(find(String(body.p_board_id || ''))));
    if (name === 'wm_get_board_preferences') return json(route, 200, {});
    if (name === 'wm_list_board_events') return json(route, 200, []);
    if (name === 'wm_create_board_configured') {
      const id = `board-created-${state.nextId++}`;
      const created = board(id, String(body.p_name || 'Untitled board'), String(body.p_description || ''), 'active', 'owner');
      state.boards.push(created);
      return json(route, 200, id);
    }
    if (name === 'wm_duplicate_board') {
      const source = find(String(body.p_board_id || ''));
      if (!source) return json(route, 404, { code:'M45_FIXTURE_NOT_FOUND', message:'Board not found' });
      const id = `board-duplicate-${state.nextId++}`;
      const duplicate = board(id, `${source.name} copy`, source.description, 'active', source.member_role === 'viewer' ? 'owner' : source.member_role);
      state.boards.push(duplicate);
      return json(route, 200, id);
    }
    if (name === 'wm_set_board_status') {
      const current = find(String(body.p_board_id || ''));
      if (current) current.status = String(body.p_status || 'active');
      if (current) current.updated_at = now();
      return json(route, 200, null);
    }
    if (name === 'wm_delete_board_permanently') {
      const id = String(body.p_board_id || '');
      state.boards = state.boards.filter((entry) => entry.id !== id);
      return json(route, 200, null);
    }
    return route.fallback();
  });

  return Object.freeze({
    snapshot: () => clone(state),
    calls: (name) => clone(state.calls.filter((entry) => !name || entry.name === name)),
  });
}
