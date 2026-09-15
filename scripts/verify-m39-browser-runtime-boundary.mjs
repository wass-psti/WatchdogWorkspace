import assert from 'node:assert/strict';
import {
  executeM39Runtime,
  retryM39RuntimeBoundary,
  waitForM39BackendPreflight,
  waitForM39Identity,
} from '../tests/modern/e2e/helpers/m39-auth-fixture.mjs';

let vectors = 0;
const pass = (name) => { vectors += 1; console.log(`PASS: ${name}`); };

{
  let attempts = 0;
  const result = await retryM39RuntimeBoundary(async () => {
    attempts += 1;
    if (attempts === 1) throw new Error('Execution context was destroyed, most likely because of a navigation.');
    if (attempts === 2) return { ready:false, reason:'runtime-api-unavailable' };
    return { ready:true, snapshot:{ profile:{ platform_role:'admin_general_manager' } } };
  }, { timeout:500, pollMs:0, label:'fixture boundary regression' });
  assert.equal(attempts, 3);
  assert.equal(result.snapshot.profile.platform_role, 'admin_general_manager');
  pass('runtime boundary retries document replacement and unavailable authority before consuming a coherent value');
}

{
  let evaluateCalls = 0;
  const page = {
    waitForFunction() { throw new Error('split readiness/value polling must not be used'); },
    async evaluate(_fn, arg) {
      evaluateCalls += 1;
      assert.deepEqual(arg, { role:'employee', status:'active' });
      if (evaluateCalls === 1) throw new Error('Execution context was destroyed');
      return {
        ready:true,
        snapshot:{
          isAuthenticated:true,
          profile:{ platform_role:'employee', status:'active' },
          assignments:[{ module_id:'time-tracker', enabled:true }],
          sessionPersistence:'persistent',
        },
      };
    },
  };
  const snapshot = await waitForM39Identity(page, { role:'employee', timeout:500 });
  assert.equal(evaluateCalls, 2);
  assert.equal(snapshot.profile.platform_role, 'employee');
  assert.equal(snapshot.sessionPersistence, 'persistent');
  pass('identity readiness and identity value are returned by one retryable page-evaluation boundary');
}

{
  let evaluateCalls = 0;
  const page = {
    async evaluate(_fn, arg) {
      evaluateCalls += 1;
      assert.equal(arg, 'time-tracker');
      if (evaluateCalls === 1) return { ready:false, reason:'backend-preflight-not-ready' };
      return { ready:true, snapshot:{ state:'ready', modules:{ 'time-tracker':{ ready:true } } } };
    },
  };
  const snapshot = await waitForM39BackendPreflight(page, 'time-tracker', { timeout:500 });
  assert.equal(evaluateCalls, 2);
  assert.equal(snapshot.state, 'ready');
  assert.equal(snapshot.modules['time-tracker'].ready, true);
  pass('backend capability readiness is consumed atomically through the same hosted runtime boundary');
}

{
  let evaluateCalls = 0;
  const page = {
    async evaluate(_fn, arg) {
      evaluateCalls += 1;
      assert.equal(arg.operation, 'identity.revalidate');
      if (evaluateCalls === 1) return { ready:false, reason:'runtime-execute-unavailable' };
      return { ready:true, value:{ status:'disabled', isAccountActive:false } };
    },
  };
  const result = await executeM39Runtime(page, 'identity.revalidate', undefined, { timeout:500 });
  assert.equal(evaluateCalls, 2);
  assert.equal(result.status, 'disabled');
  assert.equal(result.isAccountActive, false);
  pass('idempotent identity revalidation executes only inside an available runtime authority boundary');
}


{
  let attempts = 0;
  await assert.rejects(
    () => retryM39RuntimeBoundary(async () => {
      attempts += 1;
      throw new Error('Authoritative identity revalidation rejected by backend policy');
    }, { timeout:500, pollMs:0, label:'terminal operation regression' }),
    /rejected by backend policy/,
  );
  assert.equal(attempts, 1);
  pass('non-navigation runtime errors fail immediately instead of being retried as readiness noise');
}


{
  const page = { async evaluate() { throw new Error('must not evaluate non-idempotent operations'); } };
  await assert.rejects(
    () => executeM39Runtime(page, 'users.update'),
    /restricted to idempotent identity\.revalidate/,
  );
  pass('retryable hosted runtime execution is restricted to the idempotent identity revalidation command');
}

console.log(`M39 hosted browser runtime-boundary regression: PASS (vectors=${vectors}; splitReadinessConsumption=false; documentReplacementRetry=true)`);
