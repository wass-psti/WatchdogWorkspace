import fs from 'node:fs';
import path from 'node:path';
import { computeM42CertificationTreeDigest } from './lib/stage-g-m42-certification-tree.mjs';
import { computeM42DependencyTreeDigest } from './lib/stage-g-m42-dependency-tree.mjs';

const root = path.resolve(import.meta.dirname, '..');
const [command, snapshotArgument, ...phaseParts] = process.argv.slice(2);
const snapshotFile = snapshotArgument ? path.resolve(snapshotArgument) : '';
const phase = phaseParts.join(' ').trim() || 'M42 evidence verification';

const requireSnapshotPath = () => {
  if (!snapshotFile) throw new Error('M42 evidence stability requires a snapshot file path.');
};

const capture = () => ({
  format: 1,
  source: computeM42CertificationTreeDigest(root, { includeManifest: true }),
  dependency: computeM42DependencyTreeDigest(root, { includeManifest: true }),
});

const manifestMap = (value) => new Map((value ?? []).map((entry) => [entry.relative, entry]));
const equivalent = (a, b) => a?.type === b?.type && a?.mode === b?.mode && a?.sha256 === b?.sha256;

function diffManifest(expected, current) {
  const before = manifestMap(expected);
  const after = manifestMap(current);
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort();
  const changes = [];
  for (const relative of paths) {
    const prior = before.get(relative);
    const next = after.get(relative);
    if (!prior) changes.push({ kind: 'added', relative, current: next });
    else if (!next) changes.push({ kind: 'removed', relative, expected: prior });
    else if (!equivalent(prior, next)) changes.push({ kind: 'changed', relative, expected: prior, current: next });
  }
  return changes;
}

function printDrift(label, expected, current) {
  console.error(`::error::M42 ${label} evidence drift during ${phase}`);
  console.error(`Expected ${label} digest: ${expected.digest}`);
  console.error(`Current  ${label} digest: ${current.digest}`);
  const changes = diffManifest(expected.manifest, current.manifest);
  if (!changes.length) {
    console.error(`No ${label} manifest path difference was found even though the aggregate digest changed.`);
    return;
  }
  console.error(`${label} manifest changes (${changes.length}):`);
  for (const change of changes.slice(0, 80)) {
    const details = change.kind === 'changed'
      ? ` mode ${change.expected.mode}->${change.current.mode} sha256 ${change.expected.sha256}->${change.current.sha256}`
      : '';
    console.error(`- ${change.kind}: ${change.relative}${details}`);
  }
  if (changes.length > 80) console.error(`- ... ${changes.length - 80} additional change(s)`);
}

if (command === 'capture') {
  requireSnapshotPath();
  const snapshot = capture();
  fs.mkdirSync(path.dirname(snapshotFile), { recursive: true });
  fs.writeFileSync(snapshotFile, `${JSON.stringify(snapshot)}\n`, 'utf8');
  console.log(`M42 evidence baseline captured: source=${snapshot.source.digest}; dependency=${snapshot.dependency.digest}; snapshot=${snapshotFile}`);
  process.exit(0);
}

if (command === 'verify') {
  requireSnapshotPath();
  if (!fs.existsSync(snapshotFile)) throw new Error(`M42 evidence snapshot is missing: ${snapshotFile}`);
  const expected = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
  if (expected.format !== 1) throw new Error(`Unsupported M42 evidence snapshot format: ${expected.format ?? 'missing'}`);
  const current = capture();
  let failed = false;
  if (expected.source?.digest !== current.source.digest) {
    printDrift('source', expected.source, current.source);
    failed = true;
  }
  if (expected.dependency?.digest !== current.dependency.digest) {
    printDrift('dependency', expected.dependency, current.dependency);
    failed = true;
  }
  if (failed) process.exit(1);
  console.log(`M42 evidence stability: PASS (${phase}; source=${current.source.digest}; dependency=${current.dependency.digest})`);
  process.exit(0);
}

throw new Error('Usage: node scripts/assert-stage-g-m42-evidence-stability.mjs <capture|verify> <snapshot-file> [phase]');
