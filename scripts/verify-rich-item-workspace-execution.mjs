import assert from 'node:assert/strict';
import { createBoardViewState } from '../assets/js/features/boards/board-state.ts';
import { createItemWorkspaceRuntime } from '../assets/js/features/boards/services/item-workspace-runtime.ts';

const state = createBoardViewState();
state.board = {
  board: { id: 'board-1', name: 'Board', description: '', status: 'active' },
  groups: [{ id: 'group-1', board_id: 'board-1', title: 'Group', position: 0 }],
  items: [{ id: 'item-1', board_id: 'board-1', group_id: 'group-1', title: 'Item', position: 0, status: null }],
  columns: [], values: [], members: [],
};
let loads = 0;
const runtime = createItemWorkspaceRuntime({
  state,
  service: {
    getItemWorkspace: async () => { loads += 1; return { permissions: { can_edit: true, can_comment: true, can_attach: true, can_manage: true }, updates: [], files: [], activity: [] }; },
  },
});
runtime.open('item-1');
assert.equal(state.itemPanel.tab, 'updates', 'M21 preserves Updates as the compatibility default tab.');
assert.equal(state.itemPanel.updateDraft, '', 'New Item Workspace starts with an empty update draft.');
runtime.setUpdateDraft('Decision: retain canonical RPC authority');
assert.equal(state.itemPanel.updateDraft, 'Decision: retain canonical RPC authority', 'Update draft is retained in typed Item Workspace state.');
assert.equal(runtime.setTab('overview'), true, 'Overview is a valid M21 tab.');
assert.equal(state.itemPanel.tab, 'overview');
assert.equal(runtime.setTab('unknown'), false, 'Unknown tabs remain rejected.');
await runtime.load('item-1', { quiet: true });
assert.equal(loads, 1);
assert.equal(state.itemPanel.updateDraft, 'Decision: retain canonical RPC authority', 'Authoritative workspace refetch does not erase the update draft.');
runtime.setTab('updates');
assert.equal(state.itemPanel.updateDraft, 'Decision: retain canonical RPC authority', 'Tab changes do not erase the draft.');
runtime.close();
assert.equal(state.itemPanel.itemId, null);
assert.equal(state.itemPanel.updateDraft, '', 'Closing the workspace clears the item-scoped draft.');
console.log('Stage D M21 Rich Item Workspace execution vectors: PASS');
