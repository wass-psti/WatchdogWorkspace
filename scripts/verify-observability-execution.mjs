import { createObservability } from '../assets/js/platform/observability/observability.ts';
import { createDiagnostics } from '../assets/js/platform/observability/diagnostics.ts';
import { createBeaconObservabilityTransport } from '../assets/js/platform/observability/beacon-transport.ts';
let assertions = 0;
const assert = (condition, message) => { assertions += 1; if (!condition) throw new Error(`M32 observability execution failed: ${message}`); };
const bytes = (length) => Uint8Array.from({ length }, (_, index) => (index + 1) & 0xff);
let monotonic = 100;
const resource = Object.freeze({ serviceName: 'work-management', serviceVersion: '1.43.2', architectureVersion: 40, runtime: 'vite-esm' });
const service = createObservability({ resource, limit: 40, exportSampleRate: 0, randomBytes: bytes, now: () => new Date('2026-09-10T06:00:00.000Z'), monotonicNow: () => monotonic });
assert(service.sessionId.length === 32, 'session id must be 16 bytes / 32 hex chars');
const log = service.log('info', 'test.log', 'user@example.com Bearer abc.def.ghi', { userId: 'abc', token: 'secret', safe: 'ok' });
assert(log.attributes.userId === '[redacted]' && log.attributes.token === '[redacted]', 'sensitive keyed attributes must be redacted');
assert(String(log.attributes.message).includes('[redacted-email]') && String(log.attributes.message).includes('Bearer [redacted]'), 'sensitive string patterns must be redacted');
assert(log.sampled === false, 'info logs should respect zero export sampling');
const warning = service.log('warning', 'test.warning', 'warn');
assert(warning.sampled === true, 'warnings must always be sampled');
const span = service.startSpan('rpc.request', { route: '/boards/123e4567-e89b-12d3-a456-426614174000' });
assert(/^[0-9a-f]{32}$/.test(span.traceId) && /^[0-9a-f]{16}$/.test(span.spanId), 'span identifiers must use W3C-sized lowercase hex');
monotonic = 112.5;
const ended = span.end({ status: 'ok' });
assert(ended?.durationMs === 12.5 && ended.status === 'ok', 'span duration/status must be recorded');
assert(span.end() === null, 'span must end only once');
const exception = service.exception(new TypeError('failure for ops@example.com'));
assert(exception.signal === 'exception' && exception.severity === 'error' && exception.sampled === true, 'exceptions must be error signals and always sampled');
assert(String(exception.attributes['exception.message']).includes('[redacted-email]'), 'exception message must be sanitized');
const counter = service.counter('realtime.reconnect', 2);
assert(counter.value === 2 && counter.unit === '1', 'counter value/unit must be recorded');
const perf = service.performance('wm:startup:total', 15.25, 'ms');
assert(perf.value === 15.25 && perf.unit === 'ms', 'performance value/unit must be recorded');
for (let index = 0; index < 45; index += 1) service.counter('buffer.test', 1, { index });
assert(service.snapshot().length === 40, 'buffer must remain bounded');
assert(service.status().dropped > 0, 'dropped record count must be reported');
const disabled = await service.flush('manual');
assert(disabled.status === 'disabled', 'flush without transport must remain disabled');
let exportedBatch = null;
const exporter = createObservability({ resource, exportSampleRate: 1, randomBytes: bytes, transport: { export(batch) { exportedBatch = batch; } } });
exporter.counter('export.test', 1);
const exported = await exporter.flush('certification');
assert(exported.status === 'exported' && exported.exported === 1, 'configured transport must export pending sampled records');
assert(exportedBatch?.schema === 'wm-observability-v1' && exportedBatch.reason === 'certification', 'export batch schema/reason must be stable');
const empty = await exporter.flush('again');
assert(empty.status === 'empty', 'successfully exported records must not duplicate on next flush');
const failing = createObservability({ resource, exportSampleRate: 1, randomBytes: bytes, transport: { export() { throw new Error('offline'); } } });
failing.counter('export.failure', 1);
const failed = await failing.flush('test');
assert(failed.status === 'failed' && failing.status().pendingExport === 1, 'failed export must retain pending data');
let diagnostic = null;
const diagnostics = createDiagnostics({ onEntry: (entry) => { diagnostic = entry; } });
diagnostics.warn('BRIDGE_TEST', 'bridge');
assert(diagnostic?.code === 'BRIDGE_TEST', 'diagnostics onEntry bridge must receive recorded entries');
let insecureRejected = false;
try { createBeaconObservabilityTransport({ endpoint: 'http://example.com/telemetry', fetchImpl: async () => new Response(null, { status: 204 }), navigatorLike: null }); } catch { insecureRejected = true; }
assert(insecureRejected, 'non-local HTTP observability export endpoint must be rejected');
let transportRequest = null;
const beaconTransport = createBeaconObservabilityTransport({
  endpoint: 'https://telemetry.example.test/ingest',
  navigatorLike: null,
  fetchImpl: async (input, init) => {
    transportRequest = { input: String(input), credentials: init?.credentials, keepalive: init?.keepalive };
    return new Response(null, { status: 204 });
  },
});
await beaconTransport.export(exportedBatch);
assert(transportRequest?.input.startsWith('https://') && transportRequest?.credentials === 'omit' && transportRequest?.keepalive === true, 'beacon/fetch adapter must use HTTPS with credential omission and keepalive');
console.log(`M32 observability execution vectors: PASS (assertions=${assertions}; buffer=bounded; sampling=verified; tracing=verified; export=verified; redaction=verified)`);
