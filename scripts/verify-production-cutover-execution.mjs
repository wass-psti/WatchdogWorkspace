import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { verifyProductionCutoverArtifact } from './verify-production-cutover-artifact.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-m36-cutover-'));
const write = (rel, text = 'x') => {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};

const seed = () => {
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });
  write('index.html', '<link rel="stylesheet" href="./build/index-abc.css"><script type="module" src="./build/index-abc.js"></script>');
  write('build/index-abc.js', 'console.log("production")');
  write('build/index-abc.css', 'body{}');
  write('service-worker.js', "const CACHE='work-management-v1.43.2-build-test';");
  write('manifest.webmanifest', '{}');
  write('config/runtime-assets.js', 'export const runtimeAssets=[];');
  write('assets/js/runtime/module-bootstrap.js', 'export{};');
  write('assets/js/runtime/motion-orchestrator.js', 'export{};');
  write('assets/js/runtime/motion-design.js', 'export{};');
};

const expectPass = (mutate, label) => {
  seed();
  mutate();
  try {
    verifyProductionCutoverArtifact(root);
  } catch (error) {
    throw new Error(`${label} should pass but failed: ${error.message}`);
  }
};

const expectFail = (mutate, label) => {
  seed();
  mutate();
  let failed = false;
  try {
    verifyProductionCutoverArtifact(root);
  } catch {
    failed = true;
  }
  if (!failed) throw new Error(`${label} should fail closed`);
};

try {
  seed();
  const ok = verifyProductionCutoverArtifact(root);
  if (
    ok.required !== 7
    || ok.sourceEntryPolicy !== 'executable-reference-only-v2'
    || ok.developmentHostPolicy !== 'network-resource-reference-only-v2'
  ) {
    throw new Error('valid production fixture did not verify with the corrective reference policies');
  }

  expectPass(() => {
    write('build/platform.js', 'const manifest={performanceStartupInstrumentation:"src/main.ts",sourceEntry:"src/main.ts"};console.log(manifest);');
  }, 'bundled source-identity metadata vector');

  expectPass(() => {
    write('.vite/manifest.json', JSON.stringify({
      'index.html': { file: 'build/index-abc.js', src: 'src/main.ts', isEntry: true },
    }));
  }, 'Vite manifest source-identity metadata vector');

  expectPass(() => {
    write('build/observability.js', 'const base=typeof location!=="undefined"?location.href:"https://localhost/";const resolved=new URL(endpoint,base);if(resolved.hostname!=="localhost"&&resolved.hostname!=="127.0.0.1"){}');
  }, 'development-host policy/fallback metadata vector');

  expectFail(() => write('build/leak.js.map', '{}'), 'source-map vector');
  expectFail(() => write('build/index-abc.js', 'fetch("http://localhost:5173/api")'), 'development-host fetch vector');
  expectFail(() => write('build/index-abc.js', 'const script=document.createElement("script");script.src="http://127.0.0.1:5173/app.js";'), 'development-host DOM resource vector');
  expectFail(() => fs.rmSync(path.join(root, 'service-worker.js')), 'missing-service-worker vector');
  expectFail(() => write('index.html', '<script type="module" src="/src/main.ts"></script>'), 'HTML source-entry vector');
  expectFail(() => write('build/index-abc.js', 'import("/src/main.ts")'), 'dynamic source-entry vector');
  expectFail(() => write('build/index-abc.js', 'import boot from "/src/main.ts";boot();'), 'static source-entry vector');
  expectFail(() => write('build/index-abc.js', 'fetch("/src/main.ts")'), 'network source-entry vector');
  expectFail(() => write('build/index-abc.js', 'const script=document.createElement("script");script.src="/src/main.ts";'), 'DOM source-entry assignment vector');
  expectFail(() => write('build/index-abc.js', 'const script=document.createElement("script");script.setAttribute("src","/src/main.ts");'), 'DOM source-entry attribute vector');
  expectFail(() => write('build/index-abc.js', 'navigator.serviceWorker.register("/src/main.ts")'), 'service-worker source-entry registration vector');
  expectFail(() => write('index.html', '<script type="module" src="/@vite/client"></script><link rel="stylesheet" href="./build/index-abc.css"><script type="module" src="./build/index-abc.js"></script>'), 'Vite development-client HTML vector');
  expectFail(() => write('build/index-abc.js', 'import "/@vite/client";'), 'Vite development-client import vector');
  expectFail(() => write('build/index-abc.js', 'console.log("%BASE_URL%")'), 'unresolved Vite base placeholder vector');

  console.log('Stage F M36 production cutover execution verification: PASS (vectors=18; allowMetadata=3; failClosed=14; sourceEntryPolicy=executable-reference-only-v2; developmentHostPolicy=network-resource-reference-only-v2)');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
