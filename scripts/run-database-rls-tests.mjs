import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const CERTIFIED_SUPABASE_CLI = '2.117.0';
const LOCAL_PROJECT_ID = 'work-management-m29-tests';
const projectRoot = process.cwd();
const schemaPath = resolve(projectRoot, 'supabase/schema.sql');
const testsPath = resolve(projectRoot, 'supabase/tests/database');
const keepStack = process.env.WM_M29_KEEP_LOCAL_STACK === '1';

const run = (command, args, label, options = {}) => {
  console.log(`\n================ ${label} ================`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options,
  });
  if (result.error) {
    if (result.error.code === 'ENOENT') {
      throw new Error(`${command} is required for M29 local database tests.`);
    }
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}.`);
  }
};

const runQuiet = (command, args) => spawnSync(command, args, {
  encoding: 'utf8',
  shell: false,
});

const globalVersion = runQuiet('supabase', ['--version']);
const globalActual = globalVersion.error
  ? ''
  : (globalVersion.stdout || globalVersion.stderr || '').trim().replace(/^v/, '');

let supabaseCommand = 'supabase';
let supabasePrefix = [];
if (globalActual !== CERTIFIED_SUPABASE_CLI) {
  const pinnedPackage = `supabase@${CERTIFIED_SUPABASE_CLI}`;
  const pinnedVersion = runQuiet('npx', ['--yes', pinnedPackage, '--version']);
  if (pinnedVersion.error || pinnedVersion.status !== 0) {
    throw new Error(`M29 requires Supabase CLI ${CERTIFIED_SUPABASE_CLI}. Install it globally or allow npx to resolve ${pinnedPackage}.`);
  }
  const pinnedActual = (pinnedVersion.stdout || pinnedVersion.stderr || '').trim().replace(/^v/, '');
  if (pinnedActual !== CERTIFIED_SUPABASE_CLI) {
    throw new Error(`Pinned Supabase CLI resolution failed: expected ${CERTIFIED_SUPABASE_CLI}, received ${pinnedActual || 'unknown'}.`);
  }
  supabaseCommand = 'npx';
  supabasePrefix = ['--yes', pinnedPackage];
}

const supabaseArgs = (args) => [...supabasePrefix, ...args];
const supabaseRaw = (args, label, options = {}) =>
  run(supabaseCommand, supabaseArgs(args), label, options);
const supabase = (workdir, args, label, options = {}) =>
  supabaseRaw(['--workdir', workdir, ...args], label, options);

const dockerVersion = runQuiet('docker', ['version', '--format', '{{.Server.Version}}']);
if (dockerVersion.error || dockerVersion.status !== 0) {
  throw new Error('A running Docker-compatible container runtime is required for the disposable M29 Supabase test stack.');
}

const workdir = mkdtempSync(join(tmpdir(), 'wm-m29-supabase-'));
const localSupabaseDir = join(workdir, 'supabase');
mkdirSync(localSupabaseDir, { recursive: true });
writeFileSync(join(localSupabaseDir, 'config.toml'), `project_id = "${LOCAL_PROJECT_ID}"\n\n[db.migrations]\nenabled = false\nschema_paths = []\n\n[db.seed]\nenabled = false\nsql_paths = []\n`, 'utf8');

// The repository predates the CLI's timestamped-migration convention. M29 never renames
// historical migration provenance or points reset/push at a linked database. Instead, a
// disposable local stack is bootstrapped from the authoritative schema snapshot.
const cleanup = () => {
  if (!keepStack) {
    spawnSync(supabaseCommand, supabaseArgs(['stop', '--project-id', LOCAL_PROJECT_ID, '--no-backup']), {
      stdio: 'inherit',
      shell: false,
    });
    rmSync(workdir, { recursive: true, force: true });
  } else {
    console.log(`\nM29 local stack retained for diagnostics. Workdir: ${workdir}`);
  }
};

try {
  // Remove only M29's own prior disposable stack. Never use --all and never use --linked.
  spawnSync(supabaseCommand, supabaseArgs(['stop', '--project-id', LOCAL_PROJECT_ID, '--no-backup']), {
    stdio: 'ignore',
    shell: false,
  });

  supabase(workdir, ['start'], 'Start disposable local Supabase stack with migration replay disabled');

  const databaseContainer = `supabase_db_${LOCAL_PROJECT_ID}`;
  const schemaSql = readFileSync(schemaPath, 'utf8');
  console.log('\n================ Bootstrap authoritative Work Management schema snapshot ================');
  const schemaResult = spawnSync('docker', [
    'exec', '-i', databaseContainer,
    'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1',
  ], { input: schemaSql, encoding: 'utf8', shell: false });
  if (schemaResult.stdout) process.stdout.write(schemaResult.stdout);
  if (schemaResult.stderr) process.stderr.write(schemaResult.stderr);
  if (schemaResult.error) throw schemaResult.error;
  if (schemaResult.status !== 0) throw new Error(`Authoritative schema bootstrap failed with exit code ${schemaResult.status ?? 'unknown'}.`);

  supabase(workdir, ['test', 'db', '--local', testsPath], 'Run transactional pgTAP Database/RLS suite');
  console.log('\nStage F M29 local Database/RLS execution: PASS');
} finally {
  cleanup();
}
