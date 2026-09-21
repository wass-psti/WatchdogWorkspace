import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const excludedDirectoryNames = new Set([
  '.git', 'node_modules', 'dist', 'coverage', 'test-results', 'playwright-report',
  '.vite', '.vitest', '.wm-modern-test-toolchain', 'm37-evidence',
  'm48-certified-artifacts-upload',
]);
const excludedRelativeDirectories = new Set(['supabase/.temp']);
const excludedRelativeFiles = new Set([
  'CHECKSUMS.sha256',
  'config/stage-g-m48-boards-columns-cells-status-recovery-target.ts',
  'RELEASE-STATUS-v1.43.2-STAGE-G-M48-BOARDS-COLUMNS-CELLS-STATUS-SYSTEM-RECOVERY.md',
]);
const isConcreteEnvironmentFile = (name) => name === '.env' || (name.startsWith('.env.') && !name.endsWith('.example'));
const isLocalGeneratedFile = (name) => name === '.DS_Store' || /^npm-debug\.log(?:\.|$)/.test(name);

function collect(root, current = root, entries = []) {
  for (const dirent of fs.readdirSync(current, { withFileTypes:true }).sort((a,b)=>a.name.localeCompare(b.name))) {
    const absolute = path.join(current, dirent.name);
    const relative = path.relative(root, absolute).split(path.sep).join('/');
    if (dirent.isDirectory() && (excludedDirectoryNames.has(dirent.name) || excludedRelativeDirectories.has(relative))) continue;
    if (isConcreteEnvironmentFile(dirent.name) || isLocalGeneratedFile(dirent.name) || excludedRelativeFiles.has(relative)) continue;
    const stat = fs.lstatSync(absolute);
    if (stat.isDirectory()) { collect(root, absolute, entries); continue; }
    if (stat.isSymbolicLink()) { entries.push({ relative, type:'symlink', mode:'120000', payload:fs.readlinkSync(absolute) }); continue; }
    if (!stat.isFile()) throw new Error(`Unsupported filesystem entry in M48 certification tree: ${relative}`);
    // Git versions only the executable bit for ordinary files; owner/group rw bits are
    // ambient filesystem/umask state and differ across macOS/Linux archive extraction.
    const mode = (stat.mode & 0o111) !== 0 ? '100755' : '100644';
    entries.push({ relative, type:'file', mode, payload:fs.readFileSync(absolute) });
  }
  return entries;
}

export function computeM48CertificationTreeDigest(projectRoot, { includeManifest=false } = {}) {
  const root = path.resolve(projectRoot);
  const entries = collect(root);
  const hash = crypto.createHash('sha256');
  for (const entry of entries) {
    hash.update(entry.type); hash.update('\0'); hash.update(entry.relative); hash.update('\0');
    hash.update(entry.mode); hash.update('\0'); hash.update(entry.payload); hash.update('\0');
  }
  const result = { digest:hash.digest('hex'), files:entries.length };
  if (includeManifest) result.manifest = entries.map((entry)=>({
    relative:entry.relative, type:entry.type, mode:entry.mode,
    sha256:crypto.createHash('sha256').update(entry.payload).digest('hex'),
  }));
  return result;
}

export function compareM48CertificationTrees(leftRoot, rightRoot) {
  const left = computeM48CertificationTreeDigest(leftRoot, { includeManifest:true });
  const right = computeM48CertificationTreeDigest(rightRoot, { includeManifest:true });
  const leftMap = new Map(left.manifest.map((entry)=>[entry.relative, entry]));
  const rightMap = new Map(right.manifest.map((entry)=>[entry.relative, entry]));
  const paths = [...new Set([...leftMap.keys(), ...rightMap.keys()])].sort();
  const differences = [];
  for (const relative of paths) {
    const a = leftMap.get(relative);
    const b = rightMap.get(relative);
    if (!a) { differences.push({ relative, issue:'missing-left', right:b }); continue; }
    if (!b) { differences.push({ relative, issue:'missing-right', left:a }); continue; }
    for (const field of ['type','mode','sha256']) {
      if (a[field] !== b[field]) differences.push({ relative, issue:`${field}-mismatch`, left:a[field], right:b[field] });
    }
  }
  return {
    equal:left.digest === right.digest && differences.length === 0,
    left:{ root:path.resolve(leftRoot), digest:left.digest, files:left.files },
    right:{ root:path.resolve(rightRoot), digest:right.digest, files:right.files },
    differences,
  };
}

// Node resolves ESM entrypoints through the filesystem realpath. On macOS, mktemp
// commonly returns a /var/folders/... path whose canonical path is /private/var/folders/....
// Comparing import.meta.url with a merely lexical path therefore misclassifies a directly
// executed script as an imported module and suppresses its CLI output. Canonicalize both
// sides so certification-tree digest emission is stable across macOS/Linux and symlinked
// invocation paths.
const invokedAsScript = (() => {
  if (!process.argv[1]) return false;
  try {
    const invokedRealPath = fs.realpathSync(path.resolve(process.argv[1]));
    const moduleRealPath = fs.realpathSync(new URL(import.meta.url));
    return invokedRealPath === moduleRealPath;
  } catch {
    return false;
  }
})();
if (invokedAsScript) {
  const args = process.argv.slice(2);
  const root = args[0] && !args[0].startsWith('--') ? path.resolve(args[0]) : path.resolve(import.meta.dirname, '../..');
  const compareIndex = args.indexOf('--compare');
  if (compareIndex >= 0) {
    const other = args[compareIndex + 1];
    if (!other) throw new Error('--compare requires a second project root');
    const comparison = compareM48CertificationTrees(root, path.resolve(other));
    if (process.argv.includes('--json') || process.argv.includes('--manifest-json')) console.log(JSON.stringify(comparison));
    else if (comparison.equal) console.log(`M48 certification tree parity: PASS (digest=${comparison.left.digest}; files=${comparison.left.files})`);
    else {
      console.error(`M48 certification tree parity: FAIL (left=${comparison.left.digest}; right=${comparison.right.digest})`);
      for (const difference of comparison.differences.slice(0, 100)) console.error(JSON.stringify(difference));
      if (comparison.differences.length > 100) console.error(`... ${comparison.differences.length - 100} additional differences omitted`);
      process.exitCode = 1;
    }
  } else {
    const result = computeM48CertificationTreeDigest(root, { includeManifest:process.argv.includes('--manifest-json') });
    if (process.argv.includes('--json') || process.argv.includes('--manifest-json')) console.log(JSON.stringify(result));
    else console.log(result.digest);
  }
}
