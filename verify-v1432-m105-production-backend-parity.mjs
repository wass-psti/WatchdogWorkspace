import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];

const read = (file) =>
  fs.readFileSync(
    path.join(root, file),
    'utf8',
  );

const ok = (condition, message) => {
  if (!condition) failures.push(message);
};

const migration = read(
  'supabase/migrations/' +
  '20261006041529_stage_i_m105_' +
  'production_board_import_contract_parity.sql',
);

const normalizedMigration =
  migration.replace(/\s+/g, ' ').trim();

ok(
  normalizedMigration.includes(
    'create or replace function ' +
    'public.wm_import_board_items_atomic(',
  ),
  'M105 migration must define atomic import RPC',
);

ok(
  normalizedMigration.includes(
    'revoke all on function ' +
    'public.wm_import_board_items_atomic' +
    '(uuid,timestamptz,jsonb) from public, anon',
  ),
  'Atomic import RPC must deny anon',
);

ok(
  normalizedMigration.includes(
    'grant execute on function ' +
    'public.wm_import_board_items_atomic' +
    '(uuid,timestamptz,jsonb) to authenticated',
  ),
  'Atomic import RPC must allow authenticated execution',
);

ok(
  normalizedMigration.includes(
    'create or replace function ' +
    'public.wm_deployment_contract_attestation()',
  ),
  'Deployment attestation must exist',
);

ok(
  normalizedMigration.includes(
    "'schema_version', '1.43.2-m105-v1'",
  ),
  'Deployment attestation schema must be M105',
);

ok(
  normalizedMigration.includes(
    "'required_rpc', 'wm_import_board_items_atomic'",
  ),
  'Deployment attestation must bind required RPC',
);

ok(
  normalizedMigration.includes(
    "'wm_import_board_items_atomic', import_ready",
  ),
  'Deployment attestation must expose import readiness',
);

ok(
  normalizedMigration.includes(
    "'compatible', import_ready",
  ),
  'Deployment compatibility must be derived from import readiness',
);

ok(
  normalizedMigration.includes(
    'grant execute on function ' +
    'public.wm_deployment_contract_attestation() ' +
    'to anon, authenticated',
  ),
  'Read-only deployment attestation must be externally callable',
);

ok(
  normalizedMigration.includes(
    "notify pgrst, 'reload schema'",
  ),
  'Migration must reload PostgREST schema',
);

const workflow = read(
  '.github/workflows/deploy-pages.yml',
);

ok(
  workflow.includes(
    'Verify M105 production backend parity repository contract',
  ),
  'Deployment must verify M105 repository contract',
);

ok(
  workflow.includes(
    'Verify live production backend deployment contract',
  ),
  'Deployment must perform pre-deploy backend attestation',
);

ok(
  workflow.includes(
    'Re-verify production backend contract after Pages deployment',
  ),
  'Deployment must perform post-deploy backend attestation',
);

ok(
  (
    workflow.match(
      /wm_deployment_contract_attestation/g,
    ) || []
  ).length >= 2,
  'Deployment must query attestation before and after deployment',
);

const capabilities = read(
  'config/backend-capability-manifest.ts',
);

ok(
  capabilities.includes(
    "'wm_import_board_items_atomic'",
  ),
  'Runtime capability manifest must require atomic import RPC',
);

const m104Guard = read(
  'scripts/verify-stage-i-m104-m103-source-guard.mjs',
);

ok(
  m104Guard.includes(
    'M105-M104-BASELINE-GIT-MANIFEST.json',
  ),
  'M104 guard must delegate to M105 successor authority',
);

ok(
  m104Guard.includes(
    'verify-stage-i-m105-m104-source-guard.mjs',
  ),
  'M104 guard must invoke M105 source guard',
);

if (failures.length) {
  console.error(
    'M105 production backend parity verification: FAIL',
  );

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log(
  'M105 production backend parity verification: PASS ' +
  '(production migration parity; authenticated import RPC; ' +
  'read-only deployment attestation; pre/post deploy guards; ' +
  'M104→M105 successor authority)',
);
