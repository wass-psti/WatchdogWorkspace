import assert from 'node:assert/strict';
const base=String(process.env.VITE_SUPABASE_URL||process.env.SUPABASE_URL||'').trim().replace(/\/+$/,'');
const key=String(process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_PUBLISHABLE_KEY||'').trim();
if(!base||!key)throw new Error('M50 production verification requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
const response=await fetch(`${base}/rest/v1/rpc/wm_item_workspace_recovery_attestation`,{method:'POST',headers:{apikey:key,'content-type':'application/json'},body:'{}',signal:AbortSignal.timeout(15000)});const text=await response.text();if(!response.ok)throw new Error(`M50 production attestation failed HTTP ${response.status}: ${text.slice(0,500)}`);let payload=JSON.parse(text);if(Array.isArray(payload))payload=payload[0]??{};
assert.equal(payload.m50_semantics_version,'1.43.2-m50-v1');for(const keyName of ['bucket_ok','read_policy_ok','insert_policy_ok','delete_policy_ok','rpc_security_ok','mutation_authority_ok','registration_ownership_ok','item_delete_guard_ok','board_delete_guard_ok','compatible'])assert.equal(payload[keyName],true,`M50 production attestation ${keyName} failed.`);
console.log('Stage G M50 production Rich Item Workspace/Storage verification: PASS (semantics=1.43.2-m50-v1; privateBucket=true; editMutation=true; storageOwnership=true; itemDeleteGuard=true; boardDeleteGuard=true)');
