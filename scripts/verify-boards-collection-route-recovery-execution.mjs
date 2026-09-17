import assert from 'node:assert/strict';
import { renderBoardCard, renderBoardListState } from '../assets/js/features/boards/views/board-list-view.ts';
import { createBoardDataController } from '../assets/js/features/boards/controllers/board-data-controller.ts';
import { createBoardViewState } from '../assets/js/features/boards/board-state.ts';

let checks=0;const check=(fn)=>{fn();checks+=1;};
const esc=(value)=>String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const fmt=()=> 'Sep 17, 2026';
const board=(overrides={})=>({id:'board-1',name:'Alpha Roadmap',description:'Delivery launch plan',status:'active',member_role:'owner',updated_at:'2026-09-17T00:00:00.000Z',item_count:0,...overrides});

check(()=>{const html=renderBoardCard(board(),{escapeHtml:esc,formatDate:fmt});assert.match(html,/role="link"/);assert.match(html,/tabindex="0"/);assert.match(html,/data-board-open="board-1"/);});
check(()=>{const html=renderBoardCard(board({status:'archived'}),{escapeHtml:esc,formatDate:fmt});assert.doesNotMatch(html,/role="link"/);assert.doesNotMatch(html,/tabindex="0"/);assert.match(html,/data-board-status-action="board-1" data-status="active"/);});
check(()=>{const html=renderBoardCard(board({status:'trashed'}),{escapeHtml:esc,formatDate:fmt});assert.doesNotMatch(html,/role="link"/);assert.match(html,/data-board-delete="board-1"/);});
check(()=>{const html=renderBoardCard(board({status:'archived',member_role:'viewer'}),{escapeHtml:esc,formatDate:fmt});assert.doesNotMatch(html,/data-board-menu-trigger/);});
check(()=>{const html=renderBoardCard(board({status:'trashed',member_role:'viewer'}),{escapeHtml:esc,formatDate:fmt});assert.doesNotMatch(html,/data-board-menu-trigger/);});
check(()=>{const state=createBoardViewState();state.boards=[board(),board({id:'board-2',name:'Beta',description:'Operations'})];state.search='launch';const html=renderBoardListState({state,escapeHtml:esc,formatDate:fmt});assert.match(html,/Alpha Roadmap/);assert.doesNotMatch(html,/>Beta</);});
check(()=>{const state=createBoardViewState();state.boards=[board(),board({id:'board-2',name:'Beta',description:'Quarterly Operations'})];state.search='operations';const html=renderBoardListState({state,escapeHtml:esc,formatDate:fmt});assert.match(html,/>Beta</);assert.doesNotMatch(html,/Alpha Roadmap/);});
check(()=>{const state=createBoardViewState();state.status='archived';const html=renderBoardListState({state,escapeHtml:esc,formatDate:fmt});assert.match(html,/No archived boards/);});
check(()=>{const state=createBoardViewState();state.status='trashed';const html=renderBoardListState({state,escapeHtml:esc,formatDate:fmt});assert.match(html,/Trash is empty/);});

const activeEnvelope={board:board(),groups:[],items:[],columns:[],values:[],members:[]};
const archivedEnvelope={...activeEnvelope,board:board({id:'archived-1',status:'archived'})};


async function runAsyncChecks(){
  {const state=createBoardViewState();let listChanges=0;const service={list:async(status)=>[board({status})],get:async()=>activeEnvelope,getPreferences:async()=>({})};const controller=createBoardDataController({state,service,onListChange:()=>{listChanges+=1;},onBoardChange:()=>{}});assert.equal(await controller.loadBoards('archived'),true);assert.equal(state.boards[0].status,'archived');assert.equal(state.loading,false);assert.ok(listChanges>=2);checks+=1;}
  {const state=createBoardViewState();let mismatch=null;let loaded=0;let prefs=0;const service={list:async()=>[],get:async()=>archivedEnvelope,getPreferences:async()=>{prefs+=1;return {};}};const controller=createBoardDataController({state,service,onListChange:()=>{},onBoardChange:()=>{},onBoardLoaded:()=>{loaded+=1;},onLifecycleMismatch:(b)=>{mismatch=b;}});assert.equal(await controller.loadBoard('archived-1'),false);assert.equal(state.board,null);assert.equal(mismatch?.status,'archived');assert.equal(loaded,0);assert.equal(prefs,0);checks+=1;}
  {const state=createBoardViewState();let loaded=0;const service={list:async()=>[],get:async()=>activeEnvelope,getPreferences:async()=>({item_name_width:321})};const controller=createBoardDataController({state,service,onListChange:()=>{},onBoardChange:()=>{},onBoardLoaded:()=>{loaded+=1;}});assert.equal(await controller.loadBoard('board-1'),true);assert.equal(state.board?.board?.id,'board-1');assert.equal(state.boardPrefs.item_name_width,321);assert.equal(loaded,1);checks+=1;}
  {const state=createBoardViewState();let resolveFirst;const first=new Promise((resolve)=>{resolveFirst=resolve;});const service={list:async(status)=>status==='active'?first:[board({status:'archived'})],get:async()=>activeEnvelope,getPreferences:async()=>({})};const controller=createBoardDataController({state,service,onListChange:()=>{},onBoardChange:()=>{}});const pending=controller.loadBoards('active');const archived=controller.loadBoards('archived');assert.equal(await archived,true);resolveFirst([board()]);assert.equal(await pending,false);assert.equal(state.boards[0].status,'archived');checks+=1;}
  {const state=createBoardViewState();let changes=0;const service={list:async()=>{throw new Error('network down');},get:async()=>activeEnvelope,getPreferences:async()=>({})};const controller=createBoardDataController({state,service,onListChange:()=>{changes+=1;},onBoardChange:()=>{}});assert.equal(await controller.loadBoards('active'),false);assert.match(state.error,/network down|Boards could not be loaded/i);assert.equal(state.loading,false);assert.ok(changes>=2);checks+=1;}
}

await runAsyncChecks();
assert.ok(checks>=14);
console.log(`Stage G M45 Boards Collection & Route Recovery deterministic verification: PASS (checks=${checks})`);
