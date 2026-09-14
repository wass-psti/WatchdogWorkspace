import fs from 'node:fs/promises';
import { buildBrowserRuntimeBundle } from '../tests/browser/build-runtime-bundle.mjs';

const code = await buildBrowserRuntimeBundle();
if (!code.includes('__wmBrowserRuntimeBundleReady')) {
  throw new Error('Browser runtime bundle is missing its readiness sentinel.');
}
if (code.length < 10_000) {
  throw new Error(`Browser runtime bundle is unexpectedly small (${code.length} bytes).`);
}
console.log(`Stage B M6 browser runtime bundle verification: PASS (${code.length} bytes, self-contained IIFE)`);


const cdpHarness = await fs.readFile(new URL('../tests/browser/run-cdp.mjs', import.meta.url), 'utf8');
for (const required of [
  "import http from 'node:http'",
  "harnessServer.listen(0, '127.0.0.1'",
  "Page.navigate",
  "localStorage.setItem(key, 'ok')",
  "harnessServer.close(resolve)",
]) {
  if (!cdpHarness.includes(required)) {
    throw new Error(`Browser integration harness is missing the storage-capable loopback-origin contract: ${required}`);
  }
}
console.log('Stage B M6 browser storage-origin verification: PASS');
