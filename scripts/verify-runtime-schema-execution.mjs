import assert from 'node:assert/strict';
import {
  applicationManifestSchema,
  applicationRouteSchema,
  embeddedLifecycleEventSchema,
  embeddedLifecycleStateSchema,
  embeddedErrorMessageSchema,
  embeddedModuleIdentityContextSchema,
  embeddedReadyMessageSchema,
  moduleDataRequestSchema,
  moduleIdentityRequestSchema,
  moduleStateRowSchema,
  routeAccessContextSchema,
  runtimeContextSchema,
  workManagementModulesSchema,
} from '../src/runtime-schemas/index.ts';
import { applicationManifest } from '../config/application-manifest.ts';
import { modules } from '../config/modules.ts';

assert.equal(applicationManifestSchema.safeParse(applicationManifest).success, true, 'application manifest must satisfy the M6 schema');
assert.equal(workManagementModulesSchema.safeParse(modules).success, true, 'module manifest must satisfy the M6 schema');
assert.equal(moduleIdentityRequestSchema.safeParse({ type: 'wm:identity:request', moduleId: 'time-tracker' }).success, true);
assert.equal(moduleIdentityRequestSchema.safeParse({ type: 'wm:identity:request', moduleId: 'unknown' }).success, false);

const put = moduleDataRequestSchema.parse({
  type: 'wm:data:request', requestId: 'req-1', moduleId: 'fueltrack-plus', action: 'put', key: 'fueltrackplus.requests.v3', value: '[]',
});
assert.equal(put.action, 'put');
assert.equal(put.scope, 'shared');
assert.equal(put.expectedRevision, null);

const lock = moduleDataRequestSchema.parse({
  type: 'wm:data:request', requestId: 'req-2', moduleId: 'tradelink', action: 'lock:acquire', lockKey: 'document:1', ttlSeconds: 999,
});
assert.equal(lock.action, 'lock:acquire');
assert.equal(lock.ttlSeconds, 120);
assert.equal(moduleDataRequestSchema.safeParse({ type: 'wm:data:request', requestId: 'req-3', moduleId: 'tradelink', action: 'attendance:commit', operation: 'clock-in' }).success, false);
assert.equal(moduleDataRequestSchema.safeParse({ type: 'wm:data:request', requestId: 'req-4', moduleId: 'fueltrack-plus', action: 'activity:list', limit: 0 }).success, false);
const atomic = moduleDataRequestSchema.parse({ type: 'wm:data:request', requestId: 'req-5', moduleId: 'fueltrack-plus', action: 'commit:requests-activity', value: '[]', expectedRevision: null, event: { id: 'event-001', title: 'Committed' } });
assert.equal(atomic.action, 'commit:requests-activity');
assert.equal(atomic.expectedRevision, 0);

const identity = {
  type: 'wm:identity-context', version: 1, moduleId: 'tradelink',
  user: { id: 'user-1', email: 'user@example.test', displayName: 'User' },
  platformRole: 'employee', accountStatus: 'active', module: { role: 'Employee', enabled: true }, updatedAt: '2026-09-06T00:00:00Z',
};
assert.equal(embeddedModuleIdentityContextSchema.safeParse(identity).success, true);
assert.equal(embeddedModuleIdentityContextSchema.safeParse({ ...identity, user: { ...identity.user, displayName: '' } }).success, true);
assert.equal(embeddedModuleIdentityContextSchema.safeParse({ ...identity, platformRole: 'root' }).success, false);
assert.equal(embeddedReadyMessageSchema.safeParse({ type: 'wm:host:ready', detail: { name: 'TradeLink', moduleId: 'tradelink' } }).success, true);
assert.equal(embeddedErrorMessageSchema.safeParse({ type: 'wm:host:error', detail: { name: 'TradeLink', moduleId: 'tradelink', message: '' } }).success, false);
assert.equal(moduleStateRowSchema.safeParse({ state_key: 'k', value: 'v', scope: 'shared', revision: 0 }).success, true);
assert.equal(moduleStateRowSchema.safeParse({ state_key: 'k', value: 'v', scope: 'shared', revision: -1 }).success, false);

assert.equal(applicationRouteSchema.safeParse({ name: 'app', moduleId: 'tradelink' }).success, true);
assert.equal(applicationRouteSchema.safeParse({ name: 'unknown-route' }).success, false);
assert.equal(routeAccessContextSchema.safeParse({ route: { name: 'boards' }, initialized: true, status: 'authenticated', authenticated: true }).success, true);
assert.equal(runtimeContextSchema.safeParse({ route: 'boards', authenticated: true, nested: { boardId: 'b1' } }).success, true);
assert.equal(runtimeContextSchema.safeParse({ bad: new Date() }).success, false);
assert.equal(embeddedLifecycleStateSchema.safeParse({ kind: 'ready', generation: 2, moduleId: 'time-tracker' }).success, true);
assert.equal(embeddedLifecycleStateSchema.safeParse({ kind: 'ready', generation: -1, moduleId: 'time-tracker' }).success, false);
assert.equal(embeddedLifecycleEventSchema.safeParse({ type: 'dispose' }).success, true);

console.log('Stage B M6 runtime schema execution vectors: PASS');
