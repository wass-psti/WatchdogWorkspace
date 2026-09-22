import { renderBoardKanbanView, buildBoardKanbanLanes } from '../../assets/js/features/boards/views/kanban-view.ts';
import { createBoardDragDropController } from '../../assets/js/features/boards/controllers/drag-drop-controller.ts';
import { createBoardStructureDragController } from '../../assets/js/features/boards/controllers/structure-drag-controller.ts';
import { createBoardViewSwitchController } from '../../assets/js/features/boards/controllers/view-switch-controller.ts';

const root=document.querySelector('#root');
const out=document.querySelector('#result');
const wait=(ms=0)=>new Promise((resolve)=>{setTimeout(resolve,ms);});
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const esc=(s)=>String(s).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const items=[
  {id:'alpha',group_id:'g1',position:0,status:'todo',title:'Alpha',archived:false,assignee_id:null,due_date:null},
  {id:'bravo',group_id:'g1',position:1,status:'doing',title:'Bravo',archived:false,assignee_id:null,due_date:null},
  {id:'legacy-item',group_id:'g1',position:2,status:'legacy',title:'Legacy item',archived:false,assignee_id:null,due_date:null},
];
const groups=[{id:'g1',title:'Planning',position:0},{id:'g2',title:'Delivery',position:1}];
const columns=[{id:'c1',name:'Field 1',position:0},{id:'c2',name:'Field 2',position:1}];
const labels=[
  {id:'todo',name:'To do',color:'#aaa',position:0,active:true},
  {id:'doing',name:'Doing',color:'#bbb',position:1,active:true},
  {id:'legacy',name:'Legacy',color:'#ccc',position:2,active:false},
  {id:'done',name:'Done',color:'#ddd',position:3,active:true},
];
const state={board:{id:'board-m49',view:'kanban',groups,columns},itemPanel:{itemId:null}};
const moves=[]; const structureCalls=[]; const views=[]; const toasts=[]; let failItem=false; let failGroup=false; let failView=false; let holdItem=null;
const commands={
  async moveItem(payload){moves.push({...payload});if(holdItem)await holdItem;if(failItem){failItem=false;throw new Error('simulated item failure');}},
  async moveGroup(payload){structureCalls.push(['group',payload]);if(failGroup){failGroup=false;throw new Error('simulated group failure');}},
  async moveColumn(payload){structureCalls.push(['column',payload]);},
};
let drag; let structure;
const render=()=>{
  root.innerHTML=renderBoardKanbanView({state,items,groups,itemMatches:()=>true,canEdit:()=>true,memberMap:()=>new Map(),statusLabels:labels,escapeHtml:esc,formatDay:(v)=>String(v)});
  root.insertAdjacentHTML('beforeend',`<section id="structure"><div class="board-group" data-group-id="g1"><button data-group-drag="g1">Planning</button></div><div class="board-group" data-group-id="g2"><button data-group-drag="g2">Delivery</button></div><div data-column-id="c1"><button data-column-drag="c1">Field 1</button></div><div data-column-id="c2"><button data-column-drag="c2">Field 2</button></div></section>`);
};
const toast=(message)=>toasts.push(message);
const history={push(){}};
const viewSwitch=createBoardViewSwitchController({
 getBoardIdentity:()=>({id:state.board.id,view:state.board.view}),
 applyLocalView:(_id,view)=>{state.board.view=view;},
 persistView:async(_id,view)=>{views.push(view);if(failView){failView=false;throw new Error('simulated view failure');}},
 renderBoard:render,
 toast,
});
viewSwitch.adopt(state.board.id,state.board.view);
structure=createBoardStructureDragController({state,commands,canEdit:()=>true,toast,renderBoardData:render,history,isBlocked:()=>Boolean(drag?.pending||viewSwitch.pending)});
drag=createBoardDragDropController({commands,state,canEdit:()=>true,getItems:()=>items,toast,renderBoard:render,history,isBlocked:()=>Boolean(structure.pending||viewSwitch.pending)});
render(); drag.bind(root); structure.bind(root);

try{
 const laneModel=buildBoardKanbanLanes(items,labels);
 assert(laneModel.some(x=>x.id==='legacy'&&!x.active),'referenced inactive lane missing');
 assert(laneModel.some(x=>x.id===''&&x.active),'no-status lane missing');
 assert(root.querySelectorAll('[data-item-id]').length===3,'canonical cards not exactly once');
 assert(root.querySelector('[data-kanban-status="legacy"]')?.getAttribute('aria-disabled')==='true','inactive lane not read-only');

 const alpha=root.querySelector('[data-kanban-item-drag="alpha"]'); alpha.focus(); alpha.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true})); await wait(40);
 assert(items[0].status==='doing','keyboard lane move failed'); assert(items[0].group_id==='g1'&&items[0].position===0,'status move changed table order');
 assert(moves.at(-1)?.position===0&&moves.at(-1)?.groupId==='g1','persisted status move changed canonical position');

 failItem=true; const bravo=root.querySelector('[data-kanban-item-drag="bravo"]'); bravo.focus(); bravo.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true})); await wait(40);
 assert(items[1].status==='doing','failed item move did not rollback');

 const beforeGroups=groups.map(x=>`${x.id}:${x.position}`).join(','); failGroup=true; const g1=root.querySelector('[data-group-drag="g1"]'); g1.focus(); g1.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true})); await wait(40);
 assert(groups.map(x=>`${x.id}:${x.position}`).join(',')===beforeGroups,'failed group move did not rollback');

 failView=true; const viewResult=await viewSwitch.request('table'); assert(viewResult===false,'failed view request returned success'); assert(state.board.view==='kanban','failed view request did not restore confirmed view');

 let release; holdItem=new Promise(r=>{release=r;}); const alpha2=root.querySelector('[data-kanban-item-drag="alpha"]'); alpha2.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true})); await wait(20);
 assert(drag.pending===true,'item persistence pending state not exposed');
 const groupBefore=structureCalls.length; root.querySelector('[data-group-drag="g1"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true})); await wait(10); assert(structureCalls.length===groupBefore,'structure move overlapped pending item move');
 const viewBefore=state.board.view; assert(viewSwitch.pending===false,'unexpected view pending');
 // Product integration blocks view requests while movement is pending; verify the controller-side shared block with the same predicate used by boards-ui.
 const integrationViewAllowed=!(drag.pending||structure.pending); assert(integrationViewAllowed===false&&state.board.view===viewBefore,'view/move concurrency guard failed');
 release(); holdItem=null; await wait(50); assert(drag.pending===false,'item pending state did not settle');

 out.dataset.state='pass'; out.textContent='lanes=true keyboard=true rollback=true structure=true view=true concurrency=true';
}catch(error){out.dataset.state='fail';out.textContent=`FAIL ${error?.stack||error}`;}
