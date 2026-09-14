import assert from 'node:assert/strict';
import { QueryClient as NativeQueryClient } from '@tanstack/react-query';
import { createQueryClient, queryKey } from '../assets/js/platform/data/query-client.ts';
import {
  TANSTACK_QUERY_VERSION,
  createTanStackQueryClient,
  workManagementTanStackQueryClient,
} from '../assets/js/platform/data/tanstack-query-client.ts';

assert.equal(TANSTACK_QUERY_VERSION, '5.102.8');
assert.ok(workManagementTanStackQueryClient instanceof NativeQueryClient, 'shared page-lifetime query client must be a native TanStack QueryClient');

const native = createTanStackQueryClient({ defaultStaleTime: 20_000 });
assert.ok(native instanceof NativeQueryClient);
const client = createQueryClient({ defaultStaleTime: 20_000 }, native);

assert.equal(queryKey('boards', { b: 2, a: 1 }), queryKey('boards', { a: 1, b: 2 }));
assert.notEqual(queryKey('boards', ['a', 'b']), queryKey('boards', 'a', 'b'));

const events = [];
const unsubscribe = client.subscribe((event) => events.push(event.type));

let fetches = 0;
let releaseFetch;
const gate = new Promise((resolve) => { releaseFetch = resolve; });
const request = () => client.fetchQuery({
  key: ['m8', 'board', 'b1'],
  queryFn: async ({ signal }) => {
    assert.equal(signal.aborted, false);
    fetches += 1;
    await gate;
    return { id: 'b1', fetches };
  },
});

const first = request();
const second = request();
assert.equal(fetches, 0, 'M8 facade must preserve the pre-M8 query-function microtask boundary');
await Promise.resolve();
assert.equal(fetches, 1, 'TanStack Query must deduplicate concurrent requests with the same query key');
releaseFetch();
assert.deepEqual(await first, { id: 'b1', fetches: 1 });
assert.deepEqual(await second, { id: 'b1', fetches: 1 });
assert.equal(events.filter((type) => type === 'query:success').length, 1, 'deduplicated followers must not emit duplicate compatibility success events');

assert.deepEqual(
  await client.fetchQuery({ key: ['m8', 'board', 'b1'], queryFn: async () => ({ id: 'unexpected' }) }),
  { id: 'b1', fetches: 1 },
  'fresh TanStack cache must be reused',
);
assert.equal(fetches, 1);
assert.equal(events.filter((type) => type === 'query:success').length, 1, 'fresh cache reads must preserve pre-M8 no-event behavior');

assert.equal(client.invalidateQueries(['m8', 'board']), 1);
assert.equal(client.snapshot().find((entry) => entry.key.includes('b1'))?.updatedAt, 0, 'compatibility snapshot must expose invalidated TanStack queries as stale');
const refreshed = await client.fetchQuery({ key: ['m8', 'board', 'b1'], queryFn: async () => ({ id: 'b1', fetches: ++fetches }) });
assert.deepEqual(refreshed, { id: 'b1', fetches: 2 });

// TanStack supports object-partial query matching natively. Work Management's
// previous client did not, so M8 must retain exact top-level segment matching.
client.setQueryData(['m8', 'object', { a: 1 }], 'exact');
client.setQueryData(['m8', 'object', { a: 1, b: 2 }], 'broader');
assert.equal(client.invalidateQueries(['m8', 'object', { a: 1 }]), 1, 'M8 prefix invalidation must not widen object-key scope');
assert.equal(client.snapshot().filter((entry) => entry.updatedAt === 0 && entry.key.includes('object')).length, 1);

// Existing repositories allow synchronous mutation functions. TanStack's core
// mutation function is promise-based, so the facade must adapt that contract.
const mutation = await client.mutate({
  key: ['m8', 'mutation', 'rename'],
  input: 'Renamed',
  mutationFn: (input) => input.toUpperCase(),
  invalidate: [['m8', 'board']],
});
assert.equal(mutation, 'RENAMED');
assert.ok(events.includes('mutation:start'));
assert.ok(events.includes('mutation:success'));
assert.equal(client.snapshot().find((entry) => entry.key.includes('b1'))?.updatedAt, 0);

client.setQueryData(['m8', 'manual'], { ok: true }, { updatedAt: 1234 });
assert.deepEqual(client.getQueryData(['m8', 'manual']), { ok: true });
assert.equal(client.snapshot().find((entry) => entry.key.includes('manual'))?.updatedAt, 1234);
assert.equal(client.removeQueries(['m8', 'manual']), 1);
assert.equal(client.getQueryData(['m8', 'manual']), undefined);

unsubscribe();
client.clear();
assert.equal(client.snapshot().length, 0);

console.log('Stage B M8 TanStack Query execution vectors: PASS');
