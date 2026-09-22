import assert from 'node:assert/strict';
import {
  applyBoardItemMove,
  assertUniqueCanonicalItemIds,
  restoreBoardItemMoveState,
  snapshotBoardItemMoveState,
} from '../assets/js/features/boards/services/board-move-state.ts';
import { buildBoardKanbanLanes } from '../assets/js/features/boards/views/kanban-view.ts';
import { reorderBoardStructureLocal, restoreBoardStructurePositions } from '../assets/js/features/boards/controllers/structure-drag-controller.ts';
import { createBoardViewSwitchController } from '../assets/js/features/boards/controllers/view-switch-controller.ts';

let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const eq = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks += 1; };
const item = (id, group, position, status) => ({ id, board_id: 'b1', group_id: group, title: id, position, status, archived: false, archived_at: null });

// Canonical item move semantics.
{
  const items = [item('a','g1',0,'todo'), item('b','g1',1,'todo'), item('c','g1',2,'doing')];
  const before = snapshotBoardItemMoveState(items);
  applyBoardItemMove(items, items[1], 'g1', 1, 'doing', 'status-only');
  eq(items.map(({id,group_id,position,status}) => [id,group_id,position,status]), [
    ['a','g1',0,'todo'], ['b','g1',1,'doing'], ['c','g1',2,'doing'],
  ], 'status-only movement preserves group and every Table position');
  restoreBoardItemMoveState(items, before);
  eq(items.map(({id,position,status}) => [id,position,status]), [['a',0,'todo'],['b',1,'todo'],['c',2,'doing']], 'move snapshot restores exact canonical state');

  applyBoardItemMove(items, items[0], 'g1', 2, 'todo', 'positioned');
  eq(items.slice().sort((l,r)=>l.position-r.position).map(x=>x.id), ['b','c','a'], 'positioned same-group movement yields deterministic contiguous order');
  eq(items.slice().sort((l,r)=>l.position-r.position).map(x=>x.position), [0,1,2], 'positioned move preserves contiguous positions');
}
{
  const items = [item('a','g1',0,'todo'), item('b','g1',1,'doing'), item('c','g2',0,'done')];
  applyBoardItemMove(items, items[1], 'g2', 0, 'doing', 'positioned');
  eq(items.filter(x=>x.group_id==='g1').map(x=>[x.id,x.position]), [['a',0]], 'cross-group move compacts source group');
  eq(items.filter(x=>x.group_id==='g2').sort((l,r)=>l.position-r.position).map(x=>[x.id,x.position]), [['b',0],['c',1]], 'cross-group move inserts and shifts target group');
  assertUniqueCanonicalItemIds(items); checks += 1;
  assert.throws(() => assertUniqueCanonicalItemIds([...items, {...items[0]}]), /Duplicate Board item identifier/); checks += 1;
}

// Kanban lane completeness and active-drop semantics.
{
  const items = [item('a','g1',0,'todo'), item('b','g1',1,'retired'), item('c','g1',2,'orphan'), item('d','g1',3,null)];
  const labels = [
    {id:'todo',name:'To do',color:'#111',position:0,active:true},
    {id:'doing',name:'Doing',color:'#222',position:1,active:true},
    {id:'retired',name:'Retired',color:'#333',position:2,active:false},
    {id:'unused',name:'Unused',color:'#444',position:3,active:false},
  ];
  const lanes = buildBoardKanbanLanes(items, labels);
  eq(lanes.map(x=>x.id), ['todo','doing','retired','orphan',''], 'Kanban includes active, referenced inactive, orphan fallback, and No status lanes in deterministic order');
  ok(lanes.find(x=>x.id==='retired')?.active === false, 'referenced inactive lane remains read-only');
  ok(lanes.find(x=>x.id==='orphan')?.unavailable === true, 'unknown status reference is represented by unavailable lane');
  ok(!lanes.some(x=>x.id==='unused'), 'unreferenced inactive lane is omitted');
  ok(lanes.at(-1)?.id === '' && lanes.at(-1)?.active === true, 'No status remains an active drop target');
}

// Structural order semantics.
{
  const groups = [{id:'g1',position:0},{id:'g2',position:1},{id:'g3',position:2}];
  const result = reorderBoardStructureLocal(groups, 'g3', 0);
  ok(Boolean(result), 'structural reorder returns a transaction result');
  eq(groups.slice().sort((a,b)=>a.position-b.position).map(x=>x.id), ['g3','g1','g2'], 'structural reorder is deterministic');
  restoreBoardStructurePositions(groups, result.before);
  eq(groups.slice().sort((a,b)=>a.position-b.position).map(x=>x.id), ['g1','g2','g3'], 'structural rollback restores confirmed positions');
}

// Serialized view switching: rollback, ordering, and latest-intent protection.
{
  let currentView = 'table';
  const persists = [];
  const toasts = [];
  let failNext = true;
  const controller = createBoardViewSwitchController({
    getBoardIdentity: () => ({ id:'b1', view:currentView }),
    applyLocalView: (_id, view) => { currentView = view; },
    persistView: async (_id, view) => { persists.push(view); if (failNext) { failNext=false; throw new Error('offline'); } },
    renderBoard: () => undefined,
    toast: (message) => { toasts.push(message); },
  });
  controller.adopt('b1','table');
  const result = await controller.request('kanban');
  ok(result === false, 'failed view persistence reports failure');
  eq(currentView, 'table', 'failed latest view switch restores last confirmed view');
  eq(controller.confirmedView, 'table', 'failed view switch does not advance confirmed state');
  ok(toasts.some(x=>x.includes('previous view was restored')), 'view rollback emits explicit warning');
  const next = await controller.request('kanban');
  ok(next === true, 'successful view persistence reports success');
  eq(currentView, 'kanban', 'successful view switch retains requested view');
  eq(controller.confirmedView, 'kanban', 'successful view switch advances confirmed state');
  eq(persists, ['kanban','kanban'], 'view persistence remains serialized through one authority');
}
{
  let currentView = 'table';
  const pending = [];
  const persisted = [];
  const controller = createBoardViewSwitchController({
    getBoardIdentity: () => ({id:'b1',view:currentView}),
    applyLocalView: (_id, view) => { currentView=view; },
    persistView: (_id, view) => new Promise((resolve,reject) => { persisted.push(view); pending.push({resolve,reject}); }),
    renderBoard: () => undefined,
    toast: () => undefined,
  });
  controller.adopt('b1','table');
  const first = controller.request('kanban');
  const second = controller.request('table');
  await Promise.resolve();
  eq(persisted, ['kanban'], 'second rapid view request waits for first persistence transaction');
  pending[0].resolve();
  await new Promise((resolve) => { setTimeout(resolve,0); });
  eq(persisted, ['kanban','table'], 'queued view request begins only after first transaction completes');
  pending[1].resolve();
  eq(await Promise.all([first,second]), [true,true], 'both serialized view requests resolve deterministically');
  eq(currentView, 'table', 'rapid Table/Kanban switching preserves latest intent');
  eq(controller.confirmedView, 'table', 'confirmed view equals latest successful queued intent');
  ok(controller.pending === false, 'view controller clears pending state after queue completion');
}
{
  let currentView='table';
  const deferred=[];
  const controller=createBoardViewSwitchController({
    getBoardIdentity:()=>({id:'b1',view:currentView}),
    applyLocalView:(_id,view)=>{currentView=view;},
    persistView:(_id,view)=>new Promise((resolve,reject)=>{ deferred.push({view,resolve,reject}); }),
    renderBoard:()=>undefined,
    toast:()=>undefined,
  });
  controller.adopt('b1','table');
  const first=controller.request('kanban');
  const second=controller.request('table');
  await Promise.resolve();
  deferred[0].reject(new Error('older failure'));
  await new Promise((resolve) => { setTimeout(resolve,0); });
  eq(currentView,'table','older failed request never rolls back a newer optimistic intent');
  deferred[1].resolve();
  await Promise.all([first,second]);
  eq(controller.confirmedView,'table','newer queued success becomes confirmed after older failure');
}

console.log(`Stage G M49 Boards Kanban & Drag/Drop Recovery deterministic verification: PASS (${checks} checks)`);
