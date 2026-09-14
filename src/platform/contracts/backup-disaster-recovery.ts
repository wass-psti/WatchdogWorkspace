export const RECOVERY_PACKAGE_SCHEMA = 'wm-recovery-package-v1' as const;
export const RECOVERY_INTEGRITY_ALGORITHM = 'SHA-256' as const;
export const RECOVERY_CANONICALIZATION = 'json-stable-v1' as const;

export type RecoveryPreflightStatus = 'ready' | 'warning' | 'reject';
export type RecoveryWarningCode =
  | 'backup-age-exceeds-rpo'
  | 'origin-mismatch'
  | 'legacy-unverified-backup'
  | 'rejected-entries-present'
  | 'module-access-restricted';

export interface RecoveryObjectives {
  readonly rpoTargetHours: number;
  readonly rtoTargetMinutes: number;
  readonly restoreVerification: 'transactional-plus-post-restore-v1';
}

export interface RecoveryPackageManifest {
  readonly payloadFormat: 'work-management-backup';
  readonly backupVersion: number;
  readonly platformVersion: string;
  readonly entryCount: number;
  readonly boardCount: number;
  readonly moduleIds: readonly string[];
  readonly sourceOrigin: string;
}

export interface RecoveryIntegrity {
  readonly algorithm: typeof RECOVERY_INTEGRITY_ALGORITHM;
  readonly canonicalization: typeof RECOVERY_CANONICALIZATION;
  readonly digest: string;
}

export interface RecoveryPackage<T = unknown> {
  readonly schema: typeof RECOVERY_PACKAGE_SCHEMA;
  readonly createdAt: string;
  readonly objectives: RecoveryObjectives;
  readonly manifest: RecoveryPackageManifest;
  readonly integrity: RecoveryIntegrity;
  readonly payload: T;
}

export interface RecoveryWarning {
  readonly code: RecoveryWarningCode;
  readonly message: string;
}

export interface RecoveryPreflight {
  readonly status: RecoveryPreflightStatus;
  readonly integrity: 'verified' | 'legacy-unverified';
  readonly backupAgeHours: number | null;
  readonly rpoCompliant: boolean | null;
  readonly originMatches: boolean | null;
  readonly entryCount: number;
  readonly boardCount: number;
  readonly skippedModules: readonly string[];
  readonly warnings: readonly RecoveryWarning[];
  readonly digest: string | null;
}
