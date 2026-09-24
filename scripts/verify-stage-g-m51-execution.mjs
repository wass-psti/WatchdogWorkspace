import assert from 'node:assert/strict';
import { createSupabaseRealtimeClient } from '../assets/js/platform/data/supabase-realtime-client.ts';
import { createBoardRealtimeController } from '../assets/js/features/boards/controllers/board-realtime-controller.ts';

class FakeSocket {
  readyState = 0;
  sent = [];
  listeners = new Map();
  addEventListener(type, listener) { const list=this.listeners.get(type) ?? []; list.push(listener); this.listeners.set(type,list); }
  removeEventListener(type, listener) { this.listeners.set(type,(this.listeners.get(type) ?? []).filter((entry)=>entry!==listener)); }
  send(value) { this.sent.push(JSON.parse(value)); }
  close() { this.readyState=3; }
  emit(type, data=null) {
    if (type==='open') this.readyState=1;
    for (const listener of this.listeners.get(type) ?? []) listener(type==='message' ? { data: JSON.stringify(data) } : { type });
  }
}

// Transport: Presence must not remain stale while disconnected, and a recovered
// join must cancel a pending reconnect instead of tearing down a healthy socket.
const sockets=[];
const timeoutRecords=[];
const client=createSupabaseRealtimeClient(
  {supabaseUrl:'https://project-ref.supabase.co',publishableKey:'sb_publishable_test'},
  {
    createWebSocket:()=>{ const socket=new FakeSocket(); sockets.push(socket); return socket; },
    setIntervalFn:()=>1,
    clearIntervalFn:()=>{},
    setTimeoutFn:(callback)=>{ const record={callback,cancelled:false}; timeoutRecords.push(record); return record; },
    clearTimeoutFn:(record)=>{ record.cancelled=true; },
    now:()=>1700000000000,
  },
);
const presenceSnapshots=[];
const channel=client.connectPrivateChannel({
  topic:'board:11111111-1111-4111-8111-111111111111',
  presenceKey:'user-a',
  presencePayload:{user_id:'user-a'},
  onPresence:(presence)=>presenceSnapshots.push(presence),
},'jwt-a');
const first=sockets[0]; first.emit('open');
const firstJoin=first.sent.find((message)=>message[3]==='phx_join');
first.emit('message',[firstJoin[1],firstJoin[1],firstJoin[2],'phx_reply',{status:'ok',response:{}}]);
first.emit('message',[firstJoin[1],'p1',firstJoin[2],'presence_state',{'user-a':{metas:[{phx_ref:'a1',user_id:'user-a'}]},'user-b':{metas:[{phx_ref:'b1',user_id:'user-b'}]}}]);
assert.equal(channel.snapshot().presence.length,2);
first.emit('message',[firstJoin[1],'err',firstJoin[2],'phx_error',{}]);
assert.equal(channel.snapshot().presence.length,0,'disconnected transport must clear stale collaborator Presence');
assert.equal(presenceSnapshots.at(-1)?.length,0);
assert.equal(timeoutRecords.length,1);
timeoutRecords[0].callback();
const second=sockets[1]; second.emit('open');
const secondJoin=second.sent.find((message)=>message[3]==='phx_join');
// Simulate another transient fault followed by successful join before its retry timer fires.
second.emit('message',[secondJoin[1],'err2',secondJoin[2],'phx_error',{}]);
assert.equal(timeoutRecords.length,2);
second.emit('message',[secondJoin[1],secondJoin[1],secondJoin[2],'phx_reply',{status:'ok',response:{}}]);
assert.equal(timeoutRecords[1].cancelled,true,'successful rejoin must cancel any stale reconnect timer');
assert.equal(channel.snapshot().state,'live');
channel.dispose();

// Controller: two-session canonical convergence must defer during active edits,
// recover missed broadcasts after reconnect, and retry failed canonical reloads.
const boardId='11111111-1111-4111-8111-111111111111';
const sessionHandlers={a:null,b:null};
const makeService=(key)=>({ async subscribe(_boardId,handlers){ sessionHandlers[key]=handlers; handlers.onSnapshot({state:'live',boardId,collaborators:[],lastEventAt:null,lastError:null,fallbackPolling:false}); return {snapshot:()=>({state:'live',boardId,collaborators:[],lastEventAt:null,lastError:null,fallbackPolling:false}),refreshAccessToken:async()=>{},dispose:()=>{}}; } });
let canonical={title:'Original',status:'not_started'};
let localA={...canonical};
let localB={...canonical};
let busyA=true;
let reloadFailuresA=0;
const timersA=[];
const intervalsA=[];
const controllerA=createBoardRealtimeController({
  service:makeService('a'),
  boardService:{invalidate(){}},
  reloadBoard:async()=>{ if(reloadFailuresA>0){reloadFailuresA-=1; throw new Error('temporary reload failure');} localA={...canonical}; return true; },
  onSnapshot:()=>{},
  shouldDeferSync:()=>busyA,
  coalesceMs:1,
  interactionDeferralMs:1,
  syncRetryMs:1,
  fallbackPollMs:1,
  setTimeoutFn:(callback)=>{timersA.push(callback);return timersA.length;},
  clearTimeoutFn:()=>{},
  setIntervalFn:(callback)=>{intervalsA.push(callback);return intervalsA.length;},
  clearIntervalFn:()=>{},
});
const controllerB=createBoardRealtimeController({
  service:makeService('b'),
  boardService:{invalidate(){}},
  reloadBoard:async()=>{ localB={...canonical}; return true; },
  onSnapshot:()=>{},
  setTimeoutFn:(callback)=>{callback();return 1;},
  clearTimeoutFn:()=>{},
  setIntervalFn:()=>1,
  clearIntervalFn:()=>{},
});
await controllerA.connect(boardId); await controllerB.connect(boardId);
// B commits while A is actively editing. A receives the remote signal but keeps its active draft/local state.
canonical={...canonical,status:'done'}; localB={...canonical};
sessionHandlers.a.onChange({boardId,entity:'item',entityId:'i1',itemId:'i1',action:'UPDATE',actorId:'user-b',occurredAt:'x'});
assert.equal(timersA.length,1);
timersA.shift()();
await new Promise((resolve)=>{setTimeout(resolve,0);});
assert.equal(localA.status,'not_started','remote reload must be deferred while a local interaction is active');
// A commits a field-scoped title mutation: the collaborator's status remains canonical.
canonical={...canonical,title:'A title'}; localA={...localA,title:'A title'};
busyA=false;
timersA.shift()();
await new Promise((resolve)=>{setTimeout(resolve,0);});
assert.deepEqual(localA,canonical,'deferred session must converge after the active interaction finishes without losing non-overlapping collaborator changes');
// A transient canonical reload failure must retain work and retry instead of dropping the change batch.
reloadFailuresA=1;
canonical={...canonical,status:'in_progress'};
sessionHandlers.a.onChange({boardId,entity:'item',entityId:'i1',itemId:'i1',action:'UPDATE',actorId:'user-b',occurredAt:'y'});
timersA.shift()();
await new Promise((resolve)=>{setTimeout(resolve,0);});
assert.notDeepEqual(localA,canonical);
assert.ok(timersA.length>=1,'failed canonical reconciliation must schedule a retry');
timersA.shift()();
await new Promise((resolve)=>{setTimeout(resolve,0);});
assert.deepEqual(localA,canonical,'retry must converge the session after a transient reload failure');
// A reconnect can miss broadcasts; transition from degraded -> live must force catch-up even without a new event.
canonical={...canonical,status:'blocked'};
sessionHandlers.a.onSnapshot({state:'reconnecting',boardId,collaborators:[],lastEventAt:null,lastError:'network',fallbackPolling:false});
sessionHandlers.a.onSnapshot({state:'live',boardId,collaborators:[],lastEventAt:null,lastError:null,fallbackPolling:false});
assert.ok(timersA.length>=1,'reconnect recovery must request an immediate canonical catch-up');
timersA.shift()();
await new Promise((resolve)=>{setTimeout(resolve,0);});
assert.deepEqual(localA,canonical);
// Degraded fallback polling must also respect interaction deferral.
busyA=true;
sessionHandlers.a.onSnapshot({state:'offline',boardId,collaborators:[],lastEventAt:null,lastError:'offline',fallbackPolling:false});
const before={...localA};
canonical={...canonical,status:'done'};
intervalsA.at(-1)?.();
await new Promise((resolve)=>{setTimeout(resolve,0);});
assert.deepEqual(localA,before,'fallback polling must not tear down an active local edit');
busyA=false;
intervalsA.at(-1)?.();
await new Promise((resolve)=>{setTimeout(resolve,0);});
assert.deepEqual(localA,canonical,'fallback polling must converge once interaction deferral ends');
controllerA.disconnect(); controllerB.disconnect();

console.log('Stage G M51 realtime & concurrency execution vectors: PASS');
