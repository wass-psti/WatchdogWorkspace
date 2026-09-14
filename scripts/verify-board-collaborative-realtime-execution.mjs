import assert from 'node:assert/strict';
import { createSupabaseRealtimeClient } from '../assets/js/platform/data/supabase-realtime-client.ts';
import { createBoardRealtimeService, normalizeBoardRealtimeChange, normalizeBoardRealtimeCollaborators } from '../assets/js/features/boards/services/board-realtime-service.ts';
import { createBoardRealtimeController } from '../assets/js/features/boards/controllers/board-realtime-controller.ts';


const unconfiguredAuth={
  supabase:{project:{supabaseUrl:'',publishableKey:''}},
  user:null,
  ensureAccessToken:async()=>null,
};
const unconfiguredService=createBoardRealtimeService(unconfiguredAuth);
assert.ok(unconfiguredService,'Board Realtime service construction must not require configured Supabase credentials.');
await assert.rejects(
  ()=>unconfiguredService.subscribe('11111111-1111-4111-8111-111111111111',{onChange:()=>{},onSnapshot:()=>{}}),
  /authenticated session/,
  'Anonymous/setup-required application startup must fail at subscription auth, not during global Realtime composition.',
);

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

const sockets=[];
const realtimeTimeouts=[];
const client=createSupabaseRealtimeClient(
  { supabaseUrl:'https://project-ref.supabase.co', publishableKey:'sb_publishable_test' },
  {
    createWebSocket:(url)=>{ assert.match(url,/^wss:\/\/project-ref\.supabase\.co\/realtime\/v1\/websocket\?/); assert.match(url,/apikey=sb_publishable_test/); assert.match(url,/vsn=2\.0\.0/); const socket=new FakeSocket(); sockets.push(socket); return socket; },
    setIntervalFn:()=>1,
    clearIntervalFn:()=>{},
    setTimeoutFn:(callback)=>{ realtimeTimeouts.push(callback); return realtimeTimeouts.length; },
    clearTimeoutFn:()=>{},
    now:()=>1700000000000,
  },
);
const states=[];
const broadcasts=[];
const presences=[];
const channel=client.connectPrivateChannel({
  topic:'board:11111111-1111-4111-8111-111111111111',
  presenceKey:'user-1',
  presencePayload:{user_id:'user-1',display_name:'Alex',joined_at:'2026-09-08T00:00:00.000Z'},
  onState:(snapshot)=>states.push(snapshot),
  onBroadcast:(event,payload)=>broadcasts.push([event,payload]),
  onPresence:(presence)=>presences.push(presence),
},'jwt-one');
const socket=sockets[0];
assert.ok(socket);
socket.emit('open');
const join=socket.sent.find((message)=>message[3]==='phx_join');
assert.ok(join,'private channel must send phx_join');
assert.equal(join[2],'realtime:board:11111111-1111-4111-8111-111111111111');
assert.equal(join[4].config.private,true);
assert.equal(join[4].config.presence.enabled,true);
assert.equal(join[4].access_token,'jwt-one');
const joinRef=join[1];
socket.emit('message',[joinRef,joinRef,join[2],'phx_reply',{status:'ok',response:{}}]);
assert.equal(channel.snapshot().state,'live');
assert.ok(socket.sent.some((message)=>message[3]==='presence' && message[4].type==='track'),'channel must track Presence after join');
socket.emit('message',[joinRef,'20',join[2],'presence_state',{'user-1':{metas:[{phx_ref:'r1',user_id:'user-1',display_name:'Alex',joined_at:'2026-09-08T00:00:00.000Z'}]},'user-2':{metas:[{phx_ref:'r2',user_id:'user-2',display_name:'Sam',joined_at:'2026-09-08T00:00:01.000Z'}]}}]);
assert.equal(channel.snapshot().presence.length,2);
assert.equal(presences.at(-1)?.[1]?.displayName,'Sam');
socket.emit('message',[joinRef,'21',join[2],'broadcast',{event:'board-change',type:'broadcast',payload:{board_id:'11111111-1111-4111-8111-111111111111',entity:'item',entity_id:'item-1',item_id:'item-1',action:'UPDATE',actor_id:'user-2',occurred_at:'2026-09-08T00:00:02.000Z'}}]);
assert.equal(broadcasts.length,1);
assert.equal(broadcasts[0]?.[0],'board-change');
channel.updateAccessToken('jwt-two');
assert.ok(socket.sent.some((message)=>message[3]==='access_token' && message[4].access_token==='jwt-two'),'private channel must refresh JWT in-band');
const refreshCount=socket.sent.filter((message)=>message[3]==='access_token').length;
channel.updateAccessToken('jwt-two');
assert.equal(socket.sent.filter((message)=>message[3]==='access_token').length,refreshCount+1,'same-token refresh must re-evaluate private-channel authorization');
socket.emit('message',[joinRef,'22',join[2],'phx_close',{}]);
assert.equal(channel.snapshot().state,'reconnecting','unexpected channel close must enter reconnecting state');
assert.equal(realtimeTimeouts.length,1,'unexpected channel close must schedule one bounded reconnect');
realtimeTimeouts.shift()?.();
const reconnectedSocket=sockets[1];
assert.ok(reconnectedSocket,'reconnect must construct a new WebSocket');
reconnectedSocket.emit('open');
const rejoin=reconnectedSocket.sent.find((message)=>message[3]==='phx_join');
assert.ok(rejoin,'reconnect must rejoin the private Board channel');
assert.equal(rejoin[4].access_token,'jwt-two','reconnect must reuse the refreshed authenticated token');
reconnectedSocket.emit('message',[rejoin[1],rejoin[1],rejoin[2],'phx_reply',{status:'ok',response:{}}]);
assert.equal(channel.snapshot().state,'live','rejoined channel must recover live state');
channel.dispose();
assert.equal(channel.snapshot().state,'idle');

const normalized=normalizeBoardRealtimeChange({board_id:'11111111-1111-4111-8111-111111111111',entity:'cell',entity_id:'item:column',item_id:'item',action:'update',actor_id:'user-2',occurred_at:'2026-09-08T00:00:03.000Z'},'11111111-1111-4111-8111-111111111111');
assert.equal(normalized?.action,'UPDATE');
assert.equal(normalized?.entity,'cell');
assert.equal(normalizeBoardRealtimeChange({board_id:'wrong',entity:'item',action:'UPDATE'},'11111111-1111-4111-8111-111111111111'),null);
assert.equal(normalizeBoardRealtimeCollaborators([
  {presenceRef:'1',userId:'u1',displayName:'A',joinedAt:'a'},
  {presenceRef:'2',userId:'u1',displayName:'A2',joinedAt:'b'},
  {presenceRef:'3',userId:'u2',displayName:'B',joinedAt:'c'},
]).length,2,'Presence is deduplicated per authenticated user');

let subscriptionHandlers=null;
let subscriptionDisposed=0;
const fakeRealtimeService={
  async subscribe(_boardId,handlers){
    subscriptionHandlers=handlers;
    handlers.onSnapshot({state:'live',boardId:'board-1',collaborators:[],lastEventAt:null,lastError:null,fallbackPolling:false});
    return {snapshot:()=>({state:'live',boardId:'board-1',collaborators:[],lastEventAt:null,lastError:null,fallbackPolling:false}),refreshAccessToken:async()=>{},dispose:()=>{subscriptionDisposed+=1;}};
  },
};
let invalidateCount=0;
let reloadCount=0;
let workspaceReloadCount=0;
let localInteractionBusy=true;
const queuedTimeouts=[];
const controller=createBoardRealtimeController({
  service:fakeRealtimeService,
  boardService:{invalidate(){invalidateCount+=1;}},
  reloadBoard:async()=>{reloadCount+=1;},
  reloadItemWorkspace:async()=>{workspaceReloadCount+=1;},
  onSnapshot:()=>{},
  shouldDeferSync:()=>localInteractionBusy,
  coalesceMs:100,
  interactionDeferralMs:250,
  setTimeoutFn:(callback)=>{queuedTimeouts.push(callback);return queuedTimeouts.length;},
  clearTimeoutFn:()=>{},
  setIntervalFn:()=>1,
  clearIntervalFn:()=>{},
});
await controller.connect('board-1');
assert.ok(subscriptionHandlers);
subscriptionHandlers.onChange({boardId:'board-1',entity:'item',entityId:'item-1',itemId:'item-1',action:'UPDATE',actorId:'u2',occurredAt:'x'});
subscriptionHandlers.onChange({boardId:'board-1',entity:'cell',entityId:'item-1:col-1',itemId:'item-1',action:'UPDATE',actorId:'u2',occurredAt:'y'});
assert.equal(queuedTimeouts.length,1,'burst changes must coalesce into one synchronization window');
queuedTimeouts.shift()?.();
assert.equal(invalidateCount,0,'remote refetch must not tear down an active local edit/drag interaction');
assert.equal(queuedTimeouts.length,1,'busy interaction must retain the pending remote synchronization batch');
localInteractionBusy=false;
queuedTimeouts.shift()?.();
await new Promise((resolve)=>{ setTimeout(resolve,0); });
assert.equal(invalidateCount,1);
assert.equal(reloadCount,1,'coalesced remote mutations cause one canonical Board refetch');
assert.equal(workspaceReloadCount,1,'same-item changes cause one Item Workspace refresh');
controller.disconnect();
assert.equal(subscriptionDisposed,1);

assert.ok(states.some((snapshot)=>snapshot.state==='live'));
console.log('Stage D M20 Board collaborative Realtime execution vectors: PASS');
