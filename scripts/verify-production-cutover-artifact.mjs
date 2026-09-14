import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED = [
  'index.html',
  'service-worker.js',
  'manifest.webmanifest',
  'config/runtime-assets.js',
  'assets/js/runtime/module-bootstrap.js',
  'assets/js/runtime/motion-orchestrator.js',
  'assets/js/runtime/motion-design.js',
];

const SOURCE_ENTRY = String.raw`(?:\/{1,2}|\.\/{1,2}|\.\.\/)*src\/main\.(?:ts|tsx|js|jsx)`;
const DEV_HOST_URL = String.raw`(?:https?:)?\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:[/?#][^"'\s)]*)?`;

const FAIL_CLOSED_REFERENCE_PATTERNS = [
  Object.freeze({
    label: 'unresolved Vite base placeholder',
    appliesTo: /\.(?:html?|js|mjs|cjs|css|json|webmanifest|txt)$/i,
    pattern: /%BASE_URL%/i,
  }),
  Object.freeze({
    label: 'HTML source-entry resource reference',
    appliesTo: /\.(?:html|htm)$/i,
    pattern: new RegExp(String.raw`\b(?:src|href)\s*=\s*["'][^"']*${SOURCE_ENTRY}(?:[?#][^"']*)?["']`, 'i'),
  }),
  Object.freeze({
    label: 'HTML development-host resource reference',
    appliesTo: /\.(?:html|htm)$/i,
    pattern: new RegExp(String.raw`\b(?:src|href|action)\s*=\s*["']${DEV_HOST_URL}["']`, 'i'),
  }),
  Object.freeze({
    label: 'HTML Vite development client reference',
    appliesTo: /\.(?:html|htm)$/i,
    pattern: /\b(?:src|href)\s*=\s*["'][^"']*\/@vite\/client\b[^"']*["']/i,
  }),
  Object.freeze({
    label: 'JavaScript static source-entry import/export',
    appliesTo: /\.(?:js|mjs|cjs)$/i,
    pattern: new RegExp(String.raw`\b(?:import|export)\s+(?:[^;\n]*?\s+from\s+)?["']${SOURCE_ENTRY}(?:[?#][^"']*)?["']`, 'i'),
  }),
  Object.freeze({
    label: 'JavaScript dynamic source-entry import',
    appliesTo: /\.(?:js|mjs|cjs)$/i,
    pattern: new RegExp(String.raw`\bimport\s*\(\s*["']${SOURCE_ENTRY}(?:[?#][^"']*)?["']\s*\)`, 'i'),
  }),
  Object.freeze({
    label: 'JavaScript Vite development client import',
    appliesTo: /\.(?:js|mjs|cjs)$/i,
    pattern: /\b(?:import|export)\s+(?:[^;\n]*?\s+from\s+)?["'][^"']*\/@vite\/client\b[^"']*["']|\bimport\s*\(\s*["'][^"']*\/@vite\/client\b[^"']*["']\s*\)/i,
  }),
  Object.freeze({
    label: 'JavaScript source-entry network/worker URL',
    appliesTo: /\.(?:js|mjs|cjs)$/i,
    pattern: new RegExp(String.raw`\b(?:fetch|Worker|SharedWorker|EventSource|WebSocket|importScripts)\s*\(\s*["']${SOURCE_ENTRY}(?:[?#][^"']*)?["']`, 'i'),
  }),
  Object.freeze({
    label: 'JavaScript development-host network/worker URL',
    appliesTo: /\.(?:js|mjs|cjs)$/i,
    pattern: new RegExp(String.raw`\b(?:fetch|Worker|SharedWorker|EventSource|WebSocket|importScripts)\s*\(\s*["']${DEV_HOST_URL}["']`, 'i'),
  }),
  Object.freeze({
    label: 'JavaScript XHR development-host URL',
    appliesTo: /\.(?:js|mjs|cjs)$/i,
    pattern: new RegExp(String.raw`\.open\s*\(\s*["'][A-Z]+["']\s*,\s*["']${DEV_HOST_URL}["']`, 'i'),
  }),
  Object.freeze({
    label: 'JavaScript sendBeacon development-host URL',
    appliesTo: /\.(?:js|mjs|cjs)$/i,
    pattern: new RegExp(String.raw`\bsendBeacon\s*\(\s*["']${DEV_HOST_URL}["']`, 'i'),
  }),
  Object.freeze({
    label: 'JavaScript source-entry URL construction',
    appliesTo: /\.(?:js|mjs|cjs)$/i,
    pattern: new RegExp(String.raw`\bnew\s+URL\s*\(\s*["']${SOURCE_ENTRY}(?:[?#][^"']*)?["']`, 'i'),
  }),
  Object.freeze({
    label: 'JavaScript DOM source-entry assignment',
    appliesTo: /\.(?:js|mjs|cjs)$/i,
    pattern: new RegExp(String.raw`\b(?:src|href)\s*=\s*["']${SOURCE_ENTRY}(?:[?#][^"']*)?["']`, 'i'),
  }),
  Object.freeze({
    label: 'JavaScript DOM development-host assignment',
    appliesTo: /\.(?:js|mjs|cjs)$/i,
    pattern: new RegExp(String.raw`\b(?:src|href)\s*=\s*["']${DEV_HOST_URL}["']`, 'i'),
  }),
  Object.freeze({
    label: 'JavaScript DOM source-entry attribute',
    appliesTo: /\.(?:js|mjs|cjs)$/i,
    pattern: new RegExp(String.raw`\bsetAttribute\s*\(\s*["'](?:src|href)["']\s*,\s*["']${SOURCE_ENTRY}(?:[?#][^"']*)?["']`, 'i'),
  }),
  Object.freeze({
    label: 'JavaScript DOM development-host attribute',
    appliesTo: /\.(?:js|mjs|cjs)$/i,
    pattern: new RegExp(String.raw`\bsetAttribute\s*\(\s*["'](?:src|href)["']\s*,\s*["']${DEV_HOST_URL}["']`, 'i'),
  }),
  Object.freeze({
    label: 'JavaScript service-worker source-entry registration',
    appliesTo: /\.(?:js|mjs|cjs)$/i,
    pattern: new RegExp(String.raw`\bserviceWorker\.register\s*\(\s*["']${SOURCE_ENTRY}(?:[?#][^"']*)?["']`, 'i'),
  }),
  Object.freeze({
    label: 'JavaScript service-worker development-host registration',
    appliesTo: /\.(?:js|mjs|cjs)$/i,
    pattern: new RegExp(String.raw`\bserviceWorker\.register\s*\(\s*["']${DEV_HOST_URL}["']`, 'i'),
  }),
  Object.freeze({
    label: 'CSS source-entry URL reference',
    appliesTo: /\.css$/i,
    pattern: new RegExp(String.raw`\burl\s*\(\s*["']?${SOURCE_ENTRY}(?:[?#][^"')\s]*)?["']?\s*\)`, 'i'),
  }),
  Object.freeze({
    label: 'CSS development-host URL reference',
    appliesTo: /\.css$/i,
    pattern: new RegExp(String.raw`\burl\s*\(\s*["']?${DEV_HOST_URL}["']?\s*\)`, 'i'),
  }),
  Object.freeze({
    label: 'JSON/webmanifest development-host URL',
    appliesTo: /\.(?:json|webmanifest)$/i,
    pattern: new RegExp(String.raw`["']${DEV_HOST_URL}["']`, 'i'),
  }),
];

function findFailClosedReference(relativePath, text) {
  for (const { label, appliesTo, pattern } of FAIL_CLOSED_REFERENCE_PATTERNS) {
    if (appliesTo.test(relativePath) && pattern.test(text)) return label;
  }
  return null;
}

export function verifyProductionCutoverArtifact(distPath) {
  const dist = path.resolve(distPath);
  if (!fs.existsSync(dist) || !fs.statSync(dist).isDirectory()) {
    throw new Error(`Production dist directory not found: ${dist}`);
  }

  for (const rel of REQUIRED) {
    const file = path.join(dist, rel);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      throw new Error(`Required production artifact missing: ${rel}`);
    }
  }

  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push(full);
    }
  };
  walk(dist);

  const maps = files.filter((file) => file.endsWith('.map'));
  if (maps.length) {
    throw new Error(`Production source maps are forbidden: ${maps.map((file) => path.relative(dist, file)).join(', ')}`);
  }

  const textCandidates = files.filter((file) => /\.(?:html?|js|mjs|cjs|css|json|webmanifest|txt)$/i.test(file));
  for (const file of textCandidates) {
    const relativePath = path.relative(dist, file).replaceAll(path.sep, '/');
    const text = fs.readFileSync(file, 'utf8');
    const failClosedReference = findFailClosedReference(relativePath, text);
    if (failClosedReference) {
      throw new Error(`${failClosedReference} found in ${relativePath}`);
    }
  }

  const index = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  if (!/\.\/build\/index-[^"']+\.js/.test(index)) {
    throw new Error('dist/index.html does not reference a hashed production JS entry.');
  }
  if (!/\.\/build\/index-[^"']+\.css/.test(index)) {
    throw new Error('dist/index.html does not reference a hashed production CSS entry.');
  }

  const sw = fs.readFileSync(path.join(dist, 'service-worker.js'), 'utf8');
  if (!sw.includes('work-management-v1.43.2')) {
    throw new Error('Production service worker does not carry the v1.43.2 cache identity.');
  }

  return Object.freeze({
    files: files.length,
    sourceMaps: 0,
    required: REQUIRED.length,
    sourceEntryPolicy: 'executable-reference-only-v2',
    developmentHostPolicy: 'network-resource-reference-only-v2',
  });
}

const invoked = fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '');
if (invoked) {
  try {
    const dist = process.argv[2] ?? path.resolve(import.meta.dirname, '../dist');
    const result = verifyProductionCutoverArtifact(dist);
    console.log(`Production cutover artifact verification: PASS (files=${result.files}; required=${result.required}; sourceMaps=0; sourceEntryPolicy=${result.sourceEntryPolicy}; developmentHostPolicy=${result.developmentHostPolicy})`);
  } catch (error) {
    console.error(`Production cutover artifact verification: FAIL — ${error.message}`);
    process.exit(1);
  }
}
