import assert from 'node:assert/strict';

await import('../apps/fueltrack-plus/stability-runtime.js');
const { createConfirmedStateWriter, createMutationGate, createSerialTaskQueue, createStoreChangeBridge, divergenceCode } = globalThis.WMFuelTrackStability;

const memory=new Map([['prefs','{"theme":"dark"}']]);
const writer=createConfirmedStateWriter({
  getItem:key=>memory.get(key)??null,
  async setItemAsync(key,value){memory.set(key,value);return true;},
});
await writer.writeJson('prefs',{theme:'light'});
assert.equal(memory.get('prefs'),'{"theme":"light"}');

const merging=createConfirmedStateWriter({
  value:'old',
  getItem(){return this.value;},
  async setItemAsync(){this.value='merged-remote-value';return true;},
});
await assert.rejects(async()=>merging.writeRaw('requests','intended'),error=>error?.code===divergenceCode);

const gate=createMutationGate();
let release;
const first=gate.run('request:FTR-1',()=>new Promise(resolve=>{release=resolve;}));
const second=await gate.run('request:FTR-1',async()=>true);
assert.equal(second.accepted,false);
release?.('done');
assert.deepEqual(await first,{accepted:true,value:'done'});

const serialQueue=createSerialTaskQueue();
const order=[];
let releaseSerial;
const serialFirst=serialQueue.run('prefs',async()=>{order.push('first:start');await new Promise(resolve=>{releaseSerial=resolve;});order.push('first:end');return 1;});
const serialSecond=serialQueue.run('prefs',async()=>{order.push('second');return 2;});
await new Promise(resolve=>{ setImmediate(resolve); });
assert.deepEqual(order,['first:start']);
releaseSerial?.();
assert.equal(await serialFirst,1);
assert.equal(await serialSecond,2);
assert.deepEqual(order,['first:start','first:end','second']);

const events=new EventTarget();
const previousWindow=globalThis.window;
globalThis.window=events;
const changes=[];
const bridge=createStoreChangeBridge({keys:['requests'],onChange:change=>changes.push(change.key)});
const fallback=new Event('wm:module-store-change');
Object.defineProperty(fallback,'detail',{value:{key:'requests',oldValue:'a',newValue:'b'}});
events.dispatchEvent(fallback);
const storage=new Event('storage');
Object.defineProperty(storage,'key',{value:'requests'});
events.dispatchEvent(storage);
assert.deepEqual(changes,['requests','requests']);
bridge.dispose();
globalThis.window=previousWindow;

console.log('Stage E M24 FuelTrack+ stabilization execution vectors: PASS');
