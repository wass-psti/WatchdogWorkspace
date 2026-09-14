import { readFile } from 'node:fs/promises';
const req = async (path) => readFile(new URL(path, import.meta.url), 'utf8');
const target = await req('./config/stage-f-m34-backup-disaster-recovery-target.ts');
const m33 = await req('./config/stage-f-m33-service-worker-update-strategy-target.ts');
const manifest = await req('./config/application-manifest.ts');
const manifestTypes = await req('./src/types/manifest.ts');
const runtimeSchema = await req('./src/runtime-schemas/manifest.ts');
const policy = JSON.parse(await req('./config/backup-disaster-recovery-policy.json'));
const contract = await req('./src/platform/contracts/backup-disaster-recovery.ts');
const recovery = await req('./assets/js/platform/recovery/backup-disaster-recovery.ts');
const backup = await req('./assets/js/core/backup.ts');
const app = await req('./assets/js/app.ts');
const migration = await req('./supabase/migrations/v1.41.0-transactional-backup-restore.sql');
const runbook = await req('./docs/WORK-MANAGEMENT-DISASTER-RECOVERY-RUNBOOK.md');
const packageVerifier = await req('./scripts/verify-recovery-package-file.mjs');
const m33Verifier = await req('./verify-stage-f-m33-service-worker-update-strategy.mjs');
const pkg = JSON.parse(await req('./package.json'));
const architecture = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const checks = [
  ['M33 prerequisite certified', m33.includes("activationState: 'active-certified'")],
  ['M34 state', /activationState: '(?:implementation-complete-pending-certification|active-pending-release-certification|active-certified)'/.test(target)],
  ['architecture >=42', architecture >= 42],
  ['manifest M34 authority', manifest.includes("backupDisasterRecovery: 'integrity-preflight-checkpoint-dr-v1'") && manifest.includes("backupRecoveryEnvelope: 'wm-recovery-package-v1'") && manifest.includes("backupRecoveryIntegrity: 'sha256-json-stable-v1'")],
  ['manifest types', manifestTypes.includes("readonly backupDisasterRecovery?: 'integrity-preflight-checkpoint-dr-v1'") && manifestTypes.includes("readonly backupRecoveryEnvelope?: 'wm-recovery-package-v1'")],
  ['runtime schema', runtimeSchema.includes("backupDisasterRecovery: z.literal('integrity-preflight-checkpoint-dr-v1')") && runtimeSchema.includes('Architecture v42+ requires the governed integrity-checked backup and disaster-recovery authority.')],
  ['policy schema', policy.schema === 'wm-backup-dr-policy-v1'],
  ['RPO policy', policy.recoveryObjectives?.rpoTargetHours === 24 && target.includes('rpoTargetHours: 24')],
  ['RTO policy', policy.recoveryObjectives?.rtoTargetMinutes === 60 && target.includes('rtoTargetMinutes: 60')],
  ['retention policy', policy.applicationBackup?.retentionTarget?.daily === 7 && policy.applicationBackup?.retentionTarget?.weekly === 4 && policy.applicationBackup?.retentionTarget?.monthly === 12],
  ['recovery contract', contract.includes("RECOVERY_PACKAGE_SCHEMA = 'wm-recovery-package-v1'") && contract.includes("RECOVERY_INTEGRITY_ALGORITHM = 'SHA-256'")],
  ['canonical SHA runtime', recovery.includes("cryptoApi.subtle.digest('SHA-256'") && recovery.includes('stableJson') && recovery.includes('verifyRecoveryPackage') && recovery.includes('const unsigned =')],
  ['new exports use recovery envelope', backup.includes('const pkg = await createRecoveryPackage(payload);') && backup.includes('WM_BACKUP_PACKAGE_TOO_LARGE') && backup.includes("downloadRecoveryArtifact(pkg, 'work-management-recovery')")],
  ['legacy backups retained', backup.includes('assessLegacyBackup(payload') && backup.includes('SUPPORTED_BACKUP_VERSIONS = Object.freeze([1, 2, 3, 4]')],
  ['preflight required', backup.includes('inspectBackupFile') && backup.includes('assessRecoveryPackage(pkg') && policy.restore?.preflightRequired === true],
  ['corrupt package fail closed', backup.includes("'WM_BACKUP_INTEGRITY_FAILED'")],
  ['pre-restore checkpoint fail closed', backup.includes('restoreWorkspaceBackupGuarded') && backup.includes('pre-restore recovery checkpoint could not be created') && policy.restore?.preRestoreCheckpointRequired === true],
  ['existing transactional RPC preserved', backup.includes("/rest/v1/rpc/wm_restore_workspace_backup_v4") && migration.includes('wm_restore_workspace_backup_v4')],
  ['local rollback preserved', backup.includes('for (const key of written.reverse())') && policy.restore?.localRollback === 'best-effort-on-cloud-transaction-failure'],
  ['post-restore invalidation preserved', backup.includes("wm:backup-restored") && backup.includes("wm:module-store-invalidate")],
  ['M32 observability bridge', backup.includes("'wm:backup-dr'") && app.includes("window.addEventListener('wm:backup-dr'") && app.includes('backup_dr.')],
  ['secrets excluded from DR package', runbook.includes('must never contain them') && policy.infrastructure?.secrets === 'restore-from-approved-secret-manager-not-backup-package'],
  ['encrypted storage boundary explicit', policy.applicationBackup?.encryptionBoundary === 'external-encrypted-access-controlled-storage-required' && runbook.includes('approved encrypted')],
  ['provider backup boundary explicit', policy.infrastructure?.databaseProviderBackup === 'external-operational-prerequisite' && target.includes("database-provider-backup")],
  ['offline recovery-package verifier', target.includes('offlinePackageVerifier') && packageVerifier.includes('verifyRecoveryPackage') && pkg.scripts?.['backup-dr:verify-package:governed'] === 'node --experimental-strip-types scripts/verify-recovery-package-file.mjs'],
  ['browser checkpoint persistence boundary explicit', target.includes('browser-checkpoint-persistence') && runbook.includes('cannot prove filesystem persistence')],
  ['M33 verifier forward-compatible', m33Verifier.includes("['architecture >=41'") || m33Verifier.includes("architecture >= 41")],
  ['governed M34 scripts', pkg.scripts?.['backup-dr:check:governed'] === 'node verify-stage-f-m34-backup-disaster-recovery.mjs' && pkg.scripts?.['backup-dr:test:governed'] === 'node --experimental-strip-types scripts/verify-backup-disaster-recovery-execution.mjs'],
  ['database unchanged by M34 target', target.includes('migrationRequired: false') && target.includes('schemaChangeRequired: false') && target.includes('productionDataRewriteRequired: false')],
];
for (const [name, ok] of checks) if (!ok) throw new Error(`M34 verifier failed: ${name}`);
console.log(`Stage F Milestone 34 Backup and disaster recovery verification: PASS (architecture=${architecture}; checks=${checks.length}; recovery=sha256-envelope; preflight=required; checkpoint=fail-closed; rpo=24h; rto=60m)`);
