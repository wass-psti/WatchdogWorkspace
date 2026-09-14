import { readFile } from 'node:fs/promises';
const target = await readFile(new URL('../config/stage-f-m33-service-worker-update-strategy-target.ts', import.meta.url), 'utf8');
const state = target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
console.log(`Stage F M33 Service worker / update strategy status: ${state}`);
console.log('Architecture: 41');
console.log('Activation: explicit user-controlled waiting-worker promotion');
console.log('Cache identity: deterministic build-scoped shell cache');
console.log('Update checks: updateViaCache=none + foreground/online throttled registration.update()');
console.log('Compatibility: legacy SKIP_WAITING alias retained for one migration cycle');
