import {
  RECOVERY_CANONICALIZATION,
  RECOVERY_INTEGRITY_ALGORITHM,
  RECOVERY_PACKAGE_SCHEMA,
  type RecoveryObjectives,
  type RecoveryPackage,
  type RecoveryPreflight,
  type RecoveryWarning,
} from '../../../../src/platform/contracts/backup-disaster-recovery.ts';

export const DEFAULT_RECOVERY_OBJECTIVES: RecoveryObjectives = Object.freeze({
  rpoTargetHours: 24,
  rtoTargetMinutes: 60,
  restoreVerification: 'transactional-plus-post-restore-v1',
});

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const finiteNumber = (value: unknown, fallback = 0): number => Number.isFinite(Number(value)) ? Number(value) : fallback;
const text = (value: unknown): string => typeof value === 'string' ? value : '';
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const HEX_SHA256 = /^[0-9a-f]{64}$/;

export function stableJson(value: unknown): string {
  const normalize = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(normalize);
    if (isRecord(input)) {
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(input).sort()) {
        const current = input[key];
        if (current !== undefined) result[key] = normalize(current);
      }
      return result;
    }
    if (typeof input === 'number' && !Number.isFinite(input)) return null;
    if (typeof input === 'bigint' || typeof input === 'function' || typeof input === 'symbol' || input === undefined) return null;
    return input;
  };
  return JSON.stringify(normalize(value));
}

export async function sha256Hex(value: unknown, cryptoApi: Crypto = globalThis.crypto): Promise<string> {
  if (!cryptoApi?.subtle) throw new Error('Web Crypto SHA-256 support is required for recovery-package integrity.');
  const bytes = new TextEncoder().encode(stableJson(value));
  const digest = await cryptoApi.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, '0')).join('');
}

function readPayloadMetadata(payload: unknown): Readonly<{
  format: string;
  backupVersion: number;
  platformVersion: string;
  createdAt: string;
  origin: string;
  entryCount: number;
  declaredEntryCount: number;
  boardCount: number;
  moduleIds: readonly string[];
  rejectedCount: number;
}> {
  const root = isRecord(payload) ? payload : {};
  const modules = list(root.modules).flatMap((entry) => isRecord(entry) && text(entry.id) ? [text(entry.id)] : []);
  const dataCount = isRecord(root.data) ? Object.keys(root.data).length : 0;
  const moduleCount = isRecord(root.moduleData) ? Object.values(root.moduleData).reduce<number>((count, rows) => count + list(rows).length, 0) : 0;
  const activityCount = isRecord(root.activityData) ? Object.values(root.activityData).reduce<number>((count, rows) => count + list(rows).length, 0) : 0;
  const boardCount = list(root.boardData).length;
  const computedEntryCount = dataCount + moduleCount + activityCount + boardCount;
  return Object.freeze({
    format: text(root.format),
    backupVersion: finiteNumber(root.backupVersion),
    platformVersion: text(root.platformVersion),
    createdAt: text(root.createdAt),
    origin: text(root.origin),
    entryCount: computedEntryCount,
    declaredEntryCount: Math.max(0, finiteNumber(root.entryCount)),
    boardCount,
    moduleIds: Object.freeze([...new Set(modules)].sort()),
    rejectedCount: Math.max(0, finiteNumber(root.rejectedCount)),
  });
}

export function isRecoveryPackage(value: unknown): value is RecoveryPackage {
  return isRecord(value) && value.schema === RECOVERY_PACKAGE_SCHEMA;
}

export async function createRecoveryPackage<T>(
  payload: T,
  objectives: RecoveryObjectives = DEFAULT_RECOVERY_OBJECTIVES,
  cryptoApi: Crypto = globalThis.crypto,
): Promise<RecoveryPackage<T>> {
  const metadata = readPayloadMetadata(payload);
  if (metadata.format !== 'work-management-backup' || metadata.backupVersion <= 0 || metadata.entryCount <= 0) {
    throw new Error('A valid non-empty Work Management backup payload is required to create a recovery package.');
  }
  if (metadata.declaredEntryCount !== metadata.entryCount) throw new Error('Backup payload entryCount does not match its recoverable contents.');
  const createdAt = Number.isFinite(Date.parse(metadata.createdAt)) ? new Date(metadata.createdAt).toISOString() : new Date().toISOString();
  const packageObjectives = Object.freeze({ ...objectives });
  if (
    packageObjectives.rpoTargetHours !== DEFAULT_RECOVERY_OBJECTIVES.rpoTargetHours
    || packageObjectives.rtoTargetMinutes !== DEFAULT_RECOVERY_OBJECTIVES.rtoTargetMinutes
    || packageObjectives.restoreVerification !== DEFAULT_RECOVERY_OBJECTIVES.restoreVerification
  ) throw new Error('Recovery packages must use the governed M34 recovery objectives.');
  const manifest = Object.freeze({
    payloadFormat: 'work-management-backup' as const,
    backupVersion: metadata.backupVersion,
    platformVersion: metadata.platformVersion,
    entryCount: metadata.entryCount,
    boardCount: metadata.boardCount,
    moduleIds: metadata.moduleIds,
    sourceOrigin: metadata.origin,
  });
  const unsigned = Object.freeze({ schema: RECOVERY_PACKAGE_SCHEMA, createdAt, objectives: packageObjectives, manifest, payload });
  const digest = await sha256Hex(unsigned, cryptoApi);
  return Object.freeze({
    ...unsigned,
    integrity: Object.freeze({ algorithm: RECOVERY_INTEGRITY_ALGORITHM, canonicalization: RECOVERY_CANONICALIZATION, digest }),
  });
}

export async function verifyRecoveryPackage<T = unknown>(value: unknown, cryptoApi: Crypto = globalThis.crypto): Promise<RecoveryPackage<T>> {
  if (!isRecoveryPackage(value)) throw new Error('The selected file is not an M34 recovery package.');
  const root = value as RecoveryPackage<T>;
  if (!isRecord(root.manifest) || !isRecord(root.integrity) || !isRecord(root.objectives)) throw new Error('The recovery package manifest is incomplete.');
  if (root.integrity.algorithm !== RECOVERY_INTEGRITY_ALGORITHM || root.integrity.canonicalization !== RECOVERY_CANONICALIZATION || !HEX_SHA256.test(root.integrity.digest)) {
    throw new Error('The recovery package integrity descriptor is invalid.');
  }
  if (root.manifest.payloadFormat !== 'work-management-backup') throw new Error('The recovery package contains an unsupported payload format.');
  if (!Array.isArray(root.manifest.moduleIds)) throw new Error('The recovery package module manifest is invalid.');
  const metadata = readPayloadMetadata(root.payload);
  const payloadCreatedAt = Number.isFinite(Date.parse(metadata.createdAt)) ? new Date(metadata.createdAt).toISOString() : '';
  if (
    !payloadCreatedAt
    || root.createdAt !== payloadCreatedAt
    || metadata.format !== root.manifest.payloadFormat
    || metadata.backupVersion !== root.manifest.backupVersion
    || metadata.platformVersion !== root.manifest.platformVersion
    || metadata.declaredEntryCount !== metadata.entryCount
    || metadata.entryCount !== root.manifest.entryCount
    || metadata.boardCount !== root.manifest.boardCount
    || metadata.origin !== root.manifest.sourceOrigin
    || metadata.moduleIds.join('|') !== [...root.manifest.moduleIds].sort().join('|')
  ) throw new Error('The recovery package manifest does not match its payload.');
  if (
    root.objectives.rpoTargetHours !== DEFAULT_RECOVERY_OBJECTIVES.rpoTargetHours
    || root.objectives.rtoTargetMinutes !== DEFAULT_RECOVERY_OBJECTIVES.rtoTargetMinutes
    || root.objectives.restoreVerification !== DEFAULT_RECOVERY_OBJECTIVES.restoreVerification
  ) throw new Error('The recovery package recovery-objective descriptor does not match the governed M34 policy.');
  const unsigned = { schema: root.schema, createdAt: root.createdAt, objectives: root.objectives, manifest: root.manifest, payload: root.payload };
  const actual = await sha256Hex(unsigned, cryptoApi);
  if (actual !== root.integrity.digest) throw new Error('Recovery package integrity verification failed; the package was modified or corrupted.');
  return root;
}

export function assessRecoveryPackage(
  pkg: RecoveryPackage,
  options: Readonly<{ expectedOrigin?: string; nowMs?: number; skippedModules?: readonly string[]; validatedPayload?: unknown }> = {},
): RecoveryPreflight {
  const payload = readPayloadMetadata(options.validatedPayload ?? pkg.payload);
  const nowMs = options.nowMs ?? Date.now();
  const createdMs = Date.parse(pkg.createdAt);
  const backupAgeHours = Number.isFinite(createdMs) ? Math.max(0, (nowMs - createdMs) / 3_600_000) : null;
  const rpoCompliant = backupAgeHours === null ? null : backupAgeHours <= pkg.objectives.rpoTargetHours;
  const expectedOrigin = options.expectedOrigin ?? '';
  const originMatches = expectedOrigin ? pkg.manifest.sourceOrigin === expectedOrigin : null;
  const skippedModules = Object.freeze([...(options.skippedModules ?? [])]);
  const warnings: RecoveryWarning[] = [];
  if (rpoCompliant === false) warnings.push(Object.freeze({ code: 'backup-age-exceeds-rpo' as const, message: `Backup age exceeds the ${pkg.objectives.rpoTargetHours}-hour recovery-point target.` }));
  if (originMatches === false) warnings.push(Object.freeze({ code: 'origin-mismatch' as const, message: 'Backup origin differs from the current application origin; review the source before restoring.' }));
  if (payload.rejectedCount > 0) warnings.push(Object.freeze({ code: 'rejected-entries-present' as const, message: `${payload.rejectedCount} unsupported or invalid backup entries were excluded during validation.` }));
  if (skippedModules.length > 0) warnings.push(Object.freeze({ code: 'module-access-restricted' as const, message: `${skippedModules.length} module(s) will be skipped because the current user lacks access.` }));
  return Object.freeze({
    status: warnings.length ? 'warning' : 'ready',
    integrity: 'verified',
    backupAgeHours,
    rpoCompliant,
    originMatches,
    entryCount: pkg.manifest.entryCount,
    boardCount: pkg.manifest.boardCount,
    skippedModules,
    warnings: Object.freeze(warnings),
    digest: pkg.integrity.digest,
  });
}

export function assessLegacyBackup(payload: unknown, skippedModules: readonly string[] = []): RecoveryPreflight {
  const metadata = readPayloadMetadata(payload);
  const warnings: RecoveryWarning[] = [Object.freeze({ code: 'legacy-unverified-backup', message: 'Legacy raw backup has no M34 cryptographic integrity manifest.' })];
  if (metadata.rejectedCount > 0) warnings.push(Object.freeze({ code: 'rejected-entries-present', message: `${metadata.rejectedCount} unsupported or invalid backup entries were excluded during validation.` }));
  if (skippedModules.length > 0) warnings.push(Object.freeze({ code: 'module-access-restricted', message: `${skippedModules.length} module(s) will be skipped because the current user lacks access.` }));
  const createdMs = Date.parse(metadata.createdAt);
  const backupAgeHours = Number.isFinite(createdMs) ? Math.max(0, (Date.now() - createdMs) / 3_600_000) : null;
  return Object.freeze({
    status: 'warning',
    integrity: 'legacy-unverified',
    backupAgeHours,
    rpoCompliant: null,
    originMatches: null,
    entryCount: metadata.entryCount,
    boardCount: metadata.boardCount,
    skippedModules: Object.freeze([...skippedModules]),
    warnings: Object.freeze(warnings),
    digest: null,
  });
}
