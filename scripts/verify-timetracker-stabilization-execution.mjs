import assert from 'node:assert/strict';
await import('../apps/time-tracker/stability-runtime.js');
const { createConfirmedStateWriter, createMutationGate, installModuleStoreChangeBridge } = globalThis.WMTimeTrackerStability;

const calls=[];
const memory=new Map([['shared','old']]);
const store={
  getItem:key=>memory.get(key)??null,
  async setItemAsync(key,value){calls.push([key,value]);memory.set(key,value);return true;},
};
const writer=createConfirmedStateWriter(store);
await writer.write({key:'shared',backupKey:'backup',value:'new'});
assert.deepEqual(calls,[['backup','old'],['shared','new']]);
assert.equal(memory.get('shared'),'new');

const failing=createConfirmedStateWriter({getItem:()=>null,async setItemAsync(){throw new Error('commit failed');}});
await assert.rejects(()=>failing.write({key:'shared',value:'new'}),/commit failed/);

const merging=createConfirmedStateWriter({
  value:'old',
  getItem(){return this.value;},
  async setItemAsync(_key,_value){this.value='merged-remote-value';return true;},
});
await assert.rejects(()=>merging.write({key:'shared',value:'intended-value'}),/changed while shared was being committed/);

const gate=createMutationGate();
let release;
const first=gate.run(()=>new Promise(resolve=>{release=resolve;}));
const second=await gate.run(async()=>true);
assert.equal(second.executed,false);
release?.('done');
const firstResult=await first;
assert.equal(firstResult.executed,true);
assert.equal(firstResult.value,'done');

const target=new EventTarget();
const changes=[];
const bridge=installModuleStoreChangeBridge(target,(change)=>changes.push(change));
const custom=new Event('wm:module-store-change');
Object.defineProperty(custom,'detail',{value:{key:'timetracker.attendance.v1',oldValue:'a',newValue:'b'}});
target.dispatchEvent(custom);
const storage=new Event('storage');
Object.defineProperties(storage,{key:{value:'timetracker.ot.v1'},oldValue:{value:'old'},newValue:{value:'new'}});
target.dispatchEvent(storage);
assert.deepEqual(changes,[
  {key:'timetracker.attendance.v1',oldValue:'a',newValue:'b'},
  {key:'timetracker.ot.v1',oldValue:'old',newValue:'new'},
]);
bridge.dispose();
const afterDispose=new Event('wm:module-store-change');
Object.defineProperty(afterDispose,'detail',{value:{key:'x',oldValue:null,newValue:'y'}});
target.dispatchEvent(afterDispose);
assert.equal(changes.length,2);

console.log('Stage E M23 TimeTracker stabilization execution vectors: PASS');
