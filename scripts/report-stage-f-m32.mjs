import { readFile } from 'node:fs/promises';
const target = await readFile(new URL('../config/stage-f-m32-observability-target.ts', import.meta.url), 'utf8');
const state = target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
console.log(`Stage F M32 Observability status: ${state}`);
console.log('Architecture: 40');
console.log('Signals: logs, counters, histograms, spans, exceptions, browser performance');
console.log('Privacy: bounded memory-first buffer; sensitive keys/tokens/emails/UUID path segments redacted');
console.log('Export: optional injectable transport; no production endpoint configured by default');
