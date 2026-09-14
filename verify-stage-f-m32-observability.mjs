import { readFile } from 'node:fs/promises';
const req = async (path) => readFile(new URL(path, import.meta.url), 'utf8');
const target = await req('./config/stage-f-m32-observability-target.ts');
const m31 = await req('./config/stage-f-m31-performance-engineering-target.ts');
const manifest = await req('./config/application-manifest.ts');
const manifestTypes = await req('./src/types/manifest.ts');
const contract = await req('./src/platform/contracts/observability.ts');
const runtime = await req('./assets/js/platform/observability/observability.ts');
const browser = await req('./assets/js/platform/observability/browser-observer.ts');
const beacon = await req('./assets/js/platform/observability/beacon-transport.ts');
const diagnostics = await req('./assets/js/platform/observability/diagnostics.ts');
const platformServices = await req('./assets/js/runtime/platform-services.ts');
const backend = await req('./assets/js/platform/data/backend-client.ts');
const edge = await req('./assets/js/platform/data/edge-function-client.ts');
const app = await req('./assets/js/app.ts');
const m31Verifier = await req('./verify-stage-f-m31-performance-engineering.mjs');
const pkg = JSON.parse(await req('./package.json'));
const checks = [
  ['M31 prerequisite certified', m31.includes("activationState: 'active-certified'")],
  ['M32 state', /activationState: '(?:implementation-complete-pending-certification|active-pending-release-certification|active-certified)'/.test(target)],
  ['architecture >=40', /architectureVersion:\s*(?:4[0-9]|[5-9][0-9]|[1-9][0-9]{2,})/.test(manifest)],
  ['manifest observability authority', manifest.includes("observability: 'vendor-neutral-client-observability-v1'") && manifest.includes("observabilityPrivacy: 'bounded-redacted-memory-first-v1'")],
  ['manifest validation', manifest.includes('Architecture v40+ requires the vendor-neutral bounded/redacted client observability authority')],
  ['manifest types', manifestTypes.includes("readonly observability?: 'vendor-neutral-client-observability-v1'")],
  ['signal contract', ['log','counter','histogram','span','exception','performance'].every((value) => contract.includes(`'${value}'`))],
  ['bounded memory runtime', runtime.includes('const limit = Math.max(40') && runtime.includes('while (records.length > limit)')],
  ['sensitive redaction', runtime.includes('SENSITIVE_KEY') && runtime.includes('JWT_LIKE') && runtime.includes('BEARER') && runtime.includes('EMAIL') && runtime.includes('UUID_SEGMENT')],
  ['W3C-sized identifiers', runtime.includes('hex(randomBytes(16))') && runtime.includes('hex(randomBytes(8))')],
  ['warning/error always sampled', runtime.includes("severity === 'warning' || severity === 'error'")],
  ['optional transport', runtime.includes("status: 'disabled'") && contract.includes('ObservabilityTransport')],
  ['secure identifier generation', runtime.includes("Secure random generation is required for observability trace identifiers.") && !runtime.includes('Math.random()')],
  ['browser global errors', browser.includes("addEventListener('error'") && browser.includes("addEventListener('unhandledrejection'")],
  ['browser performance signals', browser.includes("getEntriesByType('measure')") && browser.includes("observe('longtask'") && browser.includes("observe('largest-contentful-paint'") && browser.includes("observe('layout-shift'")],
  ['pagehide flush', browser.includes("addEventListener('pagehide'") && browser.includes("flush('pagehide')")],
  ['HTTPS export boundary', beacon.includes("resolved.protocol !== 'https:'") && beacon.includes("credentials: 'omit'")],
  ['diagnostics bridge hook', diagnostics.includes('onEntry=options.onEntry??null') && diagnostics.includes('onEntry?.(entry)')],
  ['platform service composition', platformServices.includes('createObservability') && /onEntry:\s*\(entry\)\s*=>\s*observability\.log/.test(platformServices) && /observability,\s*serverState/.test(platformServices)],
  ['backend spans', backend.includes("startSpan('rpc.request'") && backend.includes("startSpan('storage.upload'")],
  ['edge function spans', edge.includes("startSpan('edge_function.invoke'")],
  ['browser installation/runtime exposure', app.includes('installBrowserObservability(observability)') && app.includes("runtimeClient.register('observability'") && app.includes('observabilityStatus: () => observability.status()')],
  ['M31 verifier forward compatible', m31Verifier.includes("['architecture >=39'")],
  ['governed scripts', pkg.scripts?.['observability:check:governed'] === 'node verify-stage-f-m32-observability.mjs' && pkg.scripts?.['observability:test:governed'] === 'node --experimental-strip-types scripts/verify-observability-execution.mjs'],
  ['database unchanged by target', target.includes('migrationRequired: false') && target.includes('schemaChangeRequired: false')],
];
for (const [name, ok] of checks) if (!ok) throw new Error(`M32 verifier failed: ${name}`);
console.log(`Stage F Milestone 32 Observability verification: PASS (architecture=40; checks=${checks.length}; signals=6; privacy=bounded-redacted-memory-first; export=optional)`);
