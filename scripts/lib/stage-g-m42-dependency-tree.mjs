import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const generatedCacheNames = new Set(['.cache', '.vite', '.vite-temp', '.vitest']);

function collect(root, current, entries = []) {
  for (const dirent of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (dirent.isDirectory() && generatedCacheNames.has(dirent.name)) continue;
    const absolute = path.join(current, dirent.name);
    const relative = path.relative(root, absolute).split(path.sep).join('/');
    const stat = fs.lstatSync(absolute);
    const mode = stat.mode & 0o777;
    if (stat.isDirectory()) {
      collect(root, absolute, entries);
      continue;
    }
    if (stat.isSymbolicLink()) {
      entries.push({ relative, type: 'symlink', mode, payload: fs.readlinkSync(absolute) });
      continue;
    }
    if (!stat.isFile()) throw new Error(`Unsupported filesystem entry in M42 dependency tree: ${relative}`);
    entries.push({ relative, type: 'file', mode, payload: fs.readFileSync(absolute) });
  }
  return entries;
}

const fingerprint = (entry) => ({
  relative: entry.relative,
  type: entry.type,
  mode: entry.mode.toString(8),
  sha256: crypto.createHash('sha256').update(entry.payload).digest('hex'),
});

export function computeM42DependencyTreeDigest(projectRoot, { includeManifest = false } = {}) {
  const root = path.resolve(projectRoot);
  const nodeModules = path.join(root, 'node_modules');
  if (!fs.existsSync(nodeModules) || !fs.statSync(nodeModules).isDirectory()) {
    throw new Error('M42 dependency content digest requires node_modules to be materialized.');
  }
  const hash = crypto.createHash('sha256');
  const entries = collect(nodeModules, nodeModules);
  if (entries.length === 0) throw new Error('M42 dependency content digest found no installed dependency files.');
  for (const entry of entries) {
    hash.update(entry.type);
    hash.update('\0');
    hash.update(entry.relative);
    hash.update('\0');
    hash.update(entry.mode.toString(8));
    hash.update('\0');
    hash.update(entry.payload);
    hash.update('\0');
  }
  const result = { digest: hash.digest('hex'), entries: entries.length };
  if (includeManifest) result.manifest = entries.map(fingerprint);
  return result;
}

const invokedAsScript = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedAsScript) {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(import.meta.dirname, '../..');
  const includeManifest = process.argv.includes('--manifest-json');
  const result = computeM42DependencyTreeDigest(root, { includeManifest });
  if (process.argv.includes('--json') || includeManifest) console.log(JSON.stringify(result));
  else console.log(result.digest);
}
