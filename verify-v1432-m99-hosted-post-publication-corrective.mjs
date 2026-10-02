import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const fail = (message) => { console.error(`M99 hosted post-publication corrective verification FAILED: ${message}`); process.exitCode = 1; };
const assertMatch = (relative, pattern, message) => { if (!pattern.test(read(relative))) fail(`${message} (${relative})`); };
const assertFile = (relative) => { if (!fs.existsSync(path.join(root, relative))) fail(`missing required file: ${relative}`); };

assertMatch('tests/modern/e2e/settings-functional-recovery.spec.mjs', /M43_IDENTITY_TIMEOUT_MS\s*=\s*30_000/, 'M43 identity timeout contract missing');
assertMatch('tests/modern/e2e/settings-functional-recovery.spec.mjs', /test\.describe\.configure\(\{\s*timeout:\s*60_000\s*\}\)/, 'M43 hosted test timeout contract missing');
assertMatch('tests/modern/e2e/settings-functional-recovery.spec.mjs', /waitForM39Identity\(page,\s*\{\s*role:\s*'admin_general_manager',\s*timeout:\s*M43_IDENTITY_TIMEOUT_MS\s*\}\)/, 'M43 identity wait must remain role-bound and explicitly budgeted');

assertMatch('.github/workflows/ci.yml', /timeout-minutes:\s*75\b/, 'Work Management CI timeout budget must be 75 minutes');
assertMatch('.github/workflows/boards-columns-cells-status-system-recovery.yml', /timeout-minutes:\s*90\b/, 'M48 hosted timeout budget must be 90 minutes');
assertMatch('.github/workflows/rich-item-workspace-file-recovery.yml', /timeout-minutes:\s*90\b/, 'M50 hosted timeout budget must be 90 minutes');

const owned = new Map([
  ['20260917142647_stage_g_m46_boards_backend_data_contract_recovery.sql', 'supabase/deployments/m46/20260917142647_stage_g_m46_boards_backend_data_contract_recovery.sql'],
  ['20260919165239_stage_g_m47_boards_table_group_item_recovery.sql', 'supabase/deployments/m47/20260919165239_stage_g_m47_boards_table_group_item_recovery.sql'],
  ['20260922141400_stage_g_m50_rich_item_workspace_file_recovery.sql', 'supabase/deployments/m50/20260922141400_stage_g_m50_rich_item_workspace_file_recovery.sql'],
  ['20260924173000_stage_g_m39_auth_session_access_context_corrective.sql', 'supabase/migrations/v1.43.2-stage-g-m39-auth-session-access-context.sql'],
  ['20260924180000_stage_g_m54_runtime_capability_m51_parity_corrective.sql', 'supabase/migrations/v1.43.2-stage-g-m54-runtime-capability-m51-parity-corrective.sql'],
  ['20260924190000_stage_g_m54_production_required_rpc_parity_corrective.sql', 'supabase/migrations/v1.43.2-stage-g-m54-production-required-rpc-parity-corrective.sql'],
]);
for (const [targetName, source] of owned) {
  const target = `supabase/migrations/${targetName}`;
  assertFile(target); assertFile(source);
  if (fs.existsSync(path.join(root, target)) && fs.existsSync(path.join(root, source)) && !fs.readFileSync(path.join(root, target)).equals(fs.readFileSync(path.join(root, source)))) fail(`owned migration mirror drift: ${target}`);
}

const shared = [
  ['20260928034824','fueltrans_workspace_integration'], ['20260928035728','fueltrans_membership_identity'], ['20260928035850','fueltrans_notifications'],
  ['20260928040345','fueltrans_admin_state_and_hardening'], ['20260928041154','fueltrans_performance_indexes'], ['20260928041218','fueltrans_created_by_index'],
  ['20260928041601','fueltrans_policy_hardening'], ['20260929005600','fueltrans_workspace_contract_guard'], ['20260929015312','frt_workspace_integration'],
  ['20260929015419','frt_voucher_counter_guard'], ['20260929015945','frt_membership_visibility_guard'], ['20260929020035','frt_membership_policy_recursion_fix'],
];
for (const [version, name] of shared) {
  const relative = `supabase/migrations/${version}_${name}.sql`;
  assertFile(relative);
  if (fs.existsSync(path.join(root, relative))) {
    const text = read(relative);
    if (!text.includes('external/shared application') || !text.includes('intentionally contains no SQL')) fail(`shared migration mirror is not explicitly no-op/provenance-bound: ${relative}`);
    const executable = text.split(/\r?\n/).map((line) => line.replace(/--.*$/, '').trim()).filter(Boolean).join('');
    if (executable.length) fail(`shared migration mirror unexpectedly contains executable SQL: ${relative}`);
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log(`M99 hosted post-publication corrective verification: PASS (ownedMigrationMirrors=${owned.size}; sharedLedgerMirrors=${shared.length}; hostedWorkflowBudgets=3; m43IdentityBudget=true)`);
