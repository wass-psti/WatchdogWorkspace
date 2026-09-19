import assert from 'node:assert/strict';
import process from 'node:process';
import { M46_BOARD_CONTRACT_DIGEST,M46_BOARD_CONTRACT_VERSION,M46_BOARD_BACKEND_CONTRACT } from '../config/stage-g-m46-board-backend-contract.ts';

const base=String(process.env.VITE_SUPABASE_URL||process.env.SUPABASE_URL||'').trim().replace(/\/+$/,'');
const key=String(process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_PUBLISHABLE_KEY||'').trim();
if(!base||!key) throw new Error('M47 production invariant verification requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
const response=await fetch(`${base}/rest/v1/rpc/wm_board_contract_attestation`,{method:'POST',headers:{apikey:key,'content-type':'application/json'},body:'{}',signal:AbortSignal.timeout(15000)});
const text=await response.text();
if(!response.ok) throw new Error(`M47 production attestation failed HTTP ${response.status}: ${text.slice(0,500)}`);
let payload; try{payload=JSON.parse(text);}catch{throw new Error('M47 production attestation returned non-JSON data.');}
if(Array.isArray(payload)) payload=payload[0]??{};
assert.equal(payload.contract_version,M46_BOARD_CONTRACT_VERSION,'M47 production verification detected M46 Board contract version drift.');
assert.equal(payload.contract_digest,M46_BOARD_CONTRACT_DIGEST,'M47 production verification detected M46 Board contract digest drift.');
assert.equal(payload.compatible,true,'M47 production verification requires the M46 governed Board contract to remain compatible.');
assert.equal(payload.rpc_count,M46_BOARD_BACKEND_CONTRACT.rpcs.length,'M47 production verification detected Board RPC-count drift.');
assert.equal(payload.m47_semantics_version,'1.43.2-m47-v1','Production M47 semantic attestation version mismatch.');
assert.equal(payload.m47_group_order_ok,true,'Production Board group positions are not contiguous/deterministic.');
assert.equal(payload.m47_active_item_order_ok,true,'Production active Board item positions are not contiguous/deterministic.');
assert.equal(payload.m47_mutation_security_ok,true,'Production M47 mutation RPC security/grant contract mismatch.');
assert.equal(payload.m47_order_indexes_ok,true,'Production M47 ordering/index contract mismatch.');
assert.equal(payload.m47_compatible,true,'Production M47 semantic recovery attestation reports incompatible state.');
console.log(`Stage G M47 production Board invariant verification: PASS (semanticVersion=${payload.m47_semantics_version}; m46Contract=${payload.contract_version}; rpcs=${payload.rpc_count}; groups=${payload.m47_group_order_ok}; activeItems=${payload.m47_active_item_order_ok}; mutationSecurity=${payload.m47_mutation_security_ok}; indexes=${payload.m47_order_indexes_ok})`);
