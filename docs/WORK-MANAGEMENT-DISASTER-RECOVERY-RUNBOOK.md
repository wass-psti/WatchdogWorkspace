# Work Management — M34 Disaster Recovery Runbook

## Authority

M34 governs application-level recovery packages and the recovery procedure around the already-certified transactional workspace restore RPC. It does not replace infrastructure-provider database backups, secret-manager recovery, or certified-source deployment recovery.

## Recovery objectives

- **RPO target:** 24 hours for operator-managed application recovery packages.
- **RTO target:** 60 minutes from availability of required infrastructure, credentials, certified source, and a verified recovery package.
- A backup older than the RPO target is still restorable, but M34 preflight must classify it as a warning.
- RPO/RTO are operational targets. Certification proves the software contracts and drill procedure; production operations must verify actual backup cadence and recovery timing.

## Retention target

Approved recovery storage should retain at least 7 daily, 4 weekly, and 12 monthly application recovery packages unless a stricter organizational retention policy applies.

Recovery packages contain business data. Store them only in approved encrypted, access-controlled storage. The SHA-256 digest is an **integrity** control, not a creator-authentication/signature control.

## Normal backup procedure

1. Sign in with access to the workspace/modules that must be protected.
2. Open Settings and export a Work Management backup.
3. Confirm the downloaded file uses the M34 `wm-recovery-package-v1` envelope.
4. Optionally verify the downloaded package offline with `npm run backup-dr:verify-package -- /path/to/file.json` (set `WM_RECOVERY_EXPECTED_ORIGIN` when origin matching is required).
5. Move it into approved encrypted recovery storage.
6. Record backup time, operator, environment, and storage location in the operational backup register.
7. Verify that the newest retained package is no older than 24 hours for critical workspaces.
8. Maintain the 7 daily / 4 weekly / 12 monthly retention target.

## Restore preflight

Before restoring, M34 verifies the recovery-package manifest and SHA-256 digest. Review all warnings before continuing:

- backup age exceeds RPO;
- package origin differs from the current application origin;
- entries were excluded during structural validation;
- current operator lacks access to one or more modules;
- legacy raw backup has no M34 integrity envelope.

A corrupt or manifest-mismatched M34 recovery package must be rejected. Never bypass this failure by editing the file.

## Restore procedure

1. Confirm the incident scope and stop conflicting writes where operationally possible.
2. Confirm application authentication and Supabase connectivity.
3. Import the selected recovery package and review M34 preflight.
4. Approve restore only after confirming the target environment and backup age.
5. M34 creates and initiates download of a **pre-restore checkpoint** of the current accessible workspace. If checkpoint creation fails, restore must stop.
6. Local shell state is staged with best-effort rollback protection.
7. Cloud module/activity/Board state is restored through `wm_restore_workspace_backup_v4`, which executes transactionally and returns verification counts.
8. On success, cache/module invalidation events are emitted and the shell reloads.
9. Run application/module smoke checks and compare restored counts with the expected recovery package manifest.
10. Confirm the browser/operating system retained the pre-restore checkpoint and keep it until recovery acceptance is signed off. The application can verify checkpoint generation but cannot prove filesystem persistence after browser download initiation.

## Full disaster recovery order

1. **Incident control:** identify outage/corruption scope and preserve evidence.
2. **Application source:** recover/deploy only from the most recent certified baseline and verify its recorded SHA-256.
3. **Public configuration:** restore only approved public Supabase URL/publishable configuration.
4. **Secrets:** restore server-only secrets from the approved secret manager; recovery packages must never contain them.
5. **Database infrastructure:** if the database itself is unavailable/corrupt, use the provider-approved backup/PITR procedure before application-level restore.
6. **Schema:** verify certified migration/schema authority before allowing application traffic.
7. **Application-level state:** import the newest verified M34 recovery package when application-level reconstruction is required.
8. **Validation:** run M29 RLS tests, module smoke tests, M30 browser tests, M31 performance checks, M32 observability checks, and M33 service-worker/update checks as applicable.
9. **Acceptance:** record actual RPO and RTO, unresolved data gaps, and incident owner approval.

## Failure and rollback

- A failed pre-restore checkpoint blocks restore.
- A failed cloud restore leaves the RPC transaction rolled back; locally staged shell values are restored best-effort.
- If post-recovery validation fails after a successful restore, use the downloaded pre-restore checkpoint or another approved recovery point as a new explicit restore operation. Do not manually patch backup JSON.
- Never restore authentication tokens, service-role keys, or server secrets from a recovery package.

## Quarterly recovery drill

At least quarterly, production operations should perform a controlled recovery drill in an isolated environment and record:

- newest backup age at drill start;
- integrity verification result;
- restore entry/Board counts;
- elapsed recovery time;
- M29 authorization regression result;
- application/browser smoke result;
- any skipped modules or rejected entries;
- whether RPO <= 24h and RTO <= 60m were achieved.

M34 source certification does not claim that an external backup provider, secret manager, or organizational retention process has been configured; those remain operational dependencies.
