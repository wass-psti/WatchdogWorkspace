import assert from 'node:assert/strict';
import {
  assessLegacyBackup,
  assessRecoveryPackage,
  createRecoveryPackage,
  sha256Hex,
  stableJson,
  verifyRecoveryPackage,
} from '../assets/js/platform/recovery/backup-disaster-recovery.ts';

let assertions = 0;
const ok = (condition, message) => { assert.ok(condition, message); assertions += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); assertions += 1; };
const rejects = async (fn, pattern, message) => { await assert.rejects(fn, pattern, message); assertions += 1; };

const payload = Object.freeze({
  format: 'work-management-backup',
  backupVersion: 4,
  platformVersion: '1.43.2',
  createdAt: '2026-09-10T04:00:00.000Z',
  origin: 'https://example.invalid',
  modules: Object.freeze([{ id: 'fueltrack-plus', version: '3.17.0' }, { id: 'time-tracker', version: '2' }]),
  data: Object.freeze({ 'wm.platform.preferences': '{"theme":"dark"}' }),
  moduleData: Object.freeze({ 'fueltrack-plus': Object.freeze([{ state_key: 'fueltrackplus.requests.v3', value: '[]', scope: 'shared' }]) }),
  activityData: Object.freeze({}),
  boardData: Object.freeze([{ board: { id: '11111111-1111-4111-8111-111111111111' } }]),
  rejectedCount: 0,
  entryCount: 3,
  migration: Object.freeze({ fromVersion: 4, toVersion: 4 }),
});

const stableA = stableJson({ z: 1, a: { y: 2, x: 3 }, list: [2, 1] });
const stableB = stableJson({ list: [2, 1], a: { x: 3, y: 2 }, z: 1 });
equal(stableA, stableB, 'Stable JSON must ignore object insertion order.');
ok(stableA.startsWith('{"a"'), 'Stable JSON sorts object keys.');
const digestA = await sha256Hex({ a: 1, b: 2 });
const digestB = await sha256Hex({ b: 2, a: 1 });
equal(digestA, digestB, 'SHA-256 digest must be canonical-order stable.');
equal(digestA.length, 64, 'SHA-256 digest must use 64 hex characters.');

const pkg = await createRecoveryPackage(payload);
equal(pkg.schema, 'wm-recovery-package-v1', 'Recovery package schema.');
equal(pkg.integrity.algorithm, 'SHA-256', 'Recovery integrity algorithm.');
equal(pkg.integrity.canonicalization, 'json-stable-v1', 'Recovery canonicalization.');
equal(pkg.manifest.payloadFormat, 'work-management-backup', 'Payload format recorded.');
equal(pkg.manifest.backupVersion, 4, 'Backup version recorded.');
equal(pkg.manifest.entryCount, 3, 'Entry count recorded.');
equal(pkg.manifest.boardCount, 1, 'Board count recorded.');
equal(pkg.manifest.moduleIds.join(','), 'fueltrack-plus,time-tracker', 'Module identifiers normalized and sorted.');
equal(pkg.objectives.rpoTargetHours, 24, 'Default RPO target.');
equal(pkg.objectives.rtoTargetMinutes, 60, 'Default RTO target.');

const verified = await verifyRecoveryPackage(pkg);
equal(verified.integrity.digest, pkg.integrity.digest, 'Verified package preserves digest.');
equal(verified.payload, payload, 'Verified package preserves payload reference.');

const ready = assessRecoveryPackage(pkg, { expectedOrigin: 'https://example.invalid', nowMs: Date.parse('2026-09-10T12:00:00.000Z') });
equal(ready.status, 'ready', 'Recent same-origin package is ready.');
equal(ready.integrity, 'verified', 'Preflight reports verified integrity.');
equal(ready.rpoCompliant, true, 'Eight-hour backup is RPO compliant.');
equal(ready.originMatches, true, 'Same origin is recognized.');
equal(ready.warnings.length, 0, 'Ready package has no warnings.');

const stale = assessRecoveryPackage(pkg, { expectedOrigin: 'https://other.invalid', nowMs: Date.parse('2026-09-12T12:00:00.000Z'), skippedModules: ['tradelink'] });
equal(stale.status, 'warning', 'Stale/mismatched package requires warning.');
equal(stale.rpoCompliant, false, 'Backup older than 24 hours breaches RPO target.');
equal(stale.originMatches, false, 'Origin mismatch detected.');
equal(stale.skippedModules.length, 1, 'Skipped module count retained.');
ok(stale.warnings.some((warning) => warning.code === 'backup-age-exceeds-rpo'), 'RPO warning emitted.');
ok(stale.warnings.some((warning) => warning.code === 'origin-mismatch'), 'Origin warning emitted.');
ok(stale.warnings.some((warning) => warning.code === 'module-access-restricted'), 'Module-access warning emitted.');

const legacy = assessLegacyBackup(payload, ['time-tracker']);
equal(legacy.integrity, 'legacy-unverified', 'Legacy raw backup is explicitly unverified.');
equal(legacy.status, 'warning', 'Legacy raw backup cannot receive ready status.');
ok(legacy.warnings.some((warning) => warning.code === 'legacy-unverified-backup'), 'Legacy warning emitted.');

const tampered = structuredClone(pkg);
tampered.payload.data['wm.platform.preferences'] = '{"theme":"light"}';
await rejects(() => verifyRecoveryPackage(tampered), /integrity verification failed/i, 'Payload tampering must fail SHA-256 verification.');

const badManifest = structuredClone(pkg);
badManifest.manifest.entryCount = 99;
await rejects(() => verifyRecoveryPackage(badManifest), /manifest does not match/i, 'Manifest/payload mismatch must fail.');

const badIntegrity = structuredClone(pkg);
badIntegrity.integrity.algorithm = 'MD5';
await rejects(() => verifyRecoveryPackage(badIntegrity), /integrity descriptor is invalid/i, 'Unsupported integrity algorithm must fail.');

const changedObjectives = structuredClone(pkg);
changedObjectives.objectives.rpoTargetHours = 720;
await rejects(() => verifyRecoveryPackage(changedObjectives), /governed M34 policy/i, 'Recovery objectives cannot be weakened inside an exported package.');

const changedTimestamp = structuredClone(pkg);
changedTimestamp.createdAt = '2026-09-09T04:00:00.000Z';
await rejects(() => verifyRecoveryPackage(changedTimestamp), /manifest does not match|integrity verification failed/i, 'Envelope timestamp tampering must fail closed before recovery.');

const inconsistentTimestamp = structuredClone(pkg);
inconsistentTimestamp.payload.createdAt = '2026-09-09T04:00:00.000Z';
const inconsistentUnsigned = { schema: inconsistentTimestamp.schema, createdAt: inconsistentTimestamp.createdAt, objectives: inconsistentTimestamp.objectives, manifest: inconsistentTimestamp.manifest, payload: inconsistentTimestamp.payload };
inconsistentTimestamp.integrity.digest = await sha256Hex(inconsistentUnsigned);
await rejects(() => verifyRecoveryPackage(inconsistentTimestamp), /manifest does not match/i, 'Envelope and payload timestamps must remain consistent even if a digest is recomputed.');

const validatedWithRejects = structuredClone(payload);
validatedWithRejects.rejectedCount = 2;
const validatedPreflight = assessRecoveryPackage(pkg, { expectedOrigin: 'https://example.invalid', nowMs: Date.parse('2026-09-10T12:00:00.000Z'), validatedPayload: validatedWithRejects });
ok(validatedPreflight.warnings.some((warning) => warning.code === 'rejected-entries-present'), 'Preflight uses structurally validated rejected-entry counts.');

const wrongDeclaredCount = structuredClone(payload);
wrongDeclaredCount.entryCount = 99;
await rejects(() => createRecoveryPackage(wrongDeclaredCount), /entryCount does not match/i, 'Package creation must reject inconsistent backup entry counts.');

await rejects(() => createRecoveryPackage({ format: 'wrong', backupVersion: 4, entryCount: 1 }), /valid non-empty Work Management backup/i, 'Non-backup payload cannot be packaged.');
await rejects(() => createRecoveryPackage({ format: 'work-management-backup', backupVersion: 4, entryCount: 0 }), /valid non-empty Work Management backup/i, 'Empty backup cannot be packaged.');

console.log(`M34 backup/disaster-recovery execution vectors: PASS (assertions=${assertions}; integrity=sha256; preflight=verified; rpo=24h; rto=60m; legacy=warning)`);
