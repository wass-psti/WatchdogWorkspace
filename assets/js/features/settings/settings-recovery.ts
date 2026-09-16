import type { DiagnosticCheck, DiagnosticResult } from '../../core/platform.ts';

export const SETTINGS_EVIDENCE_STORAGE_KEY = 'settings.evidence.v1' as const;
export const SETTINGS_EVIDENCE_VERSION = 1 as const;
const MAX_DIAGNOSTIC_CHECKS = 128;

type UnknownRecord = Readonly<Record<string, unknown>>;
const recordOf = (value: unknown): UnknownRecord | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;

function normalizedCheck(value: unknown): DiagnosticCheck | null {
  const input = recordOf(value);
  if (!input) return null;
  const id = typeof input.id === 'string' ? input.id.trim().slice(0, 160) : '';
  const label = typeof input.label === 'string' ? input.label.trim().slice(0, 240) : '';
  const detail = typeof input.detail === 'string' ? input.detail.trim().slice(0, 1000) : '';
  if (!id || !label || !detail || typeof input.ok !== 'boolean') return null;
  return Object.freeze({ id, label, detail, ok: input.ok });
}

export function normalizeSettingsDiagnostic(value: unknown): DiagnosticResult | null {
  const input = recordOf(value);
  if (!input || typeof input.checkedAt !== 'string' || !Number.isFinite(Date.parse(input.checkedAt)) || !Array.isArray(input.checks)) return null;
  if (input.checks.length === 0 || input.checks.length > MAX_DIAGNOSTIC_CHECKS || typeof input.passed !== 'boolean') return null;
  const checks = input.checks.map(normalizedCheck);
  if (checks.some((check) => check === null)) return null;
  const validChecks = checks as DiagnosticCheck[];
  return Object.freeze({
    checkedAt: new Date(input.checkedAt).toISOString(),
    checks: Object.freeze(validChecks),
    passed: input.passed === true && validChecks.every((check) => check.ok),
  });
}

export interface SettingsEvidenceSnapshot {
  readonly version: typeof SETTINGS_EVIDENCE_VERSION;
  readonly compatibility: DiagnosticResult | null;
  readonly diagnostics: DiagnosticResult | null;
  readonly backendStatus: DiagnosticResult | null;
}

export const EMPTY_SETTINGS_EVIDENCE: SettingsEvidenceSnapshot = Object.freeze({
  version: SETTINGS_EVIDENCE_VERSION,
  compatibility: null,
  diagnostics: null,
  backendStatus: null,
});

export function normalizeSettingsEvidence(value: unknown): SettingsEvidenceSnapshot {
  const input = recordOf(value);
  if (!input || input.version !== SETTINGS_EVIDENCE_VERSION) return EMPTY_SETTINGS_EVIDENCE;
  return Object.freeze({
    version: SETTINGS_EVIDENCE_VERSION,
    compatibility: normalizeSettingsDiagnostic(input.compatibility),
    diagnostics: normalizeSettingsDiagnostic(input.diagnostics),
    backendStatus: normalizeSettingsDiagnostic(input.backendStatus),
  });
}

export function mergeSettingsEvidence(
  current: SettingsEvidenceSnapshot,
  patch: Partial<Pick<SettingsEvidenceSnapshot, 'compatibility' | 'diagnostics' | 'backendStatus'>>,
): SettingsEvidenceSnapshot {
  return Object.freeze({
    version: SETTINGS_EVIDENCE_VERSION,
    compatibility: patch.compatibility === undefined ? current.compatibility : normalizeSettingsDiagnostic(patch.compatibility),
    diagnostics: patch.diagnostics === undefined ? current.diagnostics : normalizeSettingsDiagnostic(patch.diagnostics),
    backendStatus: patch.backendStatus === undefined ? current.backendStatus : normalizeSettingsDiagnostic(patch.backendStatus),
  });
}
