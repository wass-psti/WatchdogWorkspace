import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const excludedDirectoryNames = new Set([
  '.git',
  'node_modules',
  'test-results',
  'playwright-report',
  'coverage',
  'dist',
  '.vite',
  '.vitest',
  'm37-evidence',
]);

const excludedRelativeDirectories = new Set([
  'supabase/.temp',
]);

const excludedRelativeFiles = new Set([
  'CHECKSUMS.sha256',
  'config/stage-g-m42-users-rbac-functional-recovery-target.ts',
  'RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md',
]);

const isConcreteEnvironmentFile = (name) => name === '.env' || (name.startsWith('.env.') && !name.endsWith('.example'));
const isLocalGeneratedFile = (name) => name === '.DS_Store' || /^npm-debug\.log(?:\.|$)/.test(name);

function collect(root, current = root, entries = []) {
  for (const dirent of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(current, dirent.name);
    const relative = path.relative(root, absolute).split(path.sep).join('/');

    if (dirent.isDirectory() && (excludedDirectoryNames.has(dirent.name) || excludedRelativeDirectories.has(relative))) continue;
    if (isConcreteEnvironmentFile(dirent.name) || isLocalGeneratedFile(dirent.name)) continue;
    if (excludedRelativeFiles.has(relative)) continue;

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
    if (!stat.isFile()) {
      throw new Error(`Unsupported filesystem entry in M42 certification tree: ${relative}`);
    }
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

export function computeM42CertificationTreeDigest(projectRoot, { includeManifest = false } = {}) {
  const root = path.resolve(projectRoot);
  const hash = crypto.createHash('sha256');
  const entries = collect(root);
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
  const result = { digest: hash.digest('hex'), files: entries.length };
  if (includeManifest) result.manifest = entries.map(fingerprint);
  return result;
}

const invokedAsScript = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedAsScript) {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(import.meta.dirname, '../..');
  const includeManifest = process.argv.includes('--manifest-json');
  const result = computeM42CertificationTreeDigest(root, { includeManifest });
  if (process.argv.includes('--json') || includeManifest) console.log(JSON.stringify(result));
  else console.log(result.digest);
}
