import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function toFileSystemPath(value) {
  return value instanceof URL ? fileURLToPath(value) : String(value);
}

export function findManifestEntryKey(manifest, entrySource = 'index.html') {
  if (manifest[entrySource]?.isEntry) return entrySource;
  const matches = Object.entries(manifest).filter(([, record]) => record?.isEntry && record?.src === entrySource);
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one Vite manifest entry for ${entrySource}; found ${matches.length}.`);
  }
  return matches[0][0];
}

export function collectStaticManifestClosure(manifest, entryKey) {
  const visited = new Set();
  const visit = (key) => {
    if (visited.has(key)) return;
    const record = manifest[key];
    if (!record) throw new Error(`Vite manifest references missing static import: ${key}`);
    visited.add(key);
    for (const dependency of record.imports || []) visit(dependency);
  };
  visit(entryKey);
  return visited;
}

function collectFilesForKeys(manifest, keys) {
  const js = new Set();
  const css = new Set();
  for (const key of keys) {
    const record = manifest[key];
    if (!record) continue;
    if (typeof record.file === 'string' && record.file.endsWith('.js')) js.add(record.file);
    for (const file of record.css || []) if (file.endsWith('.css')) css.add(file);
  }
  return { js, css };
}

export function collectAllManifestJavaScript(manifest) {
  return new Set(Object.values(manifest)
    .map((record) => record?.file)
    .filter((file) => typeof file === 'string' && file.endsWith('.js')));
}

async function sizeOfFiles(distRoot, files) {
  const root = toFileSystemPath(distRoot);
  const entries = [];
  for (const file of files) {
    const absolute = resolve(root, file);
    const bytes = (await stat(absolute)).size;
    entries.push({ file, bytes });
  }
  return entries;
}

export async function walkBuildFiles(distRoot) {
  const root = toFileSystemPath(distRoot);
  const output = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else output.push({ file: relative(root, path), bytes: (await stat(path)).size });
    }
  }
  await walk(root);
  return output;
}

export async function analyzePerformanceBudget({ distRoot, budgets }) {
  const root = toFileSystemPath(distRoot);
  const manifestPath = resolve(root, '.vite/manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const entryKey = findManifestEntryKey(manifest, budgets.entrySource || 'index.html');
  const initialKeys = collectStaticManifestClosure(manifest, entryKey);
  const initialFiles = collectFilesForKeys(manifest, initialKeys);
  const allManifestJs = collectAllManifestJavaScript(manifest);

  const [initialJs, initialCss, allJs, buildFiles] = await Promise.all([
    sizeOfFiles(root, initialFiles.js),
    sizeOfFiles(root, initialFiles.css),
    sizeOfFiles(root, allManifestJs),
    walkBuildFiles(root),
  ]);

  const sum = (entries) => entries.reduce((total, entry) => total + entry.bytes, 0);
  const largest = (entries) => entries.reduce((max, entry) => entry.bytes > max.bytes ? entry : max, { file: null, bytes: 0 });

  return Object.freeze({
    entryKey,
    initialManifestKeys: Object.freeze([...initialKeys]),
    initialJs: Object.freeze(initialJs),
    initialCss: Object.freeze(initialCss),
    allManifestJs: Object.freeze(allJs),
    initialJsRawBytes: sum(initialJs),
    initialCssRawBytes: sum(initialCss),
    largestInitialChunk: Object.freeze(largest(initialJs)),
    totalManifestJsRawBytes: sum(allJs),
    largestAnyJsChunk: Object.freeze(largest(allJs)),
    totalBuildRawBytes: sum(buildFiles),
    buildFileCount: buildFiles.length,
  });
}

export function enforcePerformanceBudgets(metrics, budgets) {
  const failures = [];
  const check = (name, actual, limit) => {
    if (!Number.isFinite(limit)) throw new Error(`Missing numeric performance budget: ${name}`);
    if (actual > limit) failures.push(`${name}: ${actual} > ${limit}`);
  };
  check('initialJsRawBytes', metrics.initialJsRawBytes, budgets.initialJsRawBytes);
  check('initialCssRawBytes', metrics.initialCssRawBytes, budgets.initialCssRawBytes);
  check('largestInitialChunkRawBytes', metrics.largestInitialChunk.bytes, budgets.largestInitialChunkRawBytes);
  check('totalManifestJsRawBytes', metrics.totalManifestJsRawBytes, budgets.totalManifestJsRawBytes);
  check('largestAnyJsChunkRawBytes', metrics.largestAnyJsChunk.bytes, budgets.largestAnyJsChunkRawBytes);
  check('totalBuildRawBytes', metrics.totalBuildRawBytes, budgets.totalBuildRawBytes);
  if (failures.length) throw new Error(`M31 production performance budget exceeded:\n- ${failures.join('\n- ')}`);
  return true;
}
