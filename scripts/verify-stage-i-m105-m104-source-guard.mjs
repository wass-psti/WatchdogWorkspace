import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const manifest = JSON.parse(
  fs.readFileSync(
    path.join(root, 'M105-M104-BASELINE-GIT-MANIFEST.json'),
    'utf8',
  ),
);

if (
  manifest.checkpoint !== 'M104' ||
  manifest.commit !==
    'aa944c8d5fd323ad6fd36c0084145c8592b770f6' ||
  manifest.algorithm !== 'git-blob-sha1'
) {
  console.error(
    'M105 M104-certified source guard: FAIL ' +
    '(invalid predecessor manifest)',
  );
  process.exit(1);
}

const baseline = new Map(
  manifest.entries.map((entry) => [
    entry.path,
    entry,
  ]),
);

const allowedMutations = new Set([
  '.github/workflows/deploy-pages.yml',
  'scripts/verify-stage-i-m104-m103-source-guard.mjs',
]);

const allowedAdditions = new Set([
  'M105-M104-BASELINE-GIT-MANIFEST.json',
  'M105-PRODUCTION-BACKEND-PARITY-CORRECTIVE.md',
  'verify-v1432-m105-production-backend-parity.mjs',
  'scripts/verify-stage-i-m105-m104-source-guard.mjs',
  'scripts/certify-stage-i-m105-local.sh',
  'supabase/migrations/20261006041529_stage_i_m105_production_board_import_contract_parity.sql',
]);

const ignoredRoots = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  'test-results',
  'playwright-report',
]);

const ignoredNames = new Set([
  '.DS_Store',
  'Thumbs.db',
]);

function gitBlobSha(file) {
  const payload = fs.readFileSync(file);
  const header = Buffer.from(`blob ${payload.length}\0`);

  return crypto
    .createHash('sha1')
    .update(header)
    .update(payload)
    .digest('hex');
}

const current = new Map();

function walk(directory, prefix = '') {
  for (
    const entry of fs.readdirSync(
      directory,
      { withFileTypes: true },
    )
  ) {
    if (ignoredNames.has(entry.name)) continue;

    const relative = prefix
      ? `${prefix}/${entry.name}`
      : entry.name;

    if (entry.isDirectory()) {
      if (
        ignoredRoots.has(
          relative.split('/')[0],
        )
      ) {
        continue;
      }

      walk(
        path.join(directory, entry.name),
        relative,
      );

      continue;
    }

    const full = path.join(
      directory,
      entry.name,
    );

    current.set(relative, {
      gitSha: gitBlobSha(full),
      size: fs.statSync(full).size,
    });
  }
}

walk(root);

const unauthorized = [];

for (const [file, original] of baseline) {
  const now = current.get(file);

  if (!now) {
    unauthorized.push(`REMOVED ${file}`);
    continue;
  }

  if (
    now.gitSha !== original.gitSha &&
    !allowedMutations.has(file)
  ) {
    unauthorized.push(`MUTATED ${file}`);
  }
}

for (const file of current.keys()) {
  if (
    !baseline.has(file) &&
    !allowedAdditions.has(file)
  ) {
    unauthorized.push(`ADDED ${file}`);
  }
}

if (unauthorized.length) {
  console.error(
    'M105 M104-certified source guard: FAIL',
  );

  unauthorized
    .slice(0, 100)
    .forEach((line) =>
      console.error(`- ${line}`)
    );

  process.exit(1);
}

console.log(
  `M105 M104-certified source guard: PASS ` +
  `(baseline files=${baseline.size}; ` +
  `allowed mutations=${allowedMutations.size}; ` +
  `allowed new files=${allowedAdditions.size})`,
);
